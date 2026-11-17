import { findColumns, headerRowWith } from "./columns";
import { toNumber } from "./normalize";

/** Sponsored Products campaign report broken down by placement. */
export type PlacementName = "top" | "rest" | "product" | "other";
export interface PlacementRow { campaign: string; campaignId?: string; placement: PlacementName; raw: string; clicks: number; spend: number; sales: number; orders: number }

const SPEC = {
  campaign: ["campaign name", "campaign"],
  campaignId: ["campaign id"],
  placement: ["placement", "placement type", "placement classification", "campaign placement"],
  clicks: ["clicks"],
  spend: ["spend", "cost", "total cost"],
  sales: ["7 day total sales", "14 day total sales", "total sales", "sales 7d", "sales 14d", "sales"],
  orders: ["7 day total orders", "14 day total orders", "total orders", "purchases 7d", "purchases 14d", "orders", "purchases"],
};

export function placementOf(raw: string): PlacementName {
  const s = raw.toLowerCase();
  if (s.includes("top of search")) return "top";
  if (s.includes("rest of search")) return "rest";
  if (s.includes("detail page") || s.includes("product page")) return "product";
  return "other";
}

export function isPlacementReport(table: unknown[][]) {
  return headerRowWith(table, SPEC, ["campaign", "placement", "spend"]) >= 0;
}

export function parsePlacementReport(table: unknown[][]): PlacementRow[] {
  const hi = headerRowWith(table, SPEC, ["campaign", "placement", "spend"]);
  if (hi < 0) throw new Error("Not a placement report (needs Campaign Name, Placement and Spend).");
  const c = findColumns(table[hi], SPEC);
  const g = (r: unknown[], i?: number) => (i === undefined ? undefined : r[i]);
  return table.slice(hi + 1).filter((r) => String(g(r, c.campaign) ?? "").trim()).map((r) => {
    const raw = String(g(r, c.placement) ?? "").trim();
    return { campaign: String(g(r, c.campaign)).trim(), campaignId: String(g(r, c.campaignId) ?? "").trim() || undefined, placement: placementOf(raw), raw, clicks: toNumber(g(r, c.clicks)), spend: toNumber(g(r, c.spend)), sales: toNumber(g(r, c.sales)), orders: toNumber(g(r, c.orders)) };
  });
}
