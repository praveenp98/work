import type { CampaignRow } from "../parsers/campaign";
import type { ParsedReport, SearchTermRow } from "../parsers/searchTerm";
import type { Action, ActionResult } from "../store/types";
import { metricsOf } from "./proposals";
import { r2 } from "./types";

const DAY = 86400000;
const day = (d: Date) => Math.floor(d.getTime() / DAY);
const lc = (s: string) => s.trim().toLowerCase();

/**
 * Rows from a report that fall strictly after the day a change was applied.
 * Daily reports are filtered per row; summary reports count only if the whole period starts after the change.
 */
export function rowsAfter(report: ParsedReport, appliedAt: string): { rows: SearchTermRow[]; days: number } {
  const a = day(new Date(appliedAt));
  const rows = report.rows.filter((r) => r.date && day(r.date) > a);
  const isDaily = report.rows.some((r) => r.date && r.endDate && day(r.date) === day(r.endDate));
  if (isDaily) return { rows, days: new Set(rows.map((r) => day(r.date!))).size };
  return { rows, days: rows.length ? report.days : 0 };
}

function sum(rows: SearchTermRow[]) {
  return rows.reduce((t, r) => ({ spend: t.spend + r.spend, sales: t.sales + r.sales, clicks: t.clicks + r.clicks, orders: t.orders + r.orders }), { spend: 0, sales: 0, clicks: 0, orders: 0 });
}

/** Evaluate one applied change against a newer search term report. Returns null if this report can't say anything about it. */
export function evaluateAction(action: Action, report: ParsedReport, targetAcos: number): ActionResult | null {
  const p = action.proposal;
  const { rows, days } = rowsAfter(report, action.appliedAt);
  const now = new Date().toISOString();
  if (!["negative", "bid", "harvest"].includes(p.kind)) return null;
  if (days === 0) return null; // report doesn't cover any day after the change

  if (p.kind === "negative") {
    const hit = rows.filter((r) => lc(r.campaign) === lc(p.campaign) && lc(r.adGroup) === lc(p.adGroup) && lc(r.searchTerm) === lc(p.target));
    const t = sum(hit);
    const after = metricsOf(t, days);
    const before = p.before?.spendPerDay ?? 0;
    if (after.spendPerDay <= before * 0.1) {
      const saved = r2(before * days);
      return { checkedAt: now, status: "worked", summary: `Blocked. "${p.target}" spent ${t.spend ? "$" + t.spend.toFixed(2) : "$0"} in ${days} days after the change (was ~$${before.toFixed(2)}/day). ~$${saved} of spend avoided (estimate: assumes it would have kept spending at that rate).`, after, savedEstimate: saved, basis: "estimated" };
    }
    return { checkedAt: now, status: "no_effect", summary: `"${p.target}" still spent $${t.spend.toFixed(2)} in ${days} days. Check the negative was added as ${p.matchType} in ${p.campaign} / ${p.adGroup}.`, after };
  }

  if (p.kind === "harvest") {
    const hit = rows.filter((r) => lc(r.targeting) === lc(p.target) && (r.matchType === "EXACT" || p.matchType === "product"));
    const t = sum(hit);
    const after = metricsOf(t, days);
    if (t.clicks < 5) return { checkedAt: now, status: "not_enough_data", summary: `The new ${p.matchType} keyword "${p.target}" has only ${t.clicks} clicks so far. Check its bid is live.`, after };
    if (t.orders > 0) return { checkedAt: now, status: "worked", summary: `"${p.target}" as its own keyword: ${t.orders} orders, $${t.sales.toFixed(0)} sales at ${after.acos >= 0 ? Math.round(after.acos * 100) + "%" : "n/a"} ACoS in ${days} days.`, after };
    return { checkedAt: now, status: "no_effect", summary: `"${p.target}" got ${t.clicks} clicks and no orders as an exact keyword. Lower its bid 20% or pause it.`, after };
  }

  // bid
  const hit = rows.filter((r) => lc(r.campaign) === lc(p.campaign) && lc(r.adGroup) === lc(p.adGroup) && lc(r.targeting) === lc(p.target) && (!p.matchType || r.matchType === p.matchType));
  const t = sum(hit);
  const after = metricsOf(t, days);
  const b = p.before;
  if (t.clicks < 10 || !b) return { checkedAt: now, status: "not_enough_data", summary: `${p.target}: ${t.clicks} clicks since the change. Rocco needs ~10 to judge.`, after };
  const down = (p.proposed ?? 0) < (p.current ?? 0);
  const fmt = (a: number) => (a < 0 ? "no sales" : `${Math.round(a * 100)}%`);
  if (down) {
    const better = (b.acos < 0 && after.acos >= 0) || (after.acos >= 0 && b.acos >= 0 && after.acos < b.acos) || after.spendPerDay < b.spendPerDay * 0.85;
    const worse = after.acos >= 0 && b.acos >= 0 && after.acos > b.acos * 1.1;
    return { checkedAt: now, status: worse ? "worse" : better ? "worked" : "no_effect", summary: `${p.target}: ACoS ${fmt(b.acos)} → ${fmt(after.acos)}, spend $${b.spendPerDay}/day → $${after.spendPerDay}/day.${worse ? " Consider reverting." : ""}`, after };
  }
  const grew = after.salesPerDay > b.salesPerDay;
  const ok = after.acos >= 0 && after.acos <= targetAcos * 1.2;
  return { checkedAt: now, status: grew && ok ? "worked" : !ok ? "worse" : "no_effect", summary: `${p.target}: sales $${b.salesPerDay}/day → $${after.salesPerDay}/day at ACoS ${fmt(after.acos)}.${!ok ? " Above target: step the bid back down." : ""}`, after };
}

