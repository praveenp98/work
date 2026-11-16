export interface CouponInput {
  price: number;
  discountType: "pct" | "amt";
  discount: number;
  cogs: number;
  referralPct: number;
  fbaFee: number;
  adCostPerUnit: number;
  couponFeePct: number;
  couponFixedFee: number;
  units: number;
}

/** Profit per unit before/after a coupon. Referral and coupon % fees apply to the discounted price. */
export function couponMath(i: CouponInput) {
  const off = i.discountType === "pct" ? (i.price * i.discount) / 100 : i.discount;
  const salePrice = Math.max(0, i.price - off);
  const unitProfit = (p: number, couponPct: number) => p - p * (i.referralPct / 100) - p * (couponPct / 100) - i.cogs - i.fbaFee - i.adCostPerUnit;
  const profitBefore = unitProfit(i.price, 0);
  const profitAfter = unitProfit(salePrice, i.couponFeePct);
  const units = Math.max(0, i.units);
  const totalProfit = profitAfter * units - i.couponFixedFee;
  const marginAfter = salePrice > 0 ? profitAfter / salePrice : -1;
  // Deepest % coupon with profit ≥ 0: solve p·(1 − ref − cpn) = costs, p = price·(1 − d)
  const keep = 1 - i.referralPct / 100 - i.couponFeePct / 100;
  const costs = i.cogs + i.fbaFee + i.adCostPerUnit;
  const minPrice = keep > 0 ? costs / keep : Infinity;
  const maxSafePct = Math.max(0, Math.min(100, (1 - minPrice / i.price) * 100));
  const unitsToMatch = profitAfter > 0 && profitBefore > 0 ? Math.ceil((profitBefore * units + i.couponFixedFee) / profitAfter) : null;
  return { salePrice, profitBefore, profitAfter, marginAfter, totalProfit, maxSafePct, unitsToMatch };
}

/** Breakeven ACoS = profit before ads ÷ price. */
export function breakevenAcos(i: { price: number; cogs: number; referralPct: number; fbaFee: number; otherCosts: number; targetProfitPct: number; conversionRate: number }) {
  const before = i.price * (1 - i.referralPct / 100) - i.cogs - i.fbaFee - i.otherCosts;
  const be = i.price > 0 ? before / i.price : 0;
  const target = Math.max(0, be - i.targetProfitPct / 100);
  // Max CPC: you can spend (price × ACoS) per order; one order takes 1/CR clicks
  const maxCpcBreakeven = Math.max(0, i.price * be * (i.conversionRate / 100));
  const maxCpcTarget = Math.max(0, i.price * target * (i.conversionRate / 100));
  return { profitBeforeAds: before, breakeven: be, target, maxCpcBreakeven, maxCpcTarget };
}
