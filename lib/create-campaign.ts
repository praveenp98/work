import Papa from "papaparse";
import { findId, runAction, waitForAction } from "./datadoe";
import { exportCsv, findSource, type Pull } from "./datadoe-sync";
import type { Proposal } from "./rules/types";

/**
 * One click: "New exact campaign from proven searches" (harvest), the way a manager does it by hand:
 *   1. find the product (SKU) the searches sell through today (ads raw table: source ad group → product)
 *   2. AMAZON_ADS_CAMPAIGNS_ADD   Sponsored Products, manual, daily budget
 *   3. AMAZON_ADS_AD_GROUPS_ADD   default bid = average of the suggested bids
 *   4. AMAZON_ADS_ADS_ADD         the product ad(s)
 *   5. AMAZON_ADS_TARGETS_ADD     each search as an exact keyword at its suggested bid
 *   6. AMAZON_ADS_TARGETS_ADD     each search as negative exact in its old ad group (no bidding against yourself)
 * Request formats checked with DataDoe dry runs (Nov 22). Every step is dry-run before it goes live. If a step
 * fails after the campaign exists, Rocco says exactly what's left to finish by hand. Not yet run live on a real
 * account (needs an account connected with edit access).
 */
const ADS_MAP: Pull = {
  kind: "sp_campaign", table: "amazon_ads_ads_raw", query: "ads raw", days: 1, shape: "daily",
  cols: { ad_group_id: "_g", ad_campaign_type: "_t", ad_state: "_s", ad_creative_products: "_p" },
};

/**
 * Products advertised per Sponsored Products ad group, from the ads raw export. `ad_creative_products` is JSON like
 * [{"productId":"W4-3ZND-PRCY","productIdType":"SKU"}] (checked on a real account, Nov 22). SKUs for sellers;
 * ASINs only when an ad group has no SKU (vendors).
 */
export type Product = { id: string; type: "SKU" | "ASIN" };
export function skusByAdGroup(rows: Record<string, unknown>[]): Map<string, Product[]> {
  const out = new Map<string, Product[]>();
  for (const r of rows) {
    if (!/SPONSORED_PRODUCTS/i.test(String(r.ad_campaign_type ?? ""))) continue;
    if (!/ENABLED/i.test(String(r.ad_state ?? "ENABLED"))) continue;
    const g = String(r.ad_group_id ?? "");
    let list: { productId?: unknown; productIdType?: unknown }[] = [];
    try { const v = JSON.parse(String(r.ad_creative_products ?? "[]")); list = Array.isArray(v) ? v : [v]; } catch { continue; }
    const prev = out.get(g) ?? [];
    for (const x of list) {
      const id = String(x.productId ?? ""), type = String(x.productIdType ?? "").toUpperCase();
      if (id && (type === "SKU" || type === "ASIN") && !prev.some((p) => p.id === id)) prev.push({ id, type });
    }
    if (g && prev.length) out.set(g, prev);
  }
  return out;
}

export interface CreateResult { status: "applied" | "manual" | "failed"; reason?: string; campaignId?: string; done: string[] }

const BUDGET = { min: 10, max: 50 };
const money = (n: number) => Math.round(n * 100) / 100;

