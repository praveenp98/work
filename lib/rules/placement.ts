import type { PlacementName, PlacementRow } from "../parsers/placement";
import { r2, type Analysis, type Finding, type Proposal } from "./types";

const LABEL: Record<PlacementName, string> = { top: "Top of search", rest: "Rest of search", product: "Product pages", other: "Other" };

/**
 * Placement adjustments: compare each placement's ACoS with the target.
 * Profitable placement with enough clicks → raise its adjustment (+15 to +50 points, scaled by headroom).
 * Placement above breakeven → set its adjustment to 0% and lower base bids (Amazon can't go below 0).
 */
export function analyzePlacements(rows: PlacementRow[], s: { targetAcos: number; breakevenAcos: number }): Analysis {
  const byCamp = new Map<string, Map<PlacementName, { clicks: number; spend: number; sales: number; orders: number }>>();
  const ids = new Map<string, string>();
  for (const r of rows) if (r.campaignId) ids.set(r.campaign, r.campaignId);
  for (const r of rows) {
    const m = byCamp.get(r.campaign) ?? new Map();
    const e = m.get(r.placement) ?? { clicks: 0, spend: 0, sales: 0, orders: 0 };
    e.clicks += r.clicks; e.spend += r.spend; e.sales += r.sales; e.orders += r.orders;
    m.set(r.placement, e);
    byCamp.set(r.campaign, m);
  }
  const findings: Finding[] = [];
  const proposals: Proposal[] = [];
  let n = 0;
  for (const [camp, m] of byCamp) {
    for (const [pl, e] of m) {
      if (pl === "other" || e.clicks < 20) continue;
      const acos = e.sales > 0 ? e.spend / e.sales : Infinity;
      if (acos <= s.targetAcos * 0.8) {
        const headroom = s.targetAcos / acos; // e.g. 2 = half the target
        const pts = Math.min(50, Math.max(15, Math.round(((headroom - 1) * 50) / 5) * 5));
        n++;
        proposals.push({ code: `P${n}`, kind: "placement", campaign: camp, adGroup: "", target: LABEL[pl], proposed: pts, reason: `${LABEL[pl]} converts at ${Math.round(acos * 100)}% ACoS (target ${Math.round(s.targetAcos * 100)}%) on ${e.clicks} clicks. Raise its placement adjustment by +${pts} percentage points.`, valueMonthly: 0, ids: ids.get(camp) ? { campaignId: ids.get(camp) } : undefined, undo: `Set the ${LABEL[pl]} adjustment back to its previous %.` });
        findings.push({ severity: "medium", title: `${camp}: ${LABEL[pl]} is your sweet spot`, detail: `${Math.round(acos * 100)}% ACoS on ${e.clicks} clicks, $${Math.round(e.sales)} sales. More of this placement is cheap growth.`, line: `${LABEL[pl]} is printing money and you're tiptoeing.`, valueMonthly: 0 });
      } else if (acos > s.breakevenAcos && e.spend >= 20) {
        n++;
        const waste = Math.max(0, e.spend - e.sales * s.breakevenAcos);
        proposals.push({ code: `P${n}`, kind: "placement", campaign: camp, adGroup: "", target: LABEL[pl], proposed: 0, reason: `${LABEL[pl]} runs at ${Number.isFinite(acos) ? Math.round(acos * 100) + "%" : "∞"} ACoS (breakeven ${Math.round(s.breakevenAcos * 100)}%). Set its adjustment to 0%; if it's already 0, lower base bids and raise the placements that work.`, valueMonthly: r2(waste), ids: ids.get(camp) ? { campaignId: ids.get(camp) } : undefined, undo: `Restore the ${LABEL[pl]} adjustment to its previous %.` });
        findings.push({ severity: "high", title: `${camp}: ${LABEL[pl]} loses money`, detail: `${Number.isFinite(acos) ? Math.round(acos * 100) + "% ACoS" : "no sales"} on $${Math.round(e.spend)} spend.`, line: `${LABEL[pl]} is where your budget goes to nap.`, valueMonthly: r2(waste) });
      }
    }
  }
  const spend = rows.reduce((a, r) => a + r.spend, 0), sales = rows.reduce((a, r) => a + r.sales, 0);
  return {
    reportType: "sp_placement",
    headline: `${byCamp.size} campaigns by placement · ACoS ${sales ? Math.round((spend / sales) * 100) : 0}%. ${proposals.length ? `${proposals.length} placement adjustments to make.` : "Placements look balanced."}`,
    findings, proposals,
    stats: { campaigns: byCamp.size, spend: r2(spend), sales: r2(sales) },
  };
}
