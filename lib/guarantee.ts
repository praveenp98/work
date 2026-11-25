/**
 * Money-back guarantee length, in days (Nov 25, 2026, Praveen: 7 → 14). The one place it is set: pricing copy
 * (lib/pricing.ts PLAN.guaranteeDays), partner payouts (lib/partners.ts guaranteeEnds) and every page read it from here.
 * Why 14: Rocco measures each change a week after it is made, so two weeks covers at least one measured result.
 */
export const GUARANTEE_DAYS = 14;
export const GUARANTEE_MS = GUARANTEE_DAYS * 86_400_000;
