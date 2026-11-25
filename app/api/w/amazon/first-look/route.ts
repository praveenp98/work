import { NextResponse } from "next/server";
import { accessOf, AUDIT_DAYS } from "@/lib/access";
import { datadoeOn } from "@/lib/datadoe";
import { pullFirstLook } from "@/lib/first-look";
import { allow } from "@/lib/human";
import { getStore } from "@/lib/store";
import { loadWorkspace } from "@/lib/workspace";

export const maxDuration = 300;
const FRESH = 6 * 3_600_000;

/**
 * Instant first look (lib/first-look.ts): live listings + Amazon's issue check, shown while the history loads.
 * Read-only. Paid, trial and active free-audit teams. Cached ~6h per account; at most 4 fresh looks an hour per team
 * (each is one DataDoe export + one read action).
 */
export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as { t?: string };
  const store = getStore();
  const ws = store && b.t ? await loadWorkspace(store, b.t) : null;
  if (!store || !ws) return NextResponse.json({ ok: false }, { status: 400 });
  const acc = accessOf(ws);
  const auditLive = acc === "audit" && ws.audit?.startedAt && Date.now() - new Date(ws.audit.startedAt).getTime() < AUDIT_DAYS * 86_400_000;
  if (acc !== "paid" && acc !== "trial" && !auditLive) return NextResponse.json({ ok: false, error: "Hire Rocco or start a free audit first." }, { status: 402 });
  const accounts = (ws.amazon?.accounts ?? []).slice(0, 2);
  if (!datadoeOn() || !accounts.length) return NextResponse.json({ ok: true, looks: [] });
  const cache = ws.amazon!.firstLook ?? {};
  const stale = accounts.filter((a) => !cache[a.id] || cache[a.id].error || Date.now() - new Date(cache[a.id].at).getTime() > FRESH);
  if (stale.length && allow(`look:${ws.id}`, 4, 60 * 60_000)) {
    for (const a of stale) cache[a.id] = await pullFirstLook(a.id).catch((e) => ({ at: new Date().toISOString(), skus: 0, active: 0, findings: [], checked: 0, error: /\(40[13]\)|429/.test(String(e)) ? "Amazon is busy. Try again in a minute." : "Amazon hasn't sent your listings yet. I'll try again in a few minutes." }));
    ws.amazon!.firstLook = cache;
    await store.saveWorkspace(ws);
  }
  return NextResponse.json({ ok: true, looks: accounts.map((a) => ({ name: a.name, country: a.country, look: cache[a.id] ?? null })) });
}
