import Papa from "papaparse";
import { ADS_MAP } from "./create-campaign";
import { exportCsv, findSource } from "./datadoe-sync";
import type { TermLite } from "./rules/terms";
import type { Store, Workspace } from "./store/types";

/**
 * Which selling searches belong to which product, exactly. Amazon's search-term report has no product column, but
 * every row has its ad group, and every Sponsored Products ad group lists the products it advertises (Ads (raw)).
 * A search's orders count for a product (ASIN) only when they came from an ad group that advertises that ASIN and
 * nothing else. Orders from ad groups that advertise several products can't be split by Amazon's data, so they're
 * reported as "shared" and never used. No title matching, no guessing.
 */
export type AdGroupMap = Record<string, string[]>; // ad group id → advertised products (ASIN, or SKU when an ad has no ASIN)

/**
 * Sponsored Products ad group → distinct products. Each ad's ad_creative_products lists the ASIN and the SKU
 * (checked on Habit Nest, Nov 25: [{"productId":"0692726713","productIdType":"ASIN"},{"productId":"… FBM","productIdType":"SKU"}]).
 * FBA and FBM SKUs of one ASIN are the same listing, so the product is the ASIN.
 */
export function productsByAdGroup(rows: Record<string, unknown>[]): AdGroupMap {
  const out: Record<string, Set<string>> = {};
  for (const r of rows) {
    if (!/SPONSORED_PRODUCTS/i.test(String(r.ad_campaign_type ?? ""))) continue;
    if (!/ENABLED/i.test(String(r.ad_state ?? "ENABLED"))) continue;
    const g = String(r.ad_group_id ?? "");
    let list: { productId?: unknown; productIdType?: unknown }[] = [];
    try { const v = JSON.parse(String(r.ad_creative_products ?? "[]")); list = Array.isArray(v) ? v : [v]; } catch { continue; }
    const asin = list.find((x) => String(x.productIdType).toUpperCase() === "ASIN")?.productId;
    const sku = list.find((x) => String(x.productIdType).toUpperCase() === "SKU")?.productId;
    const key = String(asin ?? sku ?? "");
    if (g && key) (out[g] ??= new Set()).add(key);
  }
  return Object.fromEntries(Object.entries(out).map(([g, set]) => [g, [...set]]));
}

export interface ProductTerms {
  terms: TermLite[]; // o / sa = this product's own orders and sales only
  shared: { orders: number; terms: number }; // orders from multi-product ad groups (left out)
  linked: boolean; // false when the data can't tie searches to products yet
}

export function termsForProduct(terms: TermLite[], ids: string[], map: AdGroupMap | null): ProductTerms {
  const want = new Set(ids.filter(Boolean));
  if (!map || !terms.some((t) => t.g)) return { terms: [], shared: { orders: 0, terms: 0 }, linked: false };
  const out: TermLite[] = [];
  let sharedOrders = 0, sharedTerms = 0;
  for (const t of terms) {
    let o = 0, sa = 0, so = 0;
    for (const [g, [orders, sales]] of Object.entries(t.g ?? {})) {
      const products = map[g] ?? [];
      if (!products.some((p) => want.has(p))) continue;
      if (products.length === 1) { o += orders; sa += sales; } else so += orders;
    }
    if (o > 0) out.push({ t: t.t, s: 0, sa: Math.round(sa * 100) / 100, o, c: 0 });
    if (so > 0) { sharedOrders += so; sharedTerms++; }
  }
  return { terms: out.sort((a, b) => b.sa - a.sa), shared: { orders: sharedOrders, terms: sharedTerms }, linked: true };
}

/** Ad group → products for one account, from Ads (raw). Cached on the workspace for 20 hours (each export costs credits). */
export async function adGroupMap(store: Store, ws: Workspace, accountId: string, now = new Date()): Promise<AdGroupMap | null> {
  const cached = ws.amazon?.adGroups?.[accountId];
  if (cached && now.getTime() - new Date(cached.at).getTime() < 20 * 3_600_000) return cached.map;
  try {
    const src = await findSource(accountId, ADS_MAP);
    if (!src) return cached?.map ?? null;
    const rows = Papa.parse<Record<string, unknown>>(await exportCsv(accountId, src, ADS_MAP, now), { header: true, skipEmptyLines: true }).data;
    const map = productsByAdGroup(rows);
    if (ws.amazon) {
      ws.amazon.adGroups = { ...(ws.amazon.adGroups ?? {}), [accountId]: { at: now.toISOString(), map } };
      await store.saveWorkspace(ws);
    }
    return map;
  } catch {
    return cached?.map ?? null;
  }
}
