import { describe, expect, it } from "vitest";
import { breakevenAcos, couponMath } from "./coupon";

const base = { price: 40, discountType: "pct" as const, discount: 20, cogs: 10, referralPct: 15, fbaFee: 6, adCostPerUnit: 2, couponFeePct: 2.5, couponFixedFee: 5, units: 100 };

describe("couponMath", () => {
  it("applies fees to the discounted price", () => {
    const m = couponMath(base);
    expect(m.salePrice).toBe(32);
    expect(m.profitBefore).toBeCloseTo(40 - 6 - 10 - 6 - 2, 5); // 16
    expect(m.profitAfter).toBeCloseTo(32 - 4.8 - 0.8 - 18, 5); // 8.4
    expect(m.totalProfit).toBeCloseTo(835, 5);
  });
  it("finds the deepest safe discount", () => {
    const m = couponMath(base);
    const at = couponMath({ ...base, discount: m.maxSafePct });
    expect(at.profitAfter).toBeCloseTo(0, 5);
  });
  it("handles $ off coupons and losing coupons", () => {
    expect(couponMath({ ...base, discountType: "amt", discount: 25 }).profitAfter).toBeLessThan(0);
  });
});

describe("breakevenAcos", () => {
  it("computes breakeven, target and max CPC", () => {
    const b = breakevenAcos({ price: 40, cogs: 10, referralPct: 15, fbaFee: 6, otherCosts: 0, targetProfitPct: 10, conversionRate: 10 });
    expect(b.breakeven).toBeCloseTo(0.45, 5);
    expect(b.target).toBeCloseTo(0.35, 5);
    expect(b.maxCpcBreakeven).toBeCloseTo(1.8, 5);
  });
});
