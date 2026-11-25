import type { Proposal } from "./rules/types";
import type { Action, Run } from "./store/types";

/**
 * How today's jobs relate to earlier days (Nov 25 fix list #8).
 *  - Cooldown: nothing Rocco changed in the last 7 days is suggested again (its result isn't in yet).
 *  - Tags: "new" (first time suggested), "repeat" (suggested before, not acted on), "follow-up" (changed 7+ days ago,
 *    measured, and still off target).
 *  - Week: distinct fixes found over the last 7 days, each counted once at its latest value (no double counting
 *    when the same keyword shows up again tomorrow).
 */
export type Tag = "new" | "repeat" | "follow-up";
const DAY = 86_400_000;

/** Same thing in Amazon = same key, whatever day it was suggested. */
export const keyOf = (p: Pick<Proposal, "kind" | "campaign" | "adGroup" | "target" | "matchType">) =>
  [p.kind === "bid" ? "bid" : p.kind, p.campaign, p.adGroup, p.target, p.matchType ?? ""].join("\u0001").toLowerCase();

export function cooldown(ps: Proposal[], actions: Action[], now = new Date()): { kept: Proposal[]; cooling: number } {
  const recent = new Set(actions.filter((a) => now.getTime() - new Date(a.appliedAt).getTime() < 7 * DAY && a.status !== "reverted").map((a) => keyOf(a.proposal)));
  const kept = ps.filter((p) => !recent.has(keyOf(p)));
  return { kept, cooling: ps.length - kept.length };
}

export function tagAll(ps: Proposal[], earlierRuns: Run[], actions: Action[]): Record<string, Tag> {
  const seen = new Set(earlierRuns.flatMap((r) => r.proposals.map(keyOf)));
  const changed = new Set(actions.filter((a) => a.status !== "reverted").map((a) => keyOf(a.proposal)));
  return Object.fromEntries(ps.map((p) => {
    const k = keyOf(p);
    return [p.code, changed.has(k) ? "follow-up" : seen.has(k) ? "repeat" : "new"];
  }));
}

/** Distinct fixes in runs from the last 7 days, each at its newest value. */
export function weekTotal(runs: Run[], actions: Action[], now = new Date()): { found: number; value: number; approved: number } {
  const latest = new Map<string, number>();
  for (const r of [...runs].filter((r) => now.getTime() - new Date(r.createdAt).getTime() < 7 * DAY).sort((a, b) => a.createdAt.localeCompare(b.createdAt))) {
    for (const p of r.proposals) latest.set(keyOf(p), p.valueMonthly);
  }
  const approved = actions.filter((a) => now.getTime() - new Date(a.appliedAt).getTime() < 7 * DAY).length;
  return { found: latest.size, value: [...latest.values()].reduce((t, v) => t + v, 0), approved };
}
