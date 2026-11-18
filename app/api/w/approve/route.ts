import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { clearPending, FREE_PROPOSALS, latestRuns, loadWorkspace, queuePending } from "@/lib/workspace";

/**
 * Approve (or cancel) fixes from the dashboard. Same queue as texting "YES N1": the team's AI applies queued codes
 * through Amazon's connector on its next check, then Rocco logs and grades them. Free plan: top 3 per report.
 */
export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as { t?: string; brand?: string; codes?: unknown; cancel?: boolean };
  const store = getStore();
  const ws = store && b.t ? await loadWorkspace(store, b.t) : null;
  const codes = Array.isArray(b.codes) ? b.codes.map(String).map((c) => c.toUpperCase()).filter((c) => /^[A-Z]\d{1,3}$/.test(c)).slice(0, 50) : [];
  if (!store || !ws || !codes.length) return NextResponse.json({ ok: false }, { status: 400 });
  const brand = b.brand || Object.keys(ws.brands)[0] || "main";
  if (b.cancel) {
    await clearPending(store, ws, "apply", codes);
    return NextResponse.json({ ok: true, cancelled: codes });
  }
  const allowed = new Map<string, boolean>();
  for (const r of await latestRuns(store, ws, brand)) r.proposals.forEach((p, i) => allowed.set(p.code, ws.licensed || i < FREE_PROPOSALS));
  const already = new Set((ws.pending ?? []).filter((p) => p.type === "apply").flatMap((p) => p.codes));
  const ok = codes.filter((c) => allowed.get(c) && !already.has(c));
  const locked = codes.filter((c) => allowed.get(c) === false);
  if (ok.length) await queuePending(store, ws, { type: "apply", codes: ok, brand, at: new Date().toISOString(), by: "dashboard" });
  return NextResponse.json({ ok: true, approved: ok, locked });
}
