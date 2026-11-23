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
      findings.push({ severity: "high", title: `${label}: ~${Math.round(cover)} days of stock left`, detail: `Selling ~${daily.toFixed(1)}/day. Reorder now and lower ad pressure so you don't run out mid-peak.`, line: `${label} is about to run dry. Ads are just speeding that up.`, valueMonthly: 0 });
      proposals.push({ code: `S${s}`, kind: "ads_down", campaign: "(all campaigns advertising this SKU)", adGroup: "", target: id, reason: `${label}: ${Math.round(cover)} days of stock. Lower bids 20% on its ads (or pause it in broad/auto) until stock lands`, valueMonthly: 0, undo: "Restore the previous bids (or re-enable the ads) once inbound stock is received." });
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
