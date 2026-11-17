/**
 * Hire Rocco price ladder: $99, +$10 every 5 sales, capped at $499.
 * Source of truth for sales = Dodo's payments API (succeeded payments for the product).
 */
export const LADDER = { startCents: 9900, stepCents: 1000, every: 5, capCents: 49900 } as const;

export function priceCentsForSold(sold: number): number {
  return Math.min(LADDER.capCents, LADDER.startCents + LADDER.stepCents * Math.floor(Math.max(0, sold) / LADDER.every));
}

export interface PriceState {
  sold: number;
  priceCents: number; // what the next buyer pays
  nextPriceCents: number | null; // null at cap
  salesUntilNext: number | null;
  founderNumber: number; // the next buyer's founder #
  live: boolean; // true if the count came from Dodo
}

export function stateFor(sold: number, live: boolean): PriceState {
  const priceCents = priceCentsForSold(sold);
  const atCap = priceCents >= LADDER.capCents;
  return {
    sold,
    priceCents,
    nextPriceCents: atCap ? null : priceCents + LADDER.stepCents,
    salesUntilNext: atCap ? null : LADDER.every - (sold % LADDER.every),
    founderNumber: sold + 1,
    live,
  };
}

/** Revenue if exactly n founders buy along the ladder (for docs/tests). */
export function ladderRevenueCents(n: number): number {
  let t = 0;
  for (let i = 0; i < n; i++) t += priceCentsForSold(i);
  return t;
}

export const dollars = (c: number) => `$${Math.round(c / 100)}`;
