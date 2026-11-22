import Papa from "papaparse";
import { askRocco } from "./brain";
import { exportCsv, findSource, type Pull } from "./datadoe-sync";
import type { Store, Workspace } from "./store/types";

/**
 * "Before Rocco": a one-time read of what was changed in the ad account before Rocco was hired, so Rocco's memory
 * starts with the account's past, not a blank page.
 *
 * Cost per account, once: 2 DataDoe exports (change history + campaign names) = 4 AI tokens, and at most one short
 * Claude call over the summary (never the raw rows). The rules below do the counting; Claude only writes the
 * 2-3 sentence read, and any sentence with a number that isn't in the summary is dropped.
 *
 * Source: DataDoe's amazon_ads_entity_history (Amazon's own change history for Sponsored Products and Sponsored
 * Brands: campaigns, ad groups, ads, targets; state, bid and budget changes). Sponsored Display isn't included.
 */
const cols = (c: string[]) => Object.fromEntries(c.map((x) => [x, `_${x}`]));
const HISTORY: Pull = { kind: "sp_campaign", table: "amazon_ads_entity_history", query: "history", days: 365, shape: "daily", cols: cols(["ad_entity_id", "ad_entity_type", "ad_change_type", "ad_change_at_utc", "ad_campaign_id", "ad_group_id", "ad_new_value", "ad_previous_value", "ad_change_metadata"]) };
const NAMES: Pull = { kind: "sp_campaign", table: "amazon_ads_campaigns_raw", query: "campaigns raw", days: 30, shape: "daily", cols: cols(["ad_campaign_id", "ad_campaign_name"]) };

export type ChangeKind = "bid" | "budget" | "state" | "created" | "name" | "placement" | "other";
export interface PastChange { at: string; kind: ChangeKind; entity: string; campaign?: string; from?: string; to?: string; byRule?: boolean }
export interface HistorySummary { total: number; from?: string; to?: string; byKind: Partial<Record<ChangeKind, number>>; byRule: number; lastByHand?: string; busiest: { campaign: string; n: number }[]; notes: string[] }
export interface HistoryImport { at: string; summary: HistorySummary; changes: PastChange[]; read?: string }

type Row = Record<string, string>;
const DAY = 86_400_000;

export function kindOf(change: string): ChangeKind {
  const c = change.toUpperCase();
  if (/BID/.test(c)) return "bid";
  if (/BUDGET/.test(c)) return "budget";
  if (/STATUS|STATE/.test(c)) return "state";
  if (/CREAT/.test(c)) return "created";
  if (/NAME/.test(c)) return "name";
  if (/PLACEMENT/.test(c)) return "placement";
  return "other";
}

/** "3300.0" → "3300", "null"/"" → undefined, long JSON trimmed. */
export function cleanValue(v?: string): string | undefined {
  const s = String(v ?? "").trim();
  if (!s || s === "null" || s === "undefined") return undefined;
  if (/^-?\d+\.0+$/.test(s)) return s.replace(/\.0+$/, "");
  return s.length > 60 ? `${s.slice(0, 57)}…` : s;
}

const entityName = (t: string) => ({ CAMPAIGN: "campaign", AD_GROUP: "ad group", AD: "ad", KEYWORD: "keyword", TARGET: "target", NEGATIVE_KEYWORD: "negative keyword" }[t.toUpperCase()] ?? t.toLowerCase().replace(/_/g, " "));

export function parseHistory(rows: Row[], names: Map<string, string> = new Map()): PastChange[] {
  return rows
    .filter((r) => r.ad_change_at_utc)
    .map((r) => {
      const type = (r.ad_entity_type || "").toUpperCase();
      const campId = r.ad_campaign_id || (type === "CAMPAIGN" ? r.ad_entity_id : "");
      return {
        at: r.ad_change_at_utc,
        kind: kindOf(r.ad_change_type || ""),
        entity: entityName(type || "item"),
        campaign: (campId && names.get(campId)) || undefined,
        from: cleanValue(r.ad_previous_value),
        to: cleanValue(r.ad_new_value),
        byRule: /RULE/i.test(r.ad_change_type || "") || undefined,
      };
    })
    .sort((a, b) => b.at.localeCompare(a.at));
}

/** A change as one plain line, for the log page. */
export function changeLine(c: PastChange): string {
  const what = { bid: "Bid", budget: "Budget", state: "Status", created: "Created", name: "Renamed", placement: "Placement", other: "Changed" }[c.kind];
  const where = c.campaign ? ` on “${c.campaign}”` : ` (${c.entity})`;
  if (c.byRule && c.kind === "budget") return c.to ? `Budget rule${where} switched on: budget ${c.to}` : `Budget rule${where} ended${c.from ? ` (budget was ${c.from})` : ""}`;
  const move = c.kind === "created" ? "" : c.from && c.to ? `: ${c.from} → ${c.to}` : c.to ? `: set to ${c.to}` : c.from ? `: ${c.from} → removed` : "";
  return `${c.byRule ? "Budget rule · " : ""}${what}${where}${move}`;
}

