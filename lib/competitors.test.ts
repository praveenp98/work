import { describe, expect, it } from "vitest";
import { costAt, DRPPC, TYPICAL_SPENDS } from "./competitors";

describe("Dr. PPC vs Rocco at typical ad spend ($299 + 2% of spend, from lib/competitors.ts)", () => {
  it("shows $2k, $5k and $10k a month", () => expect([...TYPICAL_SPENDS]).toEqual([2000, 5000, 10000]));

  it("computes every column from the listed prices", () => {
    expect(costAt(2000)).toMatchObject({ drppc: { month: 339, year: 4068 }, partner: { month: 40, year: 480 }, roccoYearly: { month: 233, year: 2790 }, roccoMonthly: { month: 279, year: 3348 } });
    expect(costAt(5000)).toMatchObject({ drppc: { month: 399, year: 4788 }, partner: { month: 100, year: 1200 } });
    expect(costAt(10000)).toMatchObject({ drppc: { month: 499, year: 5988 }, partner: { month: 200, year: 2400 } });
    expect(DRPPC.monthly(0)).toBe(299);
  });

  it("Rocco's yearly plan is a large share of a small ad budget (the 'not worth it yet' case)", () => {
    expect(costAt(1000).roccoShareOfSpend).toBeCloseTo(0.2325, 3);
    expect(costAt(10000).roccoShareOfSpend).toBeLessThan(0.03);
  });
});
