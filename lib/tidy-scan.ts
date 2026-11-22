import Papa from "papaparse";
import { exportCsv, findSource, type Pull } from "./datadoe-sync";
import { buildTidy, type TidyPlan } from "./rules/tidy";

/**
 * Scan one account for "Tidy your campaigns": 5 DataDoe exports (~10 tokens), on demand only.
 * Table and column names checked on a real account (Nov 22): campaigns raw (targeting AUTO/MANUAL, portfolio),
 * targets raw (KEYWORD/PRODUCT/PRODUCT_CATEGORY/AUTO, match type, negative), ads raw (products per campaign),
 * product catalog (titles), and 30 days of campaign performance.
 */
const pull = (table: string, query: string, cols: string[], days = 30): Pull => ({ kind: "sp_campaign", table, query, days, shape: "daily", cols: Object.fromEntries(cols.map((c) => [c, `_${c}`])) });
const T = {
  campaigns: pull("amazon_ads_campaigns_raw", "campaigns raw", ["ad_campaign_id", "ad_campaign_name", "ad_campaign_type", "ad_portfolio_id", "ad_campaign_state", "ad_campaign_targeting_settings"]),
  targets: pull("amazon_ads_targets_raw", "targets raw", ["ad_campaign_id", "ad_target_type", "ad_campaign_type", "ad_target_negative", "ad_target_state", "ad_target_match_type", "ad_target_keyword"]),
  ads: pull("amazon_ads_ads_raw", "ads raw", ["ad_campaign_id", "ad_campaign_type", "ad_state", "ad_creative_products"]),
  catalog: pull("amazon_ads_product_catalog", "product catalog", ["asin", "sku", "product_title", "product_brand"]),
  perf: pull("amazon_ads_performance_by_campaign_by_date", "campaign", ["ad_campaign_id", "ad_campaign_type", "ad_impressions", "ad_clicks", "ad_spend", "ad_sales"], 30),
};
type Row = Record<string, string>;
const SP = (r: Row) => !r.ad_campaign_type || /SPONSORED_PRODUCTS/i.test(r.ad_campaign_type);
const num = (v?: string) => Number(String(v ?? "").replace(/[$,]/g, "")) || 0;

async function rows(accountId: string, p: Pull, now: Date): Promise<Row[]> {
  const src = await findSource(accountId, p);
  if (!src) throw new Error(`${p.table} isn't available for this account yet`);
  return Papa.parse<Row>(await exportCsv(accountId, src, p, now), { header: true, skipEmptyLines: true }).data;
}

export async function scanTidy(accountId: string, o: { includePaused?: boolean } = {}, now = new Date()): Promise<TidyPlan> {
  const [c, t, a, cat, perf] = await Promise.all([rows(accountId, T.campaigns, now), rows(accountId, T.targets, now), rows(accountId, T.ads, now), rows(accountId, T.catalog, now).catch(() => []), rows(accountId, T.perf, now).catch(() => [])]);
  const perfBy = new Map<string, { campaignId: string; impressions: number; clicks: number; spend: number; sales: number }>();
  for (const r of perf.filter(SP)) {
    const x = perfBy.get(r.ad_campaign_id) ?? { campaignId: r.ad_campaign_id, impressions: 0, clicks: 0, spend: 0, sales: 0 };
    x.impressions += num(r.ad_impressions); x.clicks += num(r.ad_clicks); x.spend += num(r.ad_spend); x.sales += num(r.ad_sales);
    perfBy.set(r.ad_campaign_id, x);
  }
  return buildTidy({
    campaigns: c.filter(SP).map((r) => ({ id: r.ad_campaign_id, name: r.ad_campaign_name, state: r.ad_campaign_state, portfolioId: r.ad_portfolio_id || undefined, auto: /AUTO/i.test(r.ad_campaign_targeting_settings ?? "") })),
    targets: t.filter(SP).map((r) => ({ campaignId: r.ad_campaign_id, type: r.ad_target_type, match: r.ad_target_match_type, negative: r.ad_target_negative === "true", state: r.ad_target_state, keyword: r.ad_target_keyword })),
    ads: a.filter(SP).filter((r) => !/ARCHIVED/i.test(r.ad_state ?? "")).map((r) => {
      let products: { id: string; type: string }[] = [];
      try { const v = JSON.parse(r.ad_creative_products || "[]"); products = (Array.isArray(v) ? v : [v]).map((x: { productId?: string; productIdType?: string }) => ({ id: String(x.productId ?? ""), type: String(x.productIdType ?? "") })).filter((x) => x.id); } catch { /* skip */ }
      return { campaignId: r.ad_campaign_id, products };
    }),
    products: cat.map((r) => ({ asin: r.asin, sku: r.sku || undefined, title: r.product_title || undefined, brand: r.product_brand || undefined })),
    perf: [...perfBy.values()],
    includePaused: o.includePaused,
  }, now);
}
