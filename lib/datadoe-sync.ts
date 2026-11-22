import { REPORT_HELP, type ReportKind } from "./analyze";
import { notifyTeam } from "./notify";
import { paywall } from "./paywall";
import type { Store, Workspace } from "./store/types";
import { buildBrief, runAnalysis } from "./workspace";
import Papa from "papaparse";

/**
 * The daily pull (direct Amazon connection through DataDoe). For each connected account: export the DataDoe tables
 * Rocco reads (pinned by table name, verified on a real account Nov 22), rename their columns to Amazon's own report
 * headers, roll daily rows up where Rocco's readers expect a period total, run Rocco's engine, then text the team.
 * ~2 DataDoe AI Tokens per export (docs/DATADOE.md). Read-only.
 */
const BASE = (process.env.DATADOE_API_URL || "https://api.datadoe.com/api/v1").replace(/\/$/, "");
const H = () => ({ "datadoe-api-key": process.env.DATADOE_API_KEY ?? "", "content-type": "application/json" });

type Shape = "daily" | "sum_by_asin" | "latest_by_sku" | "sum_by_campaign";
export interface Pull { kind: ReportKind; table: string; query: string; days: number; shape: Shape; cols: Record<string, string> }

/** DataDoe column → Amazon report header, per table. Only these columns are exported. */
export const PULLS: Pull[] = [
  {
    kind: "sp_search_term", table: "amazon_ads_search_terms_by_campaign_by_date", query: "search term", days: 30, shape: "daily",
    cols: { date: "Date", ad_campaign_name: "Campaign Name", ad_group_name: "Ad Group Name", ad_targeting_text: "Targeting", ad_match_type: "Match Type", ad_search_term: "Customer Search Term", ad_impressions: "Impressions", ad_clicks: "Clicks", ad_spend: "Spend", ad_sales: "7 Day Total Sales", ad_orders: "7 Day Total Orders", ad_campaign_id: "Campaign Id", ad_group_id: "Ad Group Id", ad_keyword_id: "Keyword Id", ad_campaign_type: "_type" },
  },
  {
    kind: "sp_campaign", table: "amazon_ads_performance_by_campaign_by_date", query: "campaign", days: 30, shape: "sum_by_campaign",
    cols: { date: "_date", ad_campaign_name: "Campaign Name", ad_campaign_status: "Campaign Status", ad_campaign_budget_amount: "Budget", ad_impressions: "Impressions", ad_clicks: "Clicks", ad_spend: "Spend", ad_sales: "7 Day Total Sales", ad_orders: "7 Day Total Orders", ad_campaign_id: "Campaign Id", ad_campaign_type: "_type" },
  },
  {
    kind: "business_report", table: "amazon_sales_and_traffic_with_cogs", query: "sessions", days: 30, shape: "sum_by_asin",
    cols: { child_asin: "(Child) ASIN", product_name: "Title", session: "Sessions - Total", page_views: "Page Views - Total", total_units: "Units Ordered", total_sales: "Ordered Product Sales", buybox_percentage: "Featured Offer (Buy Box) Percentage" },
  },
  {
    kind: "inventory", table: "amazon_fba_inventory_health", query: "fba stock", days: 3, shape: "latest_by_sku",
    cols: { date: "_date", sku: "SKU", child_asin: "ASIN", product_name: "Product Name", available: "Available", units_shipped_t30: "Units Sold Last 30 Days", days_of_supply: "Days of Supply" },
  },
];

interface Source { id: string; name: string; tableName?: string; requiresDatePeriod: boolean; initialLoadProgress?: number | null }

async function j<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { ...init, headers: { ...H(), ...(init.headers ?? {}) }, cache: "no-store" });
  if (!res.ok) throw new Error(`DataDoe ${res.status}: ${(await res.text().catch(() => "")).slice(0, 240)}`);
  return (await res.json()) as T;
}

