import { teamUrl } from "./workspace";
import { currencyOf, localize } from "./currency";
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
 * One export per report covers a whole group of accounts: 2 DataDoe AI Tokens per export at any size (docs/COSTS.md). Read-only.
 */
const BASE = (process.env.DATADOE_API_URL || "https://api.datadoe.com/api/v1").replace(/\/$/, "");
const H = (body?: unknown) => ({ "datadoe-api-key": process.env.DATADOE_API_KEY ?? "", ...(body ? { "content-type": "application/json" } : {}) }); // no content-type on bodiless calls: DataDoe rejects a JSON DELETE with no body

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
    cols: { date: "_date", sku: "SKU", child_asin: "ASIN", product_name: "Product Name", available: "Available", units_shipped_t30: "Units Sold Last 30 Days", days_of_supply: "Days of Supply", inbound_quantity: "Inbound Quantity" },
  },
];

interface Source { id: string; name: string; tableName?: string; requiresDatePeriod: boolean; initialLoadProgress?: number | null }

async function j<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await ddFetch(`${BASE}${path}`, init);
  if (!res.ok) throw new Error(`DataDoe ${res.status}: ${(await res.text().catch(() => "")).slice(0, 240)}`);
  return (await res.json()) as T;
}

/**
 * fetch with DataDoe's rate limit in mind (3 requests/second per organization → 429 + Retry-After): waits and retries
 * with growing, jittered delays, so 100 accounts pulling at once slow down instead of failing.
 */
export async function ddFetch(url: string, init: RequestInit = {}, tries = 6): Promise<Response> {
  for (let i = 0; ; i++) {
    const res = await fetch(url, { ...init, headers: { ...H(init.body), ...(init.headers ?? {}) }, cache: "no-store", redirect: "follow" });
    if (res.status !== 429 || i >= tries - 1) return res;
    const wait = Number(res.headers.get("retry-after") ?? 1) * 1000 + i * 700 + Math.random() * 600;
    await new Promise((r) => setTimeout(r, wait));
  }
}

/** The pinned table for this pull (DataDoe's "recommended" match is often a profit table, not what Rocco reads). */
export async function findSource(accountId: string, p: Pull): Promise<Source | null> {
  const d = await j<{ sources?: Source[]; recommendedSources?: Source[] }>(`/exports/sources?query=${encodeURIComponent(p.query)}&sellerOrVendorIds=${accountId}`);
  return [...(d.recommendedSources ?? []), ...(d.sources ?? [])].find((s) => s.tableName === p.table) ?? null;
}

const day = (d: Date) => d.toISOString().slice(0, 10);

/** Every export also carries the account column, so one file can cover many accounts. */
const SELLER = "seller_or_vendor_id";
const columnsOf = (p: Pull) => [...new Set([...Object.keys(p.cols), SELLER])];

/**
 * One CSV export of just the columns Rocco needs, for one or many accounts (2 DataDoe AI tokens per export, at any
 * size), then wait for it (≤ ~3 min) and download it.
 */
export async function exportCsv(accountIds: string | string[], src: Source, p: Pull, now = new Date(), range?: { from: string; to: string }): Promise<string> {
  const ids = Array.isArray(accountIds) ? accountIds : [accountIds];
  const body: Record<string, unknown> = {
    sellerOrVendorIds: ids, sourceId: src.id, columns: columnsOf(p), outputType: "CSV", sendToAllOrganizationMembers: false,
    // Only date-based tables take a period (snapshot tables like ads raw don't).
    ...(src.requiresDatePeriod === false ? {} : range ?? { from: day(new Date(now.getTime() - Math.max(p.days, 1) * 86_400_000)), to: day(new Date(now.getTime() - 86_400_000)) }),
  };
  const ex = await j<{ id: string }>("/exports", { method: "POST", body: JSON.stringify(body) });
  for (let i = 0; i < 36; i++) {
    await new Promise((r) => setTimeout(r, i === 0 ? 2000 : 5000));
    const s = await j<{ status: string; failureReason?: unknown }>(`/exports/${ex.id}`);
    if (/FAIL|ERROR|EXPIRED/i.test(s.status)) throw new Error(`export ${s.status}: ${JSON.stringify(s.failureReason ?? "").slice(0, 160)}`);
    if (/COMPLET|DONE|READY|SUCCE/i.test(s.status)) {
      const raw = await ddFetch(`${BASE}/exports/${ex.id}/raw`);
      if (raw.status === 202) continue;
      if (!raw.ok) throw new Error(`download ${raw.status}`);
      return await raw.text();
    }
  }
  throw new Error("export took too long");
}

