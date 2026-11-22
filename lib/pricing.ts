/**
 * Hire Rocco pricing (Nov 22, 2026, Praveen): $119 a month, or $1,190 a year (2 months free), annual shown first.
 * 30-day money-back guarantee on both. In Dodo: two subscription products (DODO_PRODUCT_ID_ANNUAL,
 * DODO_PRODUCT_ID_MONTHLY; docs/DODO-SETUP.md). Dodo's payments API stays the source of truth for who hired Rocco.
 */
export type PlanId = "annual" | "monthly";
export const PLAN = { monthlyCents: 11900, annualCents: 119000, guaranteeDays: 30 } as const;

export const dollars = (c: number) => `$${Math.round(c / 100).toLocaleString("en-US")}`;
/** Monthly cost of Rocco on a plan, in dollars (what the dashboard compares savings against). */
export const monthlyCost = (plan: PlanId = "annual") => (plan === "annual" ? PLAN.annualCents / 12 : PLAN.monthlyCents) / 100;

/** Copy used everywhere, so the price is said the same way on every page, text and tool. */
export const PRICE = {
  annual: dollars(PLAN.annualCents), // "$1,190"
  monthly: dollars(PLAN.monthlyCents), // "$119"
  perMonthAnnual: `$${Math.round(PLAN.annualCents / 1200)}`, // "$99"
  short: `${dollars(PLAN.annualCents)} a year (2 months free)`,
  then: `or ${dollars(PLAN.monthlyCents)} a month`,
  from: `$${Math.round(PLAN.annualCents / 1200)}/mo billed yearly`,
  guarantee: `${PLAN.guaranteeDays}-day money-back guarantee`,
  line: `${dollars(PLAN.annualCents)} a year (2 months free) or ${dollars(PLAN.monthlyCents)} a month. Whole team, cancel anytime, ${PLAN.guaranteeDays}-day money-back guarantee.`,
} as const;

export interface PriceState {
  sold: number; // teams that have hired Rocco (unique paying customers)
  priceCents: number; // annual plan
  renewCents: number; // monthly plan
  nextPriceCents: null; // kept for older callers: no ladder any more
  live: boolean; // true if the count came from Dodo
}

export function stateFor(sold: number, live: boolean): PriceState {
  return { sold, priceCents: PLAN.annualCents, renewCents: PLAN.monthlyCents, nextPriceCents: null, live };
}
