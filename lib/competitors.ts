import { PLAN } from "./pricing";

/**
 * Competitor prices we compare against, from their public pages. Re-check before changing copy (docs/COMPETITOR-DRPPC.md).
 * Dr. PPC (Full Circle agency): $299/mo + 2% of ad spend, month-to-month, first 30 days $1; on Full Circle Partner the $299
 * base is waived (2% only). drppc.ai, checked Nov 24, 2026.
 */
export const DRPPC = {
  name: "Dr. PPC",
  url: "https://drppc.ai",
  checked: "Nov 24, 2026",
  baseMonthly: 299,
  pctOfSpend: 0.02,
  monthly: (adSpend: number) => 299 + 0.02 * Math.max(0, adSpend),
  /** On Full Circle Partner the $299 base is waived: 2% of ad spend only (their public site, same check date). */
  partnerMonthly: (adSpend: number) => 0.02 * Math.max(0, adSpend),
};

/** Monthly ad spends the compare pages show costs at: typical sellers, not only big accounts (Nov 25, Praveen). */
export const TYPICAL_SPENDS = [2000, 5000, 10000] as const;

/** One row of the "cost at typical ad spend" table: every price per month and per year, rounded to dollars. */
export function costAt(adSpend: number) {
  const dr = DRPPC.monthly(adSpend), partner = DRPPC.partnerMonthly(adSpend);
  return {
    adSpend,
    drppc: { month: Math.round(dr), year: Math.round(dr * 12) },
    partner: { month: Math.round(partner), year: Math.round(partner * 12) },
    roccoYearly: { month: Math.round(ROCCO.annual / 12), year: ROCCO.annual },
    roccoMonthly: { month: ROCCO.monthly, year: ROCCO.monthly * 12 },
    /** Rocco's yearly plan as a share of that month's ad spend. */
    roccoShareOfSpend: ROCCO.annual / 12 / Math.max(1, adSpend),
  };
}

export const ROCCO = { monthly: PLAN.monthlyCents / 100, annual: PLAN.annualCents / 100 };

/** Yearly cost on each, at a monthly ad spend. Rocco on the yearly plan (flat). */
export function yearlyAt(adSpend: number) {
  const dr = DRPPC.monthly(adSpend) * 12;
  return { drppc: Math.round(dr), rocco: ROCCO.annual, saved: Math.round(dr - ROCCO.annual), times: dr / ROCCO.annual };
}
