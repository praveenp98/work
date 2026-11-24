export interface RoastSettings {
  /** Target ACoS as a fraction (0.30 = 30%). */
  targetAcos: number;
  /** Clicks with zero orders before a term counts as a leak and gets a negative. */
  minClicksNegative: number;
  /** Orders needed before a search term is harvested as its own exact keyword. */
  harvestMinOrders: number;
  /** Max bid move per step, as a fraction (0.20 = ±20%). */
  bidCap: number;
  /** Days at the end of a daily report whose clicks don't count yet: orders can still be attributed. */
  lagDays?: number;
  /** Break-even ACoS (margin before ads), as a fraction. Defaults to 1.5 × target. */
  breakevenAcos?: number;
  /** Campaign names (or parts) the team marked as meant-to-spend: never auto-negated. */
  protectedCampaigns?: string[];
  /** Goal per product: a word from its campaign names → profit (tighter target), balance, or growth (looser). */
  goals?: ProductGoal[];
}

export type Goal = "profit" | "balance" | "growth";
export interface ProductGoal { match: string; goal: Goal }
/** Profit: 20% under the target ACoS. Growth: 30% over it (buy rank and new customers). Balance: the target. */
export const GOAL_MULT: Record<Goal, number> = { profit: 0.8, balance: 1, growth: 1.3 };

/** The target ACoS for one campaign: the brand target, moved by the goal of the product in its name (first match). */
export function targetFor(s: Pick<RoastSettings, "targetAcos" | "goals">, campaign?: string): number {
  if (!campaign || !s.goals?.length) return s.targetAcos;
  const c = campaign.toLowerCase();
  const g = s.goals.find((x) => x.match && c.includes(x.match.toLowerCase()));
  return g ? s.targetAcos * GOAL_MULT[g.goal] : s.targetAcos;
}

export const DEFAULT_SETTINGS: RoastSettings = {
  targetAcos: 0.3,
  minClicksNegative: 10,
  harvestMinOrders: 2,
  bidCap: 0.2,
  lagDays: 3,
};
