/**
 * Daily account numbers for the dashboard's date-range view: per account, per day, total sales/units/sessions and
 * ad spend/sales/orders/clicks/impressions. Filled by the daily pull (two small extra exports, lib/datadoe-sync.ts),
 * backfilled to 180 days the first time, kept for 400 days. Pure helpers here; tested in lib/daily.test.ts.
 */
export interface Day { s?: number; u?: number; se?: number; pv?: number; as?: number; asa?: number; ao?: number; ac?: number; ai?: number; /** profit (fees, COGS, ads netted) */ p?: number; /** 1 = some sales that day had no COGS */ nc?: number }
export type Daily = Record<string, Day>; // "YYYY-MM-DD" → numbers

const n = (v: unknown) => { const x = Number(String(v ?? "").replace(/[$,%\s]/g, "")); return Number.isFinite(x) ? x : 0; };

/** DataDoe columns → Day fields. */
export const SALES_COLS: Record<string, keyof Day> = { ordered_product_sales: "s", units_ordered: "u", total_sessions: "se", total_page_views: "pv", profit: "p" };
export const ADS_COLS: Record<string, keyof Day> = { ad_spend: "as", ad_sales: "asa", ad_orders: "ao", ad_clicks: "ac", ad_impressions: "ai" };

/** Sum raw export rows into days (rows carry a `date` column). */
export function rollup(rows: Record<string, unknown>[], cols: Record<string, keyof Day>): Daily {
  const out: Daily = {};
  for (const r of rows) {
    const d = String(r.date ?? "").slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) continue;
    const day = (out[d] ??= {});
    for (const [c, k] of Object.entries(cols)) day[k] = (day[k] ?? 0) + n(r[c]);
    if ("cogs_present" in r && /^(false|0)$/i.test(String(r.cogs_present)) && n(r.units_ordered) > 0) day.nc = 1;
  }
  return out;
}

/** New days replace old ones field by field (the latest pull wins: Amazon restates recent days); keep 400 days. */
export function mergeDaily(old: Daily | undefined, add: Daily, keep = 400): Daily {
  const out: Daily = { ...(old ?? {}) };
  for (const [d, v] of Object.entries(add)) out[d] = { ...(out[d] ?? {}), ...v };
  const days = Object.keys(out).sort();
  for (const d of days.slice(0, Math.max(0, days.length - keep))) delete out[d];
  return out;
}

export interface Totals { profit: number; hasProfit: boolean; costMissing: boolean; days: number; sales: number; units: number; sessions: number; adSpend: number; adSales: number; adOrders: number; clicks: number; impressions: number; conv: number | null; acos: number | null; tacos: number | null; roas: number | null; cpc: number | null; hasSales: boolean; hasAds: boolean }

/** Totals and ratios for an inclusive date range. Ratios are null when the denominator is 0. */
export function totals(daily: Daily, from: string, to: string): Totals {
  const t = { profit: 0, hasProfit: false, costMissing: false, days: 0, sales: 0, units: 0, sessions: 0, adSpend: 0, adSales: 0, adOrders: 0, clicks: 0, impressions: 0, hasSales: false, hasAds: false };
  for (const [d, v] of Object.entries(daily)) {
    if (d < from || d > to) continue;
    t.days++;
    if (v.s !== undefined || v.se !== undefined) t.hasSales = true;
    if (v.as !== undefined) t.hasAds = true;
    if (v.p !== undefined) { t.hasProfit = true; t.profit += v.p; }
    if (v.nc) t.costMissing = true;
    t.sales += v.s ?? 0; t.units += v.u ?? 0; t.sessions += v.se ?? 0;
    t.adSpend += v.as ?? 0; t.adSales += v.asa ?? 0; t.adOrders += v.ao ?? 0; t.clicks += v.ac ?? 0; t.impressions += v.ai ?? 0;
  }
  const r = (a: number, b: number) => (b > 0 ? a / b : null);
  return { ...t, conv: r(t.units, t.sessions), acos: r(t.adSpend, t.adSales), tacos: r(t.adSpend, t.sales), roas: r(t.adSales, t.adSpend), cpc: r(t.adSpend, t.clicks) };
}

export const dayStr = (d: Date) => d.toISOString().slice(0, 10);
export const addDays = (d: string, k: number) => dayStr(new Date(Date.parse(`${d}T00:00:00Z`) + k * 86_400_000));

/** The same-length period just before [from, to]. */
export function previousPeriod(from: string, to: string): { from: string; to: string } {
  const len = Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000) + 1;
  return { from: addDays(from, -len), to: addDays(from, -1) };
}

/** Does this account need the 180-day backfill (fewer than 60 days stored)? */
export const needsBackfill = (d?: Daily) => Object.keys(d ?? {}).length < 60;
