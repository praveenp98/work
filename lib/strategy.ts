import type { BrandSettings } from "./store/types";
import type { Goal } from "./rules/settings";

/**
 * The owner's strategy, set once during onboarding (while Amazon's first load runs) and editable any time:
 * main goal, target ACoS, margin (→ break-even), a monthly ad budget ceiling, campaigns/terms never to cut, goal per
 * product, autonomy, and anything Rocco should know. Turned into the plain-English plan shown back to them and fed to
 * every AI answer, so "you set the strategy, Rocco does the work" is literal.
 */
export type Autonomy = "approve" | "guardrails" | "auto";

/** Suggested target ACoS for each main goal (they can change it). */
export const GOAL_TARGET: Record<Goal, number> = { profit: 0.2, balance: 0.3, growth: 0.4 };
export const GOAL_LABEL: Record<Goal, string> = { profit: "Profit first", balance: "Balance", growth: "Growth first" };
export const GOAL_LINE: Record<Goal, string> = {
  profit: "Squeeze waste, protect margin, only scale what's clearly profitable.",
  balance: "Grow sales while holding a steady ACoS.",
  growth: "Buy rank and new customers; accept a higher ACoS for a while.",
};
const AUTONOMY_LINE: Record<Autonomy, string> = {
  approve: "I ask before every change.",
  guardrails: "Money-saving moves (blocking wasted searches, lowering bids, cutting losing budgets) I make myself and log; anything that spends more waits for you.",
  auto: "I make every one-tap change myself inside your limits (±20% a step, 25 a day), log each one, and you can undo any. New campaigns and restock still wait for you.",
};

const pct = (f: number) => `${Math.round(f * 100)}%`;
const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

/** Break-even ACoS from margin before ads (price minus product, fees and shipping, as a share of price). */
export const breakevenFromMargin = (marginPct: number) => Math.min(0.95, Math.max(0.05, marginPct / 100));

export function strategySet(s?: BrandSettings) { return !!s?.strategySetAt; }

/** The plan, as Rocco says it back: one line per commitment. */
export function strategyLines(s: BrandSettings & { targetAcos: number; breakevenAcos: number }, autonomy: Autonomy = "approve"): string[] {
  const L: string[] = [];
  const g = s.mainGoal ?? "balance";
  L.push(`${GOAL_LABEL[g]}: ${GOAL_LINE[g]}`);
  L.push(`Keep ACoS around ${pct(s.targetAcos)}${s.breakevenAcos ? `, and never let a campaign stay above break-even (${pct(s.breakevenAcos)})` : ""}.`);
  if (s.monthlyAdBudget) L.push(`Total ad budget stays under ${money(s.monthlyAdBudget)} a month: I won't raise budgets past it.`);
  const prot = [...new Set([...(s.protectedCampaigns ?? []), ...(s.protectedTerms ?? [])])];
  if (prot.length) L.push(`Never cut: ${prot.slice(0, 6).map((p) => `“${p}”`).join(", ")}${prot.length > 6 ? ` +${prot.length - 6}` : ""}.`);
  const per = (s.goals ?? []).filter((x) => x.goal !== g);
  if (per.length) L.push(`Exceptions: ${per.slice(0, 5).map((x) => `${x.match} → ${GOAL_LABEL[x.goal].toLowerCase()}`).join(", ")}.`);
  L.push(AUTONOMY_LINE[autonomy]);
  return L;
}

/** For AI prompts (Ask Rocco, texts, the morning manager pass). */
export function strategyText(s: BrandSettings & { targetAcos: number; breakevenAcos: number }, autonomy?: Autonomy): string {
  if (!strategySet(s)) return "";
  return `Owner's strategy (follow it): ${strategyLines(s, autonomy).join(" ")}${s.notes ? ` Owner's notes: ${s.notes}` : ""}`;
}
