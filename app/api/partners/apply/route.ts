import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { cleanPath } from "@/lib/events";
import { clientIp, fromOurSite, looksLikeBot } from "@/lib/human";
import { readFirstTouch, saveLead } from "@/lib/leads";
import { allowShared } from "@/lib/limits";
import { cleanApplication, savePartnerApplication } from "@/lib/partner-db";
import { SITE } from "@/lib/site";
import { trackServer } from "@/lib/track-server";

/**
 * Partner applications (components/partners/PartnerApply.tsx posts here). Same guards as /api/leads: our own pages
 * only, no bots, a honeypot, per-visitor and site-wide limits. Writes a pending partner (lib/partner-db.ts) and the
 * same lead row Praveen already watches on /admin/leads ("partner-apply"), so he sees it in both places. No call
 * booking, no email sent from here.
 */
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const h = req.headers;
  if (!fromOurSite(h, SITE.domain) || looksLikeBot(h)) return NextResponse.json({ ok: false, error: "Please use the form on rocco.works." }, { status: 403 });
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (body && typeof body.company === "string" && body.company.trim()) return NextResponse.json({ ok: true }); // honeypot
  if (!(await allowShared(`partner:${clientIp(h)}`, 8, 10 * 60_000)) || !(await allowShared("partner:all", 200, 3600_000))) return NextResponse.json({ ok: false, error: "Too many tries. Give it a minute." }, { status: 429 });
  const r = cleanApplication(body);
  if ("error" in r) return NextResponse.json({ ok: false, error: r.error, field: r.field }, { status: 400 });
  const p = r.partner;
  const [saved, lead] = await Promise.all([
    savePartnerApplication(p),
    saveLead({ email: p.email, name: p.name, lead_magnet: "partner-apply", source_page: cleanPath(body?.page) ?? "/partners", consent_marketing: false, consent_text: null, marketplace: null, notes: `partner application: ${p.type}, reaches ${p.reach}${p.website ? `, ${p.website}` : ""}`, ...readFirstTouch(h.get("cookie")) }),
  ]);
  if (!saved.ok) console.warn("[partners] application not saved to partners (run supabase/migrations/006_partners.sql?)", p.type);
  if (!saved.ok && !lead.ok) {
    return NextResponse.json({ ok: false, error: `Couldn't save that. Email ${SITE.contactEmail} and we'll add you by hand.` }, { status: 503 });
  }
  console.info(`[partners] new application: ${p.type}, reaches ${p.reach}${saved.duplicate ? " (already applied)" : ""}`);
  if (!saved.duplicate) trackServer(`partner-app:${createHash("sha256").update(p.email).digest("hex").slice(0, 16)}`, "partner_applied", { type: p.type, reach: p.reach ?? undefined });
  return NextResponse.json({ ok: true, duplicate: saved.duplicate });
}
