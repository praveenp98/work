/**
 * Profit per product, from DataDoe's amazon_profit_by_sku_and_date (Nov 2026: replaces the retired Sales & Traffic
 * table). DataDoe already nets out Amazon fees, ad spend, refunds and the seller's COGS (uploaded via POST /cogs),
 * so Rocco sums rows per SKU and shows it. Products sold without COGS are flagged so the seller can add them.
 * Pure helpers; tested in lib/profit.test.ts.
 */
export interface ProductProfit {
  sku: string; asin: string; title: string;
  sales: number; units: number; fees: number; cogs: number; adSpend: number; refunds: number; profit: number;
  /** Some units sold without a COGS record: profit is overstated until the seller adds it. */
  cogsMissing: boolean;
  margin: number | null; // profit ÷ sales
  /** Margin before ads ÷ sales = the product's break-even ACoS. Null without COGS. */
  breakevenAcos: number | null;
}

const n = (v: unknown) => { const x = Number(String(v ?? "").replace(/[$,%\s]/g, "")); return Number.isFinite(x) ? x : 0; };
const bool = (v: unknown) => (v === true || v === "true" || v === "TRUE" || v === 1 || v === "1" ? true : v === false || v === "false" || v === "FALSE" || v === 0 || v === "0" ? false : null);

/** Sum profit-table rows (one per SKU per day) into one line per SKU, biggest sales first. */
export function profitBySku(rows: Record<string, unknown>[]): ProductProfit[] {
  const by = new Map<string, ProductProfit & { _missing: boolean }>();
  for (const r of rows) {
    const sku = String(r.sku ?? "").trim();
    if (!sku) continue;
    const p = by.get(sku) ?? { sku, asin: String(r.child_asin ?? ""), title: String(r.product_name ?? ""), sales: 0, units: 0, fees: 0, cogs: 0, adSpend: 0, refunds: 0, profit: 0, cogsMissing: false, margin: null, breakevenAcos: null, _missing: false };
    if (!p.title && r.product_name) p.title = String(r.product_name);
    const units = n(r.total_units_sold);
    p.sales += n(r.total_sales); p.units += units; p.fees += n(r.total_fees); p.cogs += n(r.cogs_total);
    p.adSpend += n(r.ad_spend); p.refunds += n(r.refund_cost); p.profit += n(r.profit);
    if (units > 0 && bool(r.cogs_present) === false) p._missing = true;
    by.set(sku, p);
  }
  return [...by.values()].map(({ _missing, ...p }) => {
    const r2 = (x: number) => Math.round(x * 100) / 100;
    const before = p.sales - p.fees - p.cogs; // contribution before ads
    return {
      ...p, sales: r2(p.sales), fees: r2(p.fees), cogs: r2(p.cogs), adSpend: r2(p.adSpend), refunds: r2(p.refunds), profit: r2(p.profit),
      cogsMissing: _missing || (p.units > 0 && p.cogs === 0),
      margin: p.sales > 0 ? Math.round((p.profit / p.sales) * 1000) / 1000 : null,
      breakevenAcos: p.sales > 0 && p.cogs > 0 ? Math.max(0, Math.round((before / p.sales) * 1000) / 1000) : null,
    };
  }).filter((p) => p.sales > 0 || p.units > 0).sort((a, b) => b.sales - a.sales);
}

/**
 * Sales & Traffic columns (sessions, page views, ordered sales/units, Buy Box) describe the child ASIN and repeat on
 * every SKU row of that ASIN and date. Keep one row per ASIN and date (max), as DataDoe's docs require.
 */
export function asinDayRows(rows: Record<string, unknown>[], cols: string[]): Record<string, unknown>[] {
  const by = new Map<string, Record<string, unknown>>();
  for (const r of rows) {
    const k = `${r.child_asin ?? ""}|${String(r.date ?? "").slice(0, 10)}`;
    if (!r.child_asin) continue;
    const a = by.get(k) ?? { child_asin: r.child_asin, date: r.date, product_name: r.product_name };
    for (const c of cols) a[c] = Math.max(n(a[c]), n(r[c]));
    if (!a.product_name && r.product_name) a.product_name = r.product_name;
    by.set(k, a);
  }
  return [...by.values()];
}

/** COGS row for DataDoe's POST /cogs (per SKU, in the marketplace currency, effective from a date). */
export interface CogsInput { sku: string; asin?: string; cost: number; shipping: number }
export function cogsRows(items: CogsInput[], currency: string, fromDate: string) {
  return items
    .filter((i) => i.sku && Number.isFinite(i.cost) && i.cost >= 0 && Number.isFinite(i.shipping) && i.shipping >= 0 && i.cost + i.shipping > 0)
    .slice(0, 1000)
    .map((i) => ({ sku: i.sku, ...(i.asin ? { asin: i.asin } : {}), costCurrency: currency, fromDate, costItemValue: Math.round(i.cost * 100) / 100, costItemShippingValue: Math.round(i.shipping * 100) / 100 }));
}
