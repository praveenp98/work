import { describe, expect, it } from "vitest";
import { monthlyCost, PLAN, PRICE, stateFor } from "./pricing";

describe("pricing: $2,790/year (2 months free) or $279/month, flat, 14-day guarantee", () => {
  it("is the same for every team, no ladder", () => {
    expect(PLAN).toEqual({ monthlyCents: 27900, annualCents: 279000, guaranteeDays: 14 });
    expect(PLAN.annualCents).toBe(PLAN.monthlyCents * 10); // 2 months free
    expect(stateFor(0, true)).toMatchObject({ priceCents: 279000, renewCents: 27900 });
    expect(stateFor(500, true)).toMatchObject({ priceCents: 279000, renewCents: 27900 }); // no price ladder: the same after any number of hires
    expect(Object.keys(stateFor(0, true))).not.toContain("nextPriceCents");
    expect(monthlyCost("annual")).toBeCloseTo(232.5, 1);
    expect(monthlyCost("monthly")).toBe(279);
  });
  it("says it the same way everywhere", () => {
    expect(PRICE.line).toBe("$2,790 a year (2 months free) or $279 a month. Whole team, cancel anytime, 14-day money-back guarantee.");
    expect(PRICE.from).toBe("$233/mo billed yearly");
  });
});
