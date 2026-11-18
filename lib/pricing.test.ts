import { describe, expect, it } from "vitest";
import { ladderRevenueCents, priceCentsForSold, stateFor } from "./pricing";

describe("price ladder (+$10 with every hire, Nov 18)", () => {
  it("starts at $99, +$10 per hire, caps at $499", () => {
    expect(priceCentsForSold(0)).toBe(9900);
    expect(priceCentsForSold(1)).toBe(10900);
    expect(priceCentsForSold(5)).toBe(14900);
    expect(priceCentsForSold(39)).toBe(48900);
    expect(priceCentsForSold(40)).toBe(49900);
    expect(priceCentsForSold(1000)).toBe(49900);
  });
  it("reports the next step and founder number", () => {
    expect(stateFor(3, true)).toMatchObject({ priceCents: 12900, nextPriceCents: 13900, salesUntilNext: 1, founderNumber: 4 });
    expect(stateFor(50, true)).toMatchObject({ priceCents: 49900, nextPriceCents: null, salesUntilNext: null });
  });
  it("matches the revenue table in docs/PRICING-MODEL.md", () => {
    expect(ladderRevenueCents(40) / 100).toBe(11760);
    expect(ladderRevenueCents(100) / 100).toBe(41700);
    expect(ladderRevenueCents(200) / 100).toBe(91600);
  });
});
