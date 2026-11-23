import { NextResponse } from "next/server";
import { clientIp, fromOurSite, looksLikeBot } from "@/lib/human";
import { cleanLead, saveLead } from "@/lib/leads";
import { allowShared } from "@/lib/limits";
import { SITE } from "@/lib/site";

/**
 * Lead magnet sign-ups (components/LeadCapture.tsx posts here). The only way a row gets into marketing_leads:
 * the table has no public access, and the service key stays on the server.
 *  - only from our own pages, never from bots;
 *  - a hidden "website" field real people never fill (honeypot): filled means a bot, which gets a polite ok;
 *  - the same shared limits the rest of the site uses (per visitor and site-wide);
 *  - source comes from the first-touch cookie, cleaned.
 * It stores the lead and nothing else. No email is sent from here.
 */
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const h = req.headers;
  if (!fromOurSite(h, SITE.domain) || looksLikeBot(h)) return NextResponse.json({ ok: false, error: "Please use the form on rocco.works." }, { status: 403 });
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (body && typeof body.website === "string" && body.website.trim()) return NextResponse.json({ ok: true });
  if (!(await allowShared(`lead:${clientIp(h)}`, 6, 10 * 60_000)) || !(await allowShared("lead:all", 600, 3600_000))) return NextResponse.json({ ok: false, error: "Too many tries. Give it a minute." }, { status: 429 });
  const r = cleanLead(body, h.get("cookie"));
  if ("error" in r) return NextResponse.json({ ok: false, error: r.error }, { status: 400 });
  const saved = await saveLead(r.lead);
  if (!saved.ok) return NextResponse.json({ ok: false, error: "Couldn't save that. Your download still works." }, { status: 503 });
  return NextResponse.json({ ok: true });
}