/** The pinned table for this pull (DataDoe's "recommended" match is often a profit table, not what Rocco reads). */
export async function findSource(accountId: string, p: Pull): Promise<Source | null> {
  const d = await j<{ sources?: Source[]; recommendedSources?: Source[] }>(`/exports/sources?query=${encodeURIComponent(p.query)}&sellerOrVendorIds=${accountId}`);
  return [...(d.recommendedSources ?? []), ...(d.sources ?? [])].find((s) => s.tableName === p.table) ?? null;
}

const day = (d: Date) => d.toISOString().slice(0, 10);

/** Create a CSV export of just the columns Rocco needs, wait for it (≤ ~2 min), download it. */
export async function exportCsv(accountId: string, src: Source, p: Pull, now = new Date()): Promise<string> {
  const body: Record<string, unknown> = {
    sellerOrVendorIds: [accountId], sourceId: src.id, columns: Object.keys(p.cols), outputType: "CSV", sendToAllOrganizationMembers: false,
    from: day(new Date(now.getTime() - Math.max(p.days, 1) * 86_400_000)), to: day(new Date(now.getTime() - 86_400_000)),
  };
  const ex = await j<{ id: string }>("/exports", { method: "POST", body: JSON.stringify(body) });
  for (let i = 0; i < 24; i++) {
    await new Promise((r) => setTimeout(r, i === 0 ? 2000 : 5000));
    const s = await j<{ status: string; failureReason?: unknown }>(`/exports/${ex.id}`);
    if (/FAIL|ERROR|EXPIRED/i.test(s.status)) throw new Error(`export ${s.status}: ${JSON.stringify(s.failureReason ?? "").slice(0, 160)}`);
    if (/COMPLET|DONE|READY|SUCCE/i.test(s.status)) {
      const raw = await fetch(`${BASE}/exports/${ex.id}/raw`, { headers: H(), cache: "no-store", redirect: "follow" });
      if (raw.status === 202) continue;
      if (!raw.ok) throw new Error(`download ${raw.status}`);
      return await raw.text();
    }
  }
  throw new Error("export took too long");
}

const num = (v: unknown) => { const n = Number(String(v ?? "").replace(/[$,%\s]/g, "")); return Number.isFinite(n) ? n : 0; };

/** Export rows → an Amazon-shaped table Rocco's readers recognise. */
export function toAmazonTable(rows: Record<string, unknown>[], p: Pull): unknown[][] {
  // Sponsored Products only for the ads reports (Rocco's ad rules are SP rules).
  const sp = rows.filter((r) => !("ad_campaign_type" in r) || !r.ad_campaign_type || /PRODUCT/i.test(String(r.ad_campaign_type)));
  const out = Object.entries(p.cols).filter(([, h]) => !h.startsWith("_"));
  if (p.shape === "daily") return [out.map(([, h]) => h), ...sp.map((r) => out.map(([c]) => r[c] ?? ""))];

  if (p.shape === "sum_by_asin") {
    const by = new Map<string, Record<string, number | string>>();
    for (const r of sp) {
      const k = String(r.child_asin ?? "");
      if (!k) continue;
      const a = by.get(k) ?? { child_asin: k, product_name: String(r.product_name ?? ""), session: 0, page_views: 0, total_units: 0, total_sales: 0, _bb: 0 };
      const pv = num(r.page_views);
      a.session = (a.session as number) + num(r.session);
      a.page_views = (a.page_views as number) + pv;
      a.total_units = (a.total_units as number) + num(r.total_units);
      a.total_sales = (a.total_sales as number) + num(r.total_sales);
      a._bb = (a._bb as number) + num(r.buybox_percentage) * pv; // page-view-weighted Buy Box %
      by.set(k, a);
    }
    const rowsOut = [...by.values()].map((a) => ({ ...a, buybox_percentage: (a.page_views as number) > 0 ? `${((a._bb as number) / (a.page_views as number)).toFixed(1)}%` : "" }));
    return [out.map(([, h]) => h), ...rowsOut.map((r) => out.map(([c]) => (r as Record<string, unknown>)[c] ?? ""))];
  }

  if (p.shape === "sum_by_campaign") {
    const by = new Map<string, Record<string, unknown>>();
    let first = "", last = "";
    for (const r of sp) {
      const k = String(r.ad_campaign_id ?? r.ad_campaign_name ?? "");
      if (!k) continue;
      const d = String(r.date ?? "");
      if (d && (!first || d < first)) first = d;
      if (d && d > last) last = d;
      const a = by.get(k) ?? { ...r, ad_impressions: 0, ad_clicks: 0, ad_spend: 0, ad_sales: 0, ad_orders: 0, _d: "" };
      for (const f of ["ad_impressions", "ad_clicks", "ad_spend", "ad_sales", "ad_orders"]) a[f] = num(a[f]) + num(r[f]);
      if (d >= String(a._d)) { a._d = d; a.ad_campaign_budget_amount = r.ad_campaign_budget_amount; a.ad_campaign_status = r.ad_campaign_status; a.ad_campaign_name = r.ad_campaign_name; }
      by.set(k, a);
    }
    const head = ["Start Date", "End Date", ...out.map(([, h]) => h)];
    return [head, ...[...by.values()].map((r) => [first, last, ...out.map(([c]) => r[c] ?? "")])];
  }

  // latest_by_sku: newest snapshot per SKU
  const latest = new Map<string, Record<string, unknown>>();
  for (const r of sp) {
    const k = String(r.sku ?? r.child_asin ?? "");
    if (!k) continue;
    const prev = latest.get(k);
    if (!prev || String(r.date ?? "") > String(prev.date ?? "")) latest.set(k, r);
  }
  return [out.map(([, h]) => h), ...[...latest.values()].map((r) => out.map(([c]) => r[c] ?? ""))];
}

