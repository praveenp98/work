import Papa from "papaparse";
import { runAction } from "./datadoe";
import { exportCsv, findSource, type Pull } from "./datadoe-sync";

/**
 * "Ease ads on a low-stock product", done exactly: pause this SKU's own Sponsored Products ads (the product ad, not
 * the keywords, which other products share). Found in Ads (raw): every ENABLED SP ad whose products include this
 * exact SKU. Other SKUs of the same ASIN (an FBM offer that can still ship) are left running. Each batch is dry-run
 * first (free). The paused ad IDs are kept on the proposal so Undo turns the same ads back on (lib/undo.ts).
 * Request shape checked with a DataDoe dry run on Habit Nest (Nov 25): { ads: [{ adId, adProduct, state: "PAUSED" }] }.
 */
const ADS: Pull = {
  kind: "sp_campaign", table: "amazon_ads_ads_raw", query: "ads raw", days: 1, shape: "daily",
  cols: { ad_id: "_id", ad_group_id: "_g", ad_campaign_type: "_t", ad_state: "_s", ad_creative_products: "_p" },
};

/** Enabled Sponsored Products ad IDs for this exact SKU. */
export function adIdsForSku(rows: Record<string, unknown>[], sku: string): string[] {
  const out = new Set<string>();
  for (const r of rows) {
    if (!/SPONSORED_PRODUCTS/i.test(String(r.ad_campaign_type ?? "")) || !/ENABLED/i.test(String(r.ad_state ?? ""))) continue;
    let list: { productId?: unknown; productIdType?: unknown }[] = [];
    try { const v = JSON.parse(String(r.ad_creative_products ?? "[]")); list = Array.isArray(v) ? v : [v]; } catch { continue; }
    if (list.some((x) => String(x.productIdType).toUpperCase() === "SKU" && String(x.productId) === sku) && r.ad_id) out.add(String(r.ad_id));
  }
  return [...out];
}

export const adsState = (ids: string[], state: "PAUSED" | "ENABLED") => ({ ads: ids.map((adId) => ({ adId, adProduct: "SPONSORED_PRODUCTS", state })) });

export async function pauseSkuAds(accountId: string, sku: string, key: string): Promise<{ ok: true; adIds: string[] } | { ok: false; error: string; none?: boolean }> {
  const src = await findSource(accountId, ADS);
  if (!src) return { ok: false, error: "Amazon Ads data isn't available for this account." };
  const rows = Papa.parse<Record<string, unknown>>(await exportCsv(accountId, src, ADS), { header: true, skipEmptyLines: true }).data;
  const ids = adIdsForSku(rows, sku);
  if (!ids.length) return { ok: false, none: true, error: "No running Sponsored Products ads for this SKU, so there's nothing to pause." };
  const done: string[] = [];
  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100);
    const dry = await runAction(accountId, "AMAZON_ADS_ADS_UPDATE", adsState(chunk, "PAUSED"), { dryRun: true });
    if (!dry.ok) return done.length ? { ok: true, adIds: done } : { ok: false, error: dry.error ?? "Amazon wouldn't accept it." };
    const live = await runAction(accountId, "AMAZON_ADS_ADS_UPDATE", adsState(chunk, "PAUSED"), { idempotencyKey: `${key}:pause:${i}` });
    if (!live.ok) return done.length ? { ok: true, adIds: done } : { ok: false, error: live.error ?? "Amazon wouldn't accept it." };
    done.push(...chunk);
  }
  return { ok: true, adIds: done };
}
