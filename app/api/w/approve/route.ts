import { NextResponse } from "next/server";
import { hasAccess } from "@/lib/access";
import { applyMany, type ApplyOutcome } from "@/lib/apply";
import { datadoeOn } from "@/lib/datadoe";
import { howTo } from "@/lib/howto";
import type { Proposal } from "@/lib/rules/types";
import { LIMIT_MSG, spend } from "@/lib/security";
import { getStore } from "@/lib/store";
import { approvedBy } from "@/lib/team";
import { applyChanges, clearPending, FREE_PROPOSALS, latestRuns, loadWorkspace, queuePending } from "@/lib/workspace";

/**
 * Approve fixes from the dashboard.
 *  - Amazon connected directly (DataDoe): Rocco makes each change in Amazon (dry run first), logs it, and checks the
 *    result on a later day. Changes Rocco can't make yet come back with exact steps.
 *  - Otherwise (Claude / report inbox teams): queued like texting "YES N1".
 * The top fix of each check is free; the rest need a plan.
 */
export const maxDuration = 60;

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
  const runs = await latestRuns(store, ws, brand);
  const allowed = new Map<string, boolean>();
  const props = new Map<string, { p: Proposal; runId: string }>();
  for (const r of runs) r.proposals.forEach((p, i) => { allowed.set(p.code, hasAccess(ws) || i < FREE_PROPOSALS); props.set(p.code, { p, runId: r.id }); });
  const locked = codes.filter((c) => allowed.get(c) === false);
  const ok = codes.filter((c) => allowed.get(c));

  const account = ws.amazon?.accounts?.find((a) => a.name === brand) ?? ws.amazon?.accounts?.[0];
  if (datadoeOn() && account && ok.length) {
    // Changes in a real Amazon account: paying teams only, under a daily safety cap.
    if (!hasAccess(ws)) return NextResponse.json({ ok: false, error: "Hire Rocco to make changes in Amazon." }, { status: 402 });
    const done = new Set((await store.listActions(ws.id, { brand })).map((a) => `${a.runId}:${a.code}`));
    const out: (ApplyOutcome & { how?: string })[] = [];
    const todo = ok.filter((c) => { const { runId } = props.get(c)!; if (done.has(`${runId}:${c}`)) { out.push({ code: c, status: "applied" }); return false; } return true; });
    if (todo.length && !(await spend(store, ws, "writes", todo.length))) return NextResponse.json({ ok: false, error: LIMIT_MSG.writes }, { status: 429 });
    const by = await approvedBy(ws);
    // One job = one batch per change type (lib/apply.ts).
    const results = await applyMany(account.id, todo.map((c) => props.get(c)!.p), `rocco:${ws.id}:${todo.map((c) => `${props.get(c)!.runId.slice(0, 8)}${c}`).join(",").slice(0, 80)}`);
    for (const r of results) {
      const { p } = props.get(r.code)!;
      if (r.status === "applied") await applyChanges(store, ws, [r.code], { brand, note: `made by Rocco in Amazon${r.actionId ? ` (action ${r.actionId})` : ""}${by}` });
      out.push(r.status === "applied" ? r : { ...r, how: howTo(p) });
    }
    return NextResponse.json({ ok: true, direct: true, results: out, locked });
  }

  const already = new Set((ws.pending ?? []).filter((p) => p.type === "apply").flatMap((p) => p.codes));
  const queue = ok.filter((c) => !already.has(c));
  if (queue.length) await queuePending(store, ws, { type: "apply", codes: queue, brand, at: new Date().toISOString(), by: "dashboard" });
  return NextResponse.json({ ok: true, approved: queue, locked });
}
