import { NextResponse } from "next/server";
import { hasAccess } from "@/lib/access";
import { checkPlan, newPlan, planAction, planFresh, resultText, type ActionPlan } from "@/lib/action-agent";
import { datadoeOn, runAction, waitForAction } from "@/lib/datadoe";
import { actionByType, itemCount } from "@/lib/doe-actions";
import { allow } from "@/lib/human";
import { LIMIT_MSG, spend } from "@/lib/security";
import { getStore } from "@/lib/store";
import { approvedBy } from "@/lib/team";
import { trackServer } from "@/lib/track-server";
import { loadWorkspace } from "@/lib/workspace";

/**
 * "Tell Rocco what to change" (any DataDoe Action, lib/doe-actions.ts):
 *  { t, account, op: "plan", text }        Opus picks the Action, looks up IDs, dry-runs it → a plan to approve (or an answer/question)
 *  { t, account, op: "run", id, sure? }    seller approved: check again, make it live (idempotent), wait for Amazon, log it
 *  { t, account, op: "cancel", id }        drop a plan
 *  { t, account, op: "list" }              recent plans and results
 * Plans live on the workspace so the exact previewed change is what runs; they expire after 30 minutes.
 */
export const maxDuration = 300;

type Body = { t?: string; account?: string; op?: string; text?: string; id?: string; sure?: boolean };

export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as Body;
  const store = getStore();
  const ws = store && b.t ? await loadWorkspace(store, b.t) : null;
  if (!store || !ws) return NextResponse.json({ ok: false }, { status: 400 });
  if (!hasAccess(ws)) return NextResponse.json({ ok: false, error: "Hire Rocco to make changes in Amazon." }, { status: 402 });
  if (!datadoeOn()) return NextResponse.json({ ok: false, error: "Connect Amazon first." }, { status: 400 });
  const account = ws.amazon?.accounts?.find((a) => a.id === b.account) ?? ws.amazon?.accounts?.[0];
  if (!account) return NextResponse.json({ ok: false, error: "Connect an Amazon account first." }, { status: 400 });
  if (!allow(`actions:${ws.id}`, 40, 10 * 60_000)) return NextResponse.json({ ok: false, error: "That's a lot of requests. Give it a minute." }, { status: 429 });
  const plans = (ws.amazon!.actionPlans ??= []);
  const save = () => store.saveWorkspace(ws);

  if (b.op === "list") return NextResponse.json({ ok: true, plans: plans.filter((p) => p.account === account.id).slice(-30).reverse() });

  if (b.op === "plan") {
    const text = String(b.text ?? "").trim();
    if (text.length < 4) return NextResponse.json({ ok: false, error: "Tell Rocco what to change." }, { status: 400 });
    if (!(await spend(store, ws, "actionPlans", 1))) return NextResponse.json({ ok: false, error: LIMIT_MSG.actionPlans }, { status: 429 });
    const out = await planAction(text, { account: account.id, accountLabel: `${account.name} (Amazon ${account.country})` });
    trackServer(ws.id, "action_planned", { kind: "plan" in out ? "plan" : "answer" in out ? "answer" : "question" in out ? "question" : "error" });
    if ("plan" in out) {
      const by = (await approvedBy(ws)).replace(" · approved by ", "") || "the owner";
      const p = newPlan({ ...out.plan, account: account.id, request: text.slice(0, 500), by });
      plans.push(p); ws.amazon!.actionPlans = plans.slice(-100); await save();
      return NextResponse.json({ ok: true, plan: p, meta: actionByType(p.type) });
    }
    return NextResponse.json({ ok: !("error" in out), ...out });
  }

  const p = plans.find((x) => x.id === b.id && x.account === account.id);
  if (!p) return NextResponse.json({ ok: false, error: "That change isn't waiting any more." }, { status: 404 });

  if (b.op === "cancel") { if (p.status === "planned") { p.status = "cancelled"; await save(); } return NextResponse.json({ ok: true }); }

  if (b.op === "run") {
    if (!planFresh(p)) return NextResponse.json({ ok: false, error: "This preview is over 30 minutes old. Ask again so Rocco checks the account fresh." }, { status: 409 });
    const meta = actionByType(p.type);
    if (meta?.risk === "high" && !b.sure) return NextResponse.json({ ok: false, error: "Tick the box to confirm. This one can't simply be undone." }, { status: 400 });
    if (!(await spend(store, ws, "writes", itemCount(p.type, p.details)))) return NextResponse.json({ ok: false, error: LIMIT_MSG.writes }, { status: 429 });
    const still = await checkPlan(account.id, p.type, p.details);
    if (still) { p.status = "failed"; p.error = still; await save(); return NextResponse.json({ ok: false, error: still, plan: p }); }
    p.status = "running"; await save();
    const live = await runAction(account.id, p.type, p.details, { idempotencyKey: `rocco:${ws.id}:doe:${p.id}` });
    if (!live.ok || !live.id) { p.status = "failed"; p.error = live.error; await save(); return NextResponse.json({ ok: false, error: `Amazon didn't take it: ${live.error ?? "unknown"}`, plan: p }); }
    const done = await waitForAction(live.id, 25);
    const failed = !!done && /FAIL|ERROR|REJECT/i.test(done.status);
    Object.assign<ActionPlan, Partial<ActionPlan>>(p, { status: failed ? "failed" : "done", actionId: live.id, result: resultText(done), doneAt: new Date().toISOString(), ...(failed ? { error: resultText(done) } : {}) });
    await save();
    trackServer(ws.id, "action_run", { type: p.type, ok: !failed });
    return NextResponse.json({ ok: !failed, plan: p });
  }

  return NextResponse.json({ ok: false, error: "Unknown request." }, { status: 400 });
}
