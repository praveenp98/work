import { NextResponse } from "next/server";
import { hasAccess } from "@/lib/access";
import { datadoeOn } from "@/lib/datadoe";
import { LIMIT_MSG, spend } from "@/lib/security";
import { getStore } from "@/lib/store";
import { applyTidy, undoTidy } from "@/lib/tidy-apply";
import { scanTidy } from "@/lib/tidy-scan";
import { loadWorkspace } from "@/lib/workspace";

/**
 * Tidy your campaigns.
 *   scan  → read campaigns, targets, ads, products, 30 days of results (~10 DataDoe tokens), save the plan
 *   apply → rename / portfolios / pause idle (what the seller ticked), remember it for Undo
 *   undo  → old names back, paused campaigns back on
 */
export const maxDuration = 300;

export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as { t?: string; account?: string; action?: string; includePaused?: boolean; rename?: boolean; portfolios?: boolean; pauseIdle?: boolean; ids?: unknown };
  const store = getStore();
  const ws = store && b.t ? await loadWorkspace(store, b.t) : null;
  if (!store || !ws) return NextResponse.json({ ok: false }, { status: 400 });
  if (!hasAccess(ws)) return NextResponse.json({ ok: false, error: "Hire Rocco to tidy your campaigns." }, { status: 402 });
  const account = ws.amazon?.accounts?.find((a) => a.id === b.account) ?? ws.amazon?.accounts?.[0];
  if (!datadoeOn() || !account) return NextResponse.json({ ok: false, error: "Connect your Amazon first." }, { status: 400 });
  const cur = ws.tidy?.[account.id] ?? {};
  const save = async (v: typeof cur) => { const f = (await store.getWorkspaceById(ws.id)) ?? ws; f.tidy = { ...(f.tidy ?? {}), [account.id]: v }; await store.saveWorkspace(f); };

  if (b.action === "scan") {
    if (!(await spend(store, ws, "tidyScan"))) return NextResponse.json({ ok: false, error: LIMIT_MSG.tidyScan }, { status: 429 });
    try {
      const plan = await scanTidy(account.id, { includePaused: !!b.includePaused });
      await save({ ...cur, plan });
      return NextResponse.json({ ok: true, plan });
    } catch (e) {
      return NextResponse.json({ ok: false, error: `I couldn't read your campaigns yet (${e instanceof Error ? e.message.slice(0, 120) : "DataDoe"}). Amazon may still be sending your history.` }, { status: 502 });
    }
  }
  if (b.action === "apply") {
    if (!cur.plan) return NextResponse.json({ ok: false, error: "Scan first." }, { status: 400 });
    if (!(await spend(store, ws, "tidyApply"))) return NextResponse.json({ ok: false, error: LIMIT_MSG.tidyApply }, { status: 429 });
    const ids = Array.isArray(b.ids) ? b.ids.map(String).filter((x) => /^\d{1,24}$/.test(x)) : undefined;
    const done = await applyTidy(account.id, cur.plan, { rename: !!b.rename, portfolios: !!b.portfolios, pauseIdle: !!b.pauseIdle, ids }, `rocco:${ws.id}:tidy:${cur.plan.at}`);
    await save({ ...cur, done });
    return NextResponse.json({ ok: true, done });
  }
  if (b.action === "undo") {
    if (!cur.done) return NextResponse.json({ ok: false, error: "Nothing to undo." }, { status: 400 });
    const errors = await undoTidy(account.id, cur.done, `rocco:${ws.id}:tidy-undo:${cur.done.at}`);
    if (!errors.length) await save({ ...cur, done: undefined });
    return NextResponse.json({ ok: !errors.length, errors });
  }
  return NextResponse.json({ ok: false }, { status: 400 });
}
