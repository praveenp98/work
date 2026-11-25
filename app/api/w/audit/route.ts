import { NextResponse } from "next/server";
import { accessOf } from "@/lib/access";
import { AUDIT_IP_LIMIT, canStartAudit, startAudit } from "@/lib/free-audit";
import { clientIp, fromOurSite, looksLikeBot } from "@/lib/human";
import { allowShared } from "@/lib/limits";
import { SITE } from "@/lib/site";
import { getStore } from "@/lib/store";
import { trackServer } from "@/lib/track-server";
import { loadWorkspace } from "@/lib/workspace";

/**
 * "See my account free first" on the plan step (signed up, not paid): start the free read-only audit for this team
 * (lib/free-audit.ts). Once per team, a few per IP a day, real taps from rocco.works only. Nothing sensitive is logged.
 */
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const h = req.headers;
  const why = h.get("x-rocco-tap") !== "1" ? "no tap" : !fromOurSite(h, SITE.domain) ? "not from rocco.works" : looksLikeBot(h);
  if (why) return NextResponse.json({ ok: false, error: why }, { status: 403 });
  const b = (await req.json().catch(() => ({}))) as { t?: string };
  const store = getStore();
  const ws = store && b.t ? await loadWorkspace(store, b.t) : null;
  if (!store || !ws) return NextResponse.json({ ok: false }, { status: 400 });
  if (accessOf(ws) === "audit") return NextResponse.json({ ok: true, already: true });
  if (!canStartAudit(ws)) return NextResponse.json({ ok: false, error: ws.hiredAt || ws.licensed ? "Your Rocco already had a plan, so the free audit isn't available. Rehire Rocco to keep going." : "The free audit isn't available for this Rocco." }, { status: 409 });
  if (!(await allowShared(`audit:${clientIp(h)}`, AUDIT_IP_LIMIT.max, AUDIT_IP_LIMIT.windowMs))) return NextResponse.json({ ok: false, error: "Too many free audits from here today. Try again tomorrow, or hire Rocco." }, { status: 429 });
  startAudit(ws);
  await store.saveWorkspace(ws);
  trackServer(ws.id, "audit_started", { method: "dashboard" });
  return NextResponse.json({ ok: true });
}
