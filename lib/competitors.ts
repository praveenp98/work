import { PLAN } from "./pricing";

/**
 * Competitor prices we compare against, from their public pages. Re-check before changing copy (docs/COMPETITOR-DRPPC.md).
 * Dr. PPC (Full Circle agency): $299/mo + 2% of ad spend, month-to-month, first 30 days $1. drppc.ai, checked Nov 24, 2026.
 */
export const DRPPC = {
  name: "Dr. PPC",
  url: "https://drppc.ai",
  checked: "Nov 24, 2026",
  baseMonthly: 299,
  pctOfSpend: 0.02,
  monthly: (adSpend: number) => 299 + 0.02 * Math.max(0, adSpend),
};

export const ROCCO = { monthly: PLAN.monthlyCents / 100, annual: PLAN.annualCents / 100 };

/** Yearly cost on each, at a monthly ad spend. Rocco on the yearly plan (flat). */
export function yearlyAt(adSpend: number) {
  const dr = DRPPC.monthly(adSpend) * 12;
  return { drppc: Math.round(dr), rocco: ROCCO.annual, saved: Math.round(dr - ROCCO.annual), times: dr / ROCCO.annual };
}
