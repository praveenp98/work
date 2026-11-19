/**
 * Hire Rocco pricing (Nov 19, 2026, Praveen): quarterly. $199 for the first 3 months, then $249 every 3 months.
 * No price ladder any more. In Dodo: one subscription product at $249 every 3 months, plus a discount code worth
 * $50 off the first cycle (DODO_DISCOUNT_CODE), added to every checkout link. Dodo's payments API stays the source
 * of truth for how many teams hired Rocco.
 */
export const PLAN = { firstCents: 19900, renewCents: 24900, months: 3 } as const;

export const dollars = (c: number) => `$${Math.round(c / 100)}`;

/** Copy used everywhere, so the price is said the same way on every page, text and tool. */
export const PRICE = {
  first: dollars(PLAN.firstCents), // "$199"
  renew: dollars(PLAN.renewCents), // "$249"
  short: `${dollars(PLAN.firstCents)} for your first 3 months`,
  then: `then ${dollars(PLAN.renewCents)} every 3 months`,
  line: `${dollars(PLAN.firstCents)} for your first 3 months, then ${dollars(PLAN.renewCents)} every 3 months. Whole team, cancel anytime.`,
} as const;

export interface PriceState {
  sold: number; // teams that have hired Rocco (unique paying customers)
  priceCents: number; // what a new team pays today (first quarter)
  renewCents: number; // every quarter after that
  nextPriceCents: null; // kept for older callers: no ladder any more
  live: boolean; // true if the count came from Dodo
}

export function stateFor(sold: number, live: boolean): PriceState {
  return { sold, priceCents: PLAN.firstCents, renewCents: PLAN.renewCents, nextPriceCents: null, live };
}