/** Rows of a multi-account export, per account. */
export function splitBySeller(rows: Record<string, unknown>[], ids: string[]): Map<string, Record<string, unknown>[]> {
  const out = new Map(ids.map((id) => [id, [] as Record<string, unknown>[]]));
  for (const r of rows) {
    const id = String(r[SELLER] ?? (ids.length === 1 ? ids[0] : ""));
    out.get(id)?.push(r);
  }
  return out;
}

/** Old per-account recurring exports (before Nov 22): each run spent tokens daily. Removed on the next pull. */
export async function deleteSchedule(id: string): Promise<boolean> {
  const res = await ddFetch(`${BASE}/exports/schedules/${encodeURIComponent(id)}`, { method: "DELETE" });
  return res.ok || res.status === 404;
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
export interface Job { wsId: string; id: string; name: string }

/**
 * Pull a group of accounts (any Rocco teams) together: one export per report for the whole group, split by account,
 * then each account's reports go through Rocco's engine and its result is saved on its team. 100 accounts in groups
 * of 10 = 40 exports a day (~2,400 tokens/month) instead of 400.
 */
export async function syncGroup(store: Store, jobs: Job[], now = new Date()): Promise<Map<string, SyncResult>> {
  const ids = [...new Set(jobs.map((x) => x.id))];
  const res = new Map<string, SyncResult>(jobs.map((x) => [x.id, { account: x.name, kinds: [], errors: [] }]));
  if (!ids.length) return res;
  const files = await Promise.all(PULLS.map(async (p) => {
    try {
      const src = await findSource(ids[0], p);
      if (!src) return { p, error: "table not available yet" };
      const csv = await exportCsv(ids, src, p, now);
      const rows = Papa.parse<Record<string, unknown>>(csv, { header: true, skipEmptyLines: true }).data;
      return { p, by: splitBySeller(rows, ids), progress: src.initialLoadProgress };
    } catch (e) {
      return { p, error: e instanceof Error ? e.message.slice(0, 160) : "failed" };
    }
  }));
  for (const job of jobs) {
    const r = res.get(job.id)!;
    const ws = await store.getWorkspaceById(job.wsId);
    if (!ws) { r.errors.push("team not found"); continue; }
    for (const f of files) {
      if ("error" in f) { r.errors.push(`${f.p.kind}: ${f.error}`); continue; }
      const rows = f.by.get(job.id) ?? [];
      if (!rows.length) { r.errors.push(`${f.p.kind}: no rows yet${f.progress != null && f.progress < 100 ? ` (history ${f.progress}% loaded)` : ""}`); continue; }
      try { await runAnalysis(store, ws, job.name, toAmazonTable(rows, f.p)); r.kinds.push(f.p.kind); }
      catch (e) { r.errors.push(`${f.p.kind}: ${e instanceof Error ? e.message.slice(0, 160) : "failed"}`); }
    }
    // Save the result; retire this account's old per-account recurring exports.
    const fresh = (await store.getWorkspaceById(job.wsId)) ?? ws;
    const old = Object.values(fresh.amazon?.schedules?.[job.id] ?? {});
    const gone = await Promise.all(old.map((sid) => deleteSchedule(sid).catch(() => false)));
    const schedules = { ...(fresh.amazon?.schedules ?? {}) };
    if (gone.every(Boolean)) delete schedules[job.id];
    const syncs = { ...(fresh.amazon?.syncs ?? {}), [job.id]: { at: now.toISOString(), kinds: r.kinds, errors: r.errors } };
    const all = Object.values(syncs);
    fresh.amazon = { ...(fresh.amazon ?? { accounts: [] }), schedules, syncs, lastSync: { at: now.toISOString(), kinds: [...new Set(all.flatMap((x) => x.kinds))], errors: all.flatMap((x) => x.errors) } };
    await store.saveWorkspace(fresh);
  }
  return res;
}

/** Pull one account now (Check now, first pull after connecting): a group of one. */
export async function pullAndSave(store: Store, wsId: string, account: { id: string; name: string }, now = new Date()): Promise<SyncResult | null> {
  if (!(await store.getWorkspaceById(wsId))) return null;
  return (await syncGroup(store, [{ wsId, id: account.id, name: account.name }], now)).get(account.id) ?? null;
}

/** After a pull: the morning text with the top fixes (+ the offer for teams without a plan). */
export async function tellTeam(store: Store, ws: Workspace, r: SyncResult, now = new Date(), auto: string | null = null): Promise<void> {
  if (!r.kinds.length) return;
  const fresh = (await store.getWorkspaceById(ws.id)) ?? ws;
  // The team's reminder settings (dashboard card): off, weekly on their day, or every morning.
  const rem = fresh.reminders;
  if (rem?.cadence === "off") return;
  if (rem?.cadence === "weekly" && now.getUTCDay() !== (rem.weekday ?? 1)) return;
  const b = await buildBrief(store, fresh, now);
  const open = [...(b.perBrand.find((x) => x.brand === r.account)?.open ?? [])].sort((a, c) => c.valueMonthly - a.valueMonthly).slice(0, 3);
  const plan = fresh.manager?.[r.account];
  const live = new Set(open.length ? (b.perBrand.find((x) => x.brand === r.account)?.open ?? []).map((p) => p.code) : []);
  const picks = (plan?.picks ?? []).filter((p) => p.codes.every((c) => live.has(c))).slice(0, 3);
  const all = b.perBrand.find((x) => x.brand === r.account)?.open ?? [];
  if (!all.length) { if (auto) await notifyTeam(store, fresh, [`${r.account}: ${auto}`]).catch(() => 0); return; } // no work today: only the autopilot note, if any
  const codes = picks.length ? picks.flatMap((p) => p.codes) : open.map((o) => o.code);
  const total = Math.round(all.reduce((t, p) => t + p.valueMonthly, 0)).toLocaleString("en-US");
  const TITLE: Record<string, string> = { negative: "Block searches wasting money", harvest: "New exact campaign from proven searches", bid: "Fix bids", budget: "Raise budgets on winners", placement: "Tune placements", ads_down: "Ease ads on low stock", structure: "Clean up campaigns" };
  const heads = picks.length ? picks.map((p) => ({ codes: p.codes, title: p.title })) : open.map((o) => ({ codes: [o.code], title: `${TITLE[o.kind] ?? "Fix"}: ${o.target.slice(0, 40)}` }));
  const style = rem?.style ?? (rem?.approveByText ? "approve" : "nudge");
  const head = `☀️ ${r.account}: ${all.length} job${all.length === 1 ? "" : "s"} today, worth ~$${total}/mo.`;
  let L: string[];
  if (style === "approve" && rem?.approveByText && codes.length) {
    L = [head, ...heads.map((h) => `• ${h.codes.join("+")}: ${h.title}`), `Reply YES ${codes.join(" ")} and I'll make ${codes.length === 1 ? "it" : "them"} in Amazon. All of today's work: ${teamUrl(ws)}`];
  } else if (style === "top3") {
    L = [head, ...heads.slice(0, 3).map((h) => `• ${h.title}`), `Review and approve: ${teamUrl(ws)}`];
  } else {
    // Default: one line to bring them to the site, where they see and understand every fix before approving.
    L = [`${head} Biggest: ${(heads[0]?.title ?? "today's top fix").replace(/\.$/, "")}. Review (2 min): ${teamUrl(ws)}`];
  }
  const offer = paywall(fresh, b, "found", { now });
  if (offer) await store.saveWorkspace(fresh);
  const cur = currencyOf(ws.amazon?.accounts?.find((a) => a.name === r.account)?.country);
  if (auto) L.splice(1, 0, auto);
  await notifyTeam(store, fresh, [localize(L.join("\n"), cur), ...(offer ? [offer.text, offer.url] : [])]).catch(() => 0);
}
