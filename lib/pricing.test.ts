import { describe, expect, it } from "vitest";
import { monthlyCost, PLAN, PRICE, stateFor } from "./pricing";

describe("pricing (Nov 24): $2,790/year (2 months free) or $279/month, 7-day guarantee", () => {
  it("is the same for every team, no ladder", () => {
    expect(PLAN).toEqual({ monthlyCents: 27900, annualCents: 279000, guaranteeDays: 7 });
    expect(PLAN.annualCents).toBe(PLAN.monthlyCents * 10); // 2 months free
    expect(stateFor(0, true)).toMatchObject({ priceCents: 279000, renewCents: 27900, nextPriceCents: null });
    expect(monthlyCost("annual")).toBeCloseTo(232.5, 1);
    expect(monthlyCost("monthly")).toBe(279);
  });
  it("says it the same way everywhere", () => {
    expect(PRICE.line).toBe("$2,790 a year (2 months free) or $279 a month. Whole team, cancel anytime, 7-day money-back guarantee.");
    expect(PRICE.from).toBe("$233/mo billed yearly");
  });
});
