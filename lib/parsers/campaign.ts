import { findColumns, headerRowWith } from "./columns";
import { toDate, toNumber } from "./normalize";

/** Sponsored Products campaign report (Summary or Daily). */
export interface CampaignRow {
  campaign: string;
  campaignId?: string;
  status: string;
  budget: number;
  impressions: number;
  clicks: number;
  spend: number;
  sales: number;
  orders: number;
  date: Date | null;
  endDate: Date | null;
}

const SPEC = {
  campaign: ["campaign name", "campaign"],
  status: ["campaign status", "status"],
  budget: ["budget", "daily budget", "campaign budget amount", "campaign budget"],
  impressions: ["impressions"],
  clicks: ["clicks"],
  spend: ["spend", "cost", "total cost"],
  sales: ["7 day total sales", "14 day total sales", "total sales", "sales 7d", "sales 14d", "sales"],
  orders: ["7 day total orders", "14 day total orders", "total orders", "purchases 7d", "purchases 14d", "orders", "purchases"],
  campaignId: ["campaign id"],
  date: ["date", "start date"],
  endDate: ["end date"],
  searchTerm: ["customer search term", "search term"],
  adGroup: ["ad group name", "ad group"],
};

export function isCampaignReport(table: unknown[][]) {
  const hi = headerRowWith(table, SPEC, ["campaign", "budget", "spend"]);
  if (hi < 0) return false;
  const c = findColumns(table[hi], SPEC);
  return c.searchTerm === undefined && c.adGroup === undefined;
}

export function parseCampaignReport(table: unknown[][]): { rows: CampaignRow[]; days: number } {
  if (!isCampaignReport(table)) throw new Error("Not a Sponsored Products campaign report (needs Campaign Name, Budget and Spend).");
  const hi = headerRowWith(table, SPEC, ["campaign", "budget", "spend"]);
  const c = findColumns(table[hi], SPEC);
  const g = (r: unknown[], i?: number) => (i === undefined ? undefined : r[i]);
  const rows: CampaignRow[] = [];
  let min: number | null = null, max: number | null = null;
  for (const r of table.slice(hi + 1)) {
    const campaign = String(g(r, c.campaign) ?? "").trim();
    if (!campaign) continue;
    const d1 = toDate(g(r, c.date));
    const d2 = toDate(g(r, c.endDate)) ?? d1;
    for (const d of [d1, d2]) if (d) { const t = d.getTime(); min = min === null ? t : Math.min(min, t); max = max === null ? t : Math.max(max, t); }
    rows.push({
      campaign,
      campaignId: String(g(r, c.campaignId) ?? "").trim() || undefined,
      status: String(g(r, c.status) ?? "").trim().toLowerCase(),
      budget: toNumber(g(r, c.budget)),
      impressions: toNumber(g(r, c.impressions)),
      clicks: toNumber(g(r, c.clicks)),
      spend: toNumber(g(r, c.spend)),
      sales: toNumber(g(r, c.sales)),
      orders: toNumber(g(r, c.orders)),
      date: d1, endDate: d2,
    });
  }
  const days = min !== null && max !== null ? Math.max(1, Math.round((max - min) / 86400000) + 1) : 30;
  return { rows, days };
}
