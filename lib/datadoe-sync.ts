import { REPORT_HELP, type ReportKind } from "./analyze";
import { notifyTeam } from "./notify";
import { paywall } from "./paywall";
import type { Store, Workspace } from "./store/types";
import { buildBrief, runAnalysis } from "./workspace";
import Papa from "papaparse";

/**
 * The daily pull (direct Amazon connection through DataDoe). For each connected account: find DataDoe's export for
 * each report Rocco reads, export it as CSV, map its columns onto Amazon's report headers, run Rocco's engine, then
 * text the team the top fixes. ~2 DataDoe AI Tokens per export (docs/DATADOE.md). Read-only.
 */
const BASE = (process.env.DATADOE_API_URL || "https://api.datadoe.com/api/v1").replace(/\/$/, "");
const H = () => ({ "datadoe-api-key": process.env.DATADOE_API_KEY ?? "", "content-type": "application/json" });

/** What Rocco pulls, the keyword DataDoe's source search understands, and how many days back. */
export const PULLS: { kind: ReportKind; query: string; days: number }[] = [
  { kind: "sp_search_term", query: "search term", days: 30 },
  { kind: "sp_campaign", query: "campaign", days: 30 },
  { kind: "business_report", query: "sessions", days: 30 },
  { kind: "inventory", query: "fba stock", days: 0 },
];

interface Source { id: string; name: string; requiresDatePeriod: boolean; columns: (string | { name?: string; id?: string })[] }

async function j<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { ...init, headers: { ...H(), ...(init.headers ?? {}) }, cache: "no-store" });
  if (!res.ok) throw new Error(`DataDoe ${res.status}: ${(await res.text().catch(() => "")).slice(0, 240)}`);
  return (await res.json()) as T;
}

export async function findSource(accountId: string, query: string): Promise<Source | null> {
  const d = await j<{ sources?: Source[]; recommendedSources?: Source[] }>(`/exports/sources?query=${encodeURIComponent(query)}&sellerOrVendorIds=${accountId}`);
  return d.recommendedSources?.[0] ?? d.sources?.[0] ?? null;
}

const colName = (c: Source["columns"][number]) => (typeof c === "string" ? c : c.name ?? c.id ?? "");
const day = (d: Date) => d.toISOString().slice(0, 10);

/** Create a CSV export, wait for it (≤ ~2 min), download it. */
export async function exportCsv(accountId: string, src: Source, days: number, now = new Date()): Promise<string> {
  const body: Record<string, unknown> = { sellerOrVendorIds: [accountId], sourceId: src.id, columns: src.columns.map(colName).filter(Boolean), outputType: "CSV", sendToAllOrganizationMembers: false };
  if (src.requiresDatePeriod || days > 0) { body.from = day(new Date(now.getTime() - Math.max(days, 1) * 86_400_000)); body.to = day(new Date(now.getTime() - 86_400_000)); }
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

/** DataDoe column names (snake_case) → the headers Rocco's parsers recognise from Amazon's own reports. */
const ALIASES: Record<string, string> = {
  "search term": "customer search term", "customer search term": "customer search term", query: "customer search term",
  keyword: "targeting", "keyword text": "targeting", targeting: "targeting", "targeting text": "targeting", target: "targeting",
  cost: "spend", spend: "spend", "ad spend": "spend",
  "sales 7d": "7 day total sales", "attributed sales 7d": "7 day total sales", sales: "7 day total sales", "ad sales": "7 day total sales",
  "purchases 7d": "7 day total orders", "orders 7d": "7 day total orders", "attributed conversions 7d": "7 day total orders", orders: "7 day total orders", purchases: "7 day total orders",
  "units sold 7d": "7 day total units", "units 7d": "7 day total units",
  "campaign id": "campaign id", "ad group id": "ad group id", "keyword id": "keyword id", "target id": "target id",
  "campaign name": "campaign name", campaign: "campaign name", "ad group name": "ad group name", "ad group": "ad group name",
  "match type": "match type", "keyword type": "match type", date: "date", "report date": "date",
  "daily budget": "budget", "campaign budget amount": "budget",
};
export function adaptHeaders(table: unknown[][]): unknown[][] {
  if (!table.length) return table;
  const header = table[0].map((h) => {
    const k = String(h ?? "").trim().toLowerCase().replace(/[_.]+/g, " ").replace(/\s+/g, " ");
    return ALIASES[k] ?? k;
  });
  return [header, ...table.slice(1)];
}

export interface SyncResult { account: string; kinds: string[]; errors: string[] }

/** Pull one account now: every report Rocco reads, through the same engine as everything else. */
export async function syncAccount(store: Store, ws: Workspace, account: { id: string; name: string }, now = new Date()): Promise<SyncResult> {
  const kinds: string[] = [];
  const errors: string[] = [];
  for (const p of PULLS) {
    try {
      const src = await findSource(account.id, p.query);
      if (!src) { errors.push(`${p.kind}: no source`); continue; }
      const csv = await exportCsv(account.id, src, p.days, now);
      const table = adaptHeaders(Papa.parse<unknown[]>(csv, { skipEmptyLines: true }).data);
      await runAnalysis(store, ws, account.name, table);
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
