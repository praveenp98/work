import { describe, expect, it } from "vitest";
import { ladderRevenueCents, priceCentsForSold, stateFor } from "./pricing";

describe("price ladder", () => {
  it("starts at $99, +$10 every 5 sales, caps at $499", () => {
    expect(priceCentsForSold(0)).toBe(9900);
    expect(priceCentsForSold(4)).toBe(9900);
    expect(priceCentsForSold(5)).toBe(10900);
    expect(priceCentsForSold(199)).toBe(48900);
    expect(priceCentsForSold(200)).toBe(49900);
    expect(priceCentsForSold(1000)).toBe(49900);
  });
  it("reports the next step and founder number", () => {
    expect(stateFor(3, true)).toMatchObject({ priceCents: 9900, nextPriceCents: 10900, salesUntilNext: 2, founderNumber: 4 });
    expect(stateFor(250, true)).toMatchObject({ priceCents: 49900, nextPriceCents: null, salesUntilNext: null });
  });
  it("matches the revenue table in docs/PRICING-MODEL.md", () => {
    expect(ladderRevenueCents(100) / 100).toBe(19400);
    expect(ladderRevenueCents(180) / 100).toBe(49320);
    expect(ladderRevenueCents(200) / 100).toBe(58800);
  });
});
