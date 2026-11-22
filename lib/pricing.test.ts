import { describe, expect, it } from "vitest";
import { monthlyCost, PLAN, PRICE, stateFor } from "./pricing";

describe("pricing (Nov 22): $1,190/year (2 months free) or $119/month, 30-day guarantee", () => {
  it("is the same for every team, no ladder", () => {
    expect(PLAN).toEqual({ monthlyCents: 11900, annualCents: 119000, guaranteeDays: 30 });
    expect(PLAN.annualCents).toBe(PLAN.monthlyCents * 10); // 2 months free
    expect(stateFor(0, true)).toMatchObject({ priceCents: 119000, renewCents: 11900, nextPriceCents: null });
    expect(monthlyCost("annual")).toBeCloseTo(99.17, 1);
    expect(monthlyCost("monthly")).toBe(119);
  });
  it("says it the same way everywhere", () => {
    expect(PRICE.line).toBe("$1,190 a year (2 months free) or $119 a month. Whole team, cancel anytime, 30-day money-back guarantee.");
    expect(PRICE.from).toBe("$99/mo billed yearly");
  });
});
