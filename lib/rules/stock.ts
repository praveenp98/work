import type { InventoryRow } from "../parsers/inventory";
import { r2, shortName, type Analysis, type Finding, type Proposal } from "./types";

export function daysOfCover(r: InventoryRow): number | null {
  if (r.daysOfSupply > 0) return r.daysOfSupply;
  if (r.sold30 > 0) return (r.available + r.inbound) / (r.sold30 / 30);
  return null;
}

/**
 * Stockout guard: running out kills sales and ranking, and ads on a nearly-empty SKU speed it up.
 * ≤14 days: lower ad pressure + reorder. 15–21: no budget increases. >180 days: overstock, push it.
 */
export function analyzeStock(rows: InventoryRow[]): Analysis {
  const findings: Finding[] = [];
  const proposals: Proposal[] = [];
  let s = 0;
  for (const r of rows) {
    const id = r.sku || r.asin;
    const label = r.name ? shortName(r.name) : id;
    const cover = daysOfCover(r);
    const daily = r.sold30 > 0 ? r.sold30 / 30 : 0;
    if (r.sold30 === 0 && r.available > 0) {
      findings.push({ severity: "medium", title: `${label}: no sales in 30 days`, detail: `${r.available} units sitting. Consider a coupon, a small exact-match test or a removal order before long-term storage fees.`, line: `${label} is collecting dust, not dollars.`, valueMonthly: 0 });
      continue;
    }
    if (cover === null) continue;
    if (cover <= 14) {
      s++;
      // Suggested send: 60 days of cover at the current pace, minus what's on hand and inbound, rounded up to 5.
      const need = daily * 60 - r.available - Math.max(0, r.inbound);
      if (need <= 0 && r.inbound > 0) {
        // Already covered by a shipment on its way: say so, don't ask for another.
        findings.push({ severity: "medium", title: `${label}: ~${Math.round(cover)} days of stock, ${r.inbound} units inbound`, detail: "A shipment already covers the next two months. Make sure it's on its way; ease ads until it lands.", valueMonthly: 0 });
      } else {
        const out = r.available <= 0;
        findings.push({ restock: { sku: r.sku, asin: r.asin, available: r.available, daily: Math.round(daily * 10) / 10, suggest: Math.max(5, Math.ceil(Math.max(0, need) / 5) * 5) }, severity: "high",
          title: out ? `${label}: out of stock` : `${label}: ~${Math.round(cover)} days of stock left`,
          detail: out
            ? `${r.sold30} sold in the last 30 days (~${daily.toFixed(1)}/day). It was out of stock for part of that, so real demand is likely higher than this pace. Send stock now.`
            : `Selling ~${daily.toFixed(1)}/day (${r.sold30} in the last 30 days). Reorder now and lower ad pressure so you don't run out mid-peak.`,
          line: out ? `${label} is out. Every ad click on it is wasted.` : `${label} is about to run dry. Ads are just speeding that up.`, valueMonthly: 0 });
      }
      const state = r.available <= 0 ? "out of stock" : `${Math.round(cover)} days of stock`;
      proposals.push({ code: `S${s}`, kind: "ads_down", campaign: "(all campaigns advertising this SKU)", adGroup: "", target: id, current: r.available, reason: `${label}: ${state}. ${r.available <= 0 ? "Pause its ads" : "Lower bids 20% on its ads (or pause it in broad/auto)"} until stock lands`, valueMonthly: 0, undo: "Restore the previous bids (or re-enable the ads) once inbound stock is received." });
    } else if (cover <= 21) {
      findings.push({ severity: "medium", title: `${label}: ~${Math.round(cover)} days of stock`, detail: "Don't raise budgets or bids on this SKU until more stock is on the way.", valueMonthly: 0 });
    } else if (cover > 180) {
      findings.push({ severity: "low", title: `${label}: ${Math.round(cover)} days of stock`, detail: "Overstocked. Good candidate for more ad budget or a coupon (if margin allows) to avoid aged-inventory fees.", line: `${label} has a year of runway. Let's sell some.`, valueMonthly: 0 });
    }
  }
  const atRisk = findings.filter((f) => f.severity === "high").length;
  return {
    reportType: "inventory",
    headline: atRisk ? `${atRisk} SKU${atRisk === 1 ? "" : "s"} could run out within 2 weeks.` : "No SKUs at stockout risk in the next 2 weeks.",
    findings,
    proposals,
    stats: { skus: rows.length, atRisk, units: r2(rows.reduce((a, r) => a + r.available, 0)) },
  };
}