/** Budget change check against a newer campaign report (rows after the change). */
export function evaluateBudget(action: Action, camp: { rows: CampaignRow[]; days: number }, targetAcos: number): ActionResult | null {
  const p = action.proposal;
  if (p.kind !== "budget" || !p.before) return null;
  const a = day(new Date(action.appliedAt));
  const rows = camp.rows.filter((r) => r.date && day(r.date) > a && lc(r.campaign) === lc(p.campaign));
  if (!rows.length) return null;
  const isDaily = rows.every((r) => r.date && r.endDate && day(r.date) === day(r.endDate));
  const days = isDaily ? new Set(rows.map((r) => day(r.date!))).size : camp.days;
  const t = rows.reduce((x, r) => ({ spend: x.spend + r.spend, sales: x.sales + r.sales, clicks: x.clicks + r.clicks, orders: x.orders + r.orders }), { spend: 0, sales: 0, clicks: 0, orders: 0 });
  const after = metricsOf(t, days);
  const b = p.before;
  const now = new Date().toISOString();
  const fmt = (x: number) => (x < 0 ? "no sales" : `${Math.round(x * 100)}%`);
  const up = (p.proposed ?? 0) > (p.current ?? 0);
  const summary = `${p.campaign}: sales $${b.salesPerDay}/day → $${after.salesPerDay}/day, ACoS ${fmt(b.acos)} → ${fmt(after.acos)}.`;
  if (up) {
    const ok = after.salesPerDay > b.salesPerDay && after.acos >= 0 && after.acos <= targetAcos * 1.2;
    return { checkedAt: now, status: ok ? "worked" : after.acos > targetAcos * 1.2 ? "worse" : "no_effect", summary: summary + (ok ? "" : " Extra budget isn't paying off yet."), after };
  }
  const saved = r2(Math.max(0, b.spendPerDay - after.spendPerDay) * days);
  const ok = after.spendPerDay < b.spendPerDay && (after.acos < 0 || b.acos < 0 || after.acos <= b.acos);
  return { checkedAt: now, status: ok ? "worked" : "no_effect", summary: summary + (ok ? ` Spend down $${saved} with sales holding (measured).` : ""), after, savedEstimate: ok ? saved : undefined, basis: "measured" };
}