export async function createExactCampaign(account: { id: string; country: string }, winners: Proposal[], key: string, now = new Date()): Promise<CreateResult> {
  const done: string[] = [];
  const ws = winners.filter((p) => p.kind === "harvest" && p.ids?.adGroupId && p.matchType !== "product");
  if (!ws.length) return { status: "manual", reason: "These searches don't have Amazon IDs in the data yet.", done };

  // 1. Product(s) the searches already sell through.
  let skus: Product[] = [];
  try {
    const src = await findSource(account.id, ADS_MAP);
    if (src) {
      const rows = Papa.parse<Record<string, unknown>>(await exportCsv(account.id, src, ADS_MAP, now), { header: true, skipEmptyLines: true }).data;
      const map = skusByAdGroup(rows);
      const all = ws.flatMap((p) => map.get(p.ids!.adGroupId!) ?? []);
      const pick = all.some((p) => p.type === "SKU") ? all.filter((p) => p.type === "SKU") : all;
      skus = pick.filter((p, i) => pick.findIndex((q) => q.id === p.id) === i).slice(0, 10);
    }
  } catch { /* falls through to manual */ }
  if (!skus.length) return { status: "manual", reason: "I couldn't tell which product these searches sell through yet.", done };

  const bids = ws.map((p) => p.proposed ?? 0).filter((b) => b > 0);
  const defaultBid = money(bids.length ? bids.reduce((a, b) => a + b, 0) / bids.length : 0.75);
  const budget = Math.min(BUDGET.max, Math.max(BUDGET.min, Math.round(ws.length * 5)));
  const name = `Rocco · Exact winners · ${now.toISOString().slice(0, 10)}`;
  const step = async (type: string, details: Record<string, unknown>, idKey?: string): Promise<{ ok: boolean; id?: string; error?: string }> => {
    const dry = await runAction(account.id, type, details, { dryRun: true }).catch((e) => ({ ok: false, error: String(e) }));
    if (!dry.ok) return { ok: false, error: `checked first, rejected: ${dry.error}` };
    const live = await runAction(account.id, type, details, { idempotencyKey: `${key}:${type}` }).catch((e) => ({ ok: false, error: String(e), id: undefined }));
    if (!live.ok || !live.id) return { ok: false, error: live.error ?? "no action id" };
    const fin = await waitForAction(live.id);
    if (!fin || /FAIL|ERROR|REJECT|CANCEL/i.test(fin.status)) return { ok: false, error: fin ? `${fin.status} ${JSON.stringify(fin.error ?? "").slice(0, 160)}` : "timed out" };
    return { ok: true, id: idKey ? findId(fin.result, idKey) : live.id };
  };
  const stop = (what: string, e?: string, campaignId?: string): CreateResult => ({ status: done.length ? "failed" : "manual", reason: `${what} didn't go through (${(e ?? "").slice(0, 160)}).${done.length ? ` Done so far: ${done.join(", ")}. Finish the rest in the Ads console.` : ""}`, campaignId, done });

  // 2-4. Campaign, ad group, product ad.
  const c = await step("AMAZON_ADS_CAMPAIGNS_ADD", { campaigns: [{ name, adProduct: "SPONSORED_PRODUCTS", state: "ENABLED", startDateTime: now.toISOString(), marketplaceScope: "SINGLE_MARKETPLACE", marketplaces: [account.country], budgets: [{ budgetType: "MONETARY", recurrenceTimePeriod: "DAILY", budgetValue: { monetaryBudgetValue: { monetaryBudget: { value: budget } } } }] }] }, "campaignId");
  if (!c.ok || !c.id) return stop("Creating the campaign", c.error);
  done.push(`campaign "${name}" ($${budget}/day)`);
  const g = await step("AMAZON_ADS_AD_GROUPS_ADD", { adGroups: [{ campaignId: c.id, name: "Exact winners", adProduct: "SPONSORED_PRODUCTS", state: "ENABLED", defaultBid }] }, "adGroupId");
  if (!g.ok || !g.id) return stop("Adding the ad group", g.error, c.id);
  done.push("ad group");
  const a = await step("AMAZON_ADS_ADS_ADD", { ads: skus.map((sku) => ({ adProduct: "SPONSORED_PRODUCTS", adGroupId: g.id, state: "ENABLED", adType: "PRODUCT_AD", creative: { productCreative: { productCreativeSettings: { advertisedProduct: { productIdType: sku.type, productId: sku.id } } } } })) });
  if (!a.ok) return stop("Adding the product ad", a.error, c.id);
  done.push(`${skus.length} product ad${skus.length === 1 ? "" : "s"}`);

  // 5. Exact keywords. 6. Negative exact in the old ad groups.
  const k = await step("AMAZON_ADS_TARGETS_ADD", { targets: ws.map((p) => ({ campaignId: c.id, adGroupId: g.id, adProduct: "SPONSORED_PRODUCTS", negative: false, state: "ENABLED", targetType: "KEYWORD", bid: money(p.proposed && p.proposed > 0 ? p.proposed : defaultBid), targetDetails: { keywordTarget: { keyword: p.target, matchType: "EXACT" } } })) });
  if (!k.ok) return stop("Adding the exact keywords", k.error, c.id);
  done.push(`${ws.length} exact keyword${ws.length === 1 ? "" : "s"}`);
  const n = await step("AMAZON_ADS_TARGETS_ADD", { targets: ws.map((p) => ({ campaignId: p.ids!.campaignId, adGroupId: p.ids!.adGroupId, adProduct: "SPONSORED_PRODUCTS", negative: true, state: "ENABLED", targetType: "KEYWORD", targetDetails: { keywordTarget: { keyword: p.target, matchType: "EXACT" } } })) });
  if (!n.ok) return stop("Blocking the searches in the old campaigns", n.error, c.id);
  done.push("negatives in the old ad groups");
  return { status: "applied", campaignId: c.id, done };
}
