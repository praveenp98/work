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
}

export const DEFAULT_SETTINGS: RoastSettings = {
  targetAcos: 0.3,
  minClicksNegative: 10,
  harvestMinOrders: 2,
  bidCap: 0.2,
  lagDays: 3,
};