export interface SyncResult { account: string; kinds: string[]; errors: string[] }

/** Pull one account now: every report Rocco reads, through the same engine as everything else. */
export async function syncAccount(store: Store, ws: Workspace, account: { id: string; name: string }, now = new Date()): Promise<SyncResult> {
  const kinds: string[] = [];
  const errors: string[] = [];
  for (const p of PULLS) {
    try {
      const src = await findSource(account.id, p);
      if (!src) { errors.push(`${p.kind}: table not available yet`); continue; }
      const csv = await exportCsv(account.id, src, p, now);
      const rows = Papa.parse<Record<string, unknown>>(csv, { header: true, skipEmptyLines: true }).data;
      if (!rows.length) { errors.push(`${p.kind}: no rows yet${src.initialLoadProgress != null && src.initialLoadProgress < 100 ? ` (history ${src.initialLoadProgress}% loaded)` : ""}`); continue; }
      await runAnalysis(store, ws, account.name, toAmazonTable(rows, p));
      kinds.push(p.kind);
    } catch (e) {
      errors.push(`${p.kind}: ${e instanceof Error ? e.message.slice(0, 160) : "failed"}`);
    }
  }
  return { account: account.name, kinds, errors };
}

/** After a pull: the morning text with the top fixes (+ the offer for teams without a plan). */
export async function tellTeam(store: Store, ws: Workspace, r: SyncResult, now = new Date()): Promise<void> {
  if (!r.kinds.length) return;
  const fresh = (await store.getWorkspaceById(ws.id)) ?? ws;
  const b = await buildBrief(store, fresh, now);
  const open = [...(b.perBrand.find((x) => x.brand === r.account)?.open ?? [])].sort((a, c) => c.valueMonthly - a.valueMonthly).slice(0, 3);
  const names = r.kinds.map((k) => REPORT_HELP[k as ReportKind]?.name ?? k).join(", ");
  const L = [`☀️ ${r.account}: checked ${names}.`];
  for (const o of open) L.push(`• ${o.code}: ${o.reason.slice(0, 110)}`);
  if (open.length) L.push(`Reply YES ${open.map((o) => o.code).join(" ")} and I'll make ${open.length === 1 ? "it" : "them"} in Amazon.`);
  const offer = paywall(fresh, b, "found", { now });
  if (offer) await store.saveWorkspace(fresh);
  await notifyTeam(store, fresh, [L.join("\n"), ...(offer ? [offer.text, offer.url] : [])]).catch(() => 0);
}
