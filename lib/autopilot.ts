import { hasAccess } from "./access";
import { applyMany } from "./apply";
import { datadoeOn } from "./datadoe";
import { applyTuning, accountMemory, tuning } from "./memory";
import type { Proposal } from "./rules/types";
import { spend } from "./security";
import type { Store, Workspace } from "./store/types";
import { applyChanges, latestRuns } from "./workspace";

/**
 * The autonomy ladder (the team picks it on the dashboard; default is level 1):
 *  1 "approve"     every change waits for a tap (today's behaviour).
 *  2 "guardrails"  money-saving changes inside the guardrails are made by themselves each morning: negatives, bid
 *                  decreases, budget cuts on losing campaigns. Everything that spends more still waits for a tap.
 *  3 "auto"        every one-tap change is made by itself (also bid raises and budget raises). New campaigns, restock
 *                  plans, placements and structure still wait.
 * Choosing level 2 or 3 is the team's explicit standing approval (Amazon Agent Policy: approved, logged, reversible).
 * Guardrails always apply: ±20% bid cap per step (rules engine), at most MAX changes a day, the daily write limit,
 * the kill switch, skip-learning (things the team skipped twice don't auto-apply), the one-week check + undo.
 */
export type Autonomy = "approve" | "guardrails" | "auto";
export const MAX_AUTO_PER_DAY = 25;

export function autoEligible(p: Proposal, level: Autonomy): boolean {
  if (level === "approve") return false;
  const down = typeof p.proposed === "number" && typeof p.current === "number" && p.proposed < p.current;
  if (p.kind === "negative") return true;
  if (p.kind === "bid" || p.kind === "budget") return level === "auto" || down;
  if (p.kind === "ads_down") return p.current === 0; // out of stock: pausing its own ads only saves money, and undoes in one tap
  return false; // harvest (new campaign), placement, structure: always a tap
}

export interface AutoResult { made: Proposal[]; failed: number }

/** Run once per account after the morning pull (app/api/cron/amazon/batch). */
export async function runAutopilot(store: Store, wsId: string, account: { id: string; name: string }): Promise<AutoResult> {
  const ws = await store.getWorkspaceById(wsId);
  const level: Autonomy = ws?.autonomy ?? "approve";
  if (!ws || level === "approve" || !hasAccess(ws) || !datadoeOn() || process.env.ROCCO_WRITES_OFF === "1") return { made: [], failed: 0 };
  const brand = account.name;
  const runs = await latestRuns(store, ws, brand);
  const actions = await store.listActions(ws.id, { brand });
  const done = new Set(actions.map((a) => `${a.runId}:${a.code}`));
  const open = runs.flatMap((r) => r.proposals.map((p) => ({ p, runId: r.id }))).filter((x) => !done.has(`${x.runId}:${x.p.code}`));
  // Respect what the team taught Rocco: skipped kinds/targets don't get made automatically.
  const { shown } = applyTuning(open.map((x) => x.p), tuning(accountMemory(actions, ws.skips), ws.skips));
  const ok = new Set(shown.map((p) => p.code));
  const todo = open.filter((x) => ok.has(x.p.code) && autoEligible(x.p, level)).sort((a, b) => b.p.valueMonthly - a.p.valueMonthly).slice(0, MAX_AUTO_PER_DAY);
  if (!todo.length) return { made: [], failed: 0 };
  if (!(await spend(store, ws, "writes", todo.length))) return { made: [], failed: 0 };
  const day = new Date().toISOString().slice(0, 10);
  const results = await applyMany(account.id, todo.map((x) => x.p), `rocco:${ws.id}:auto:${day}`);
  const made: Proposal[] = [];
  let failed = 0;
  for (const r of results) {
    const x = todo.find((t) => t.p.code === r.code)!;
    if (r.status === "applied") {
      await applyChanges(store, ws, [r.code], { brand, runId: x.runId, note: `made by Rocco automatically (${level === "auto" ? "fully autonomous" : "inside guardrails"})${r.actionId ? ` (action ${r.actionId})` : ""}${r.paused ? `: paused ${r.paused} ads (out of stock)` : ""}`, patch: x.p.ids?.adIds ? { [r.code]: { ids: x.p.ids } } : undefined }).catch(() => null);
      made.push(x.p);
    } else if (r.status === "failed") failed++;
  }
  return { made, failed };
}

/** The line added to the morning message. */
export function autopilotLine(r: AutoResult, ws: Pick<Workspace, "autonomy">): string | null {
  if (!r.made.length) return null;
  const save = Math.round(r.made.reduce((t, p) => t + p.valueMonthly, 0));
  return `🤖 Made ${r.made.length} change${r.made.length === 1 ? "" : "s"} on my own (${ws.autonomy === "auto" ? "fully autonomous" : "inside your guardrails"})${save ? `, ~$${save.toLocaleString("en-US")}/mo` : ""}. Each is in the change log, checked in a week, one tap to undo.`;
}