/** The counting (rules, no AI): what was touched, how often, by hand or by rule, and what was never touched. */
export function summarizeHistory(changes: PastChange[], now = new Date()): HistorySummary {
  const byKind: HistorySummary["byKind"] = {};
  const per = new Map<string, number>();
  for (const c of changes) {
    byKind[c.kind] = (byKind[c.kind] ?? 0) + 1;
    if (c.campaign) per.set(c.campaign, (per.get(c.campaign) ?? 0) + 1);
  }
  const byRule = changes.filter((c) => c.byRule).length;
  const lastByHand = changes.find((c) => !c.byRule)?.at;
  const busiest = [...per].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([campaign, n]) => ({ campaign, n }));
  const s: HistorySummary = { total: changes.length, from: changes.at(-1)?.at, to: changes[0]?.at, byKind, byRule, lastByHand, busiest, notes: [] };

  const days = (iso?: string) => (iso ? Math.floor((now.getTime() - new Date(iso).getTime()) / DAY) : null);
  if (!changes.length) { s.notes.push("Amazon's change history for this ad account is empty: nothing was changed in Sponsored Products or Brands in the window Amazon keeps."); return s; }
  const d = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
  s.notes.push(`${changes.length} change${changes.length === 1 ? "" : "s"} recorded from ${d(s.from!)} to ${d(s.to!)}.`);
  if (byRule) s.notes.push(`${byRule} of them ${byRule === 1 ? "was" : "were"} made by Amazon budget rules, not by a person.`);
  const hand = days(lastByHand);
  if (lastByHand == null) s.notes.push("No change was made by hand in that window: the account has been running on autopilot.");
  else if (hand != null && hand >= 21) s.notes.push(`The last change by hand was ${hand} days ago.`);
  if (!byKind.bid) s.notes.push("No bid was changed in that window: bids haven't been tuned recently.");
  if ((byKind.state ?? 0) > 0) s.notes.push(`${byKind.state} pause/enable change${byKind.state === 1 ? "" : "s"}.`);
  if (busiest[0] && busiest[0].n >= 3) s.notes.push(`Most edited: “${busiest[0].campaign}” (${busiest[0].n} changes).`);
  return s;
}

/** Plain text for Claude's context (manager, Ask Rocco). */
export function historyText(h?: HistoryImport): string {
  if (!h) return "";
  const k = Object.entries(h.summary.byKind).map(([kind, n]) => `${n} ${kind}`).join(", ");
  return [`Before Rocco (Amazon's change history, read ${h.at.slice(0, 10)}): ${h.summary.total} changes${k ? ` (${k})` : ""}.`, ...h.summary.notes, h.read ? `Read: ${h.read}` : ""].filter(Boolean).join("\n");
}

const nums = (s: string) => (s.match(/\d+(?:[.,]\d+)*/g) ?? []).map((n) => n.replace(/,/g, ""));
/** Keep only sentences whose numbers all appear in the input. */
export function guardNumbers(text: string, input: string): string {
  const ok = new Set(nums(input));
  return text.split(/(?<=[.!?])\s+/).filter((s) => nums(s).every((n) => ok.has(n))).join(" ").trim();
}

const READ_SYSTEM = "You are Rocco, a senior Amazon ads manager taking over an account. From the summary of what was changed before you were hired, write 2-3 short plain sentences: how the account was being managed, and what that means for your first week. No greetings, no lists, no markdown. Use only numbers that appear in the summary.";

/** One-time import for one Amazon account. Saved on the team; safe to call again (it skips accounts already read). */
export async function importHistory(store: Store, wsId: string, account: { id: string; name: string }, o: { force?: boolean; now?: Date } = {}): Promise<HistoryImport | null> {
  const ws = await store.getWorkspaceById(wsId);
  if (!ws || (!o.force && ws.history?.[account.id])) return ws?.history?.[account.id] ?? null;
  const now = o.now ?? new Date();
  const get = async (p: Pull) => {
    const src = await findSource(account.id, p);
    if (!src) throw new Error(`${p.table} isn't available for this account yet`);
    return Papa.parse<Row>(await exportCsv(account.id, src, p, now), { header: true, skipEmptyLines: true }).data;
  };
  const [rows, camps] = await Promise.all([get(HISTORY), get(NAMES).catch(() => [] as Row[])]);
  const names = new Map(camps.filter((r) => r.ad_campaign_id).map((r) => [r.ad_campaign_id, r.ad_campaign_name]));
  const changes = parseHistory(rows, names);
  const summary = summarizeHistory(changes, now);
  const h: HistoryImport = { at: now.toISOString(), summary, changes: changes.slice(0, 300) };
  if (changes.length) {
    const input = [historyText(h), "Latest changes:", ...changes.slice(0, 25).map(changeLine)].join("\n");
    const read = await askRocco({ question: "What does this history tell you, and what will you do first?", context: input, system: READ_SYSTEM, maxChars: 500, label: "Task" });
    const safe = read ? guardNumbers(read, input) : "";
    if (safe) h.read = safe;
  }
  const fresh = (await store.getWorkspaceById(wsId)) ?? ws;
  fresh.history = { ...(fresh.history ?? {}), [account.id]: h };
  await store.saveWorkspace(fresh);
  return h;
}

/** The history import for the account behind a brand name. */
export const historyFor = (ws: Workspace, brand?: string) => {
  const acc = ws.amazon?.accounts?.find((a) => a.name === brand) ?? ws.amazon?.accounts?.[0];
  return acc ? ws.history?.[acc.id] : undefined;
};
