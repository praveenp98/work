import type { buildBrief } from "../workspace";
import type { BenchLine } from "../rules/benchmarks";
import type { PendingItem, Snapshot } from "../store/types";

type Brief = Awaited<ReturnType<typeof buildBrief>>;
const $ = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const DAY = 86400000;

/**
 * Rocco's daily numbers: short, scannable, built for a phone lock screen.
 * Freshness is explicit: numbers come from the last check the team ran.
 */
export function dailyNumbers(b: Brief, o: { now?: Date; bench?: BenchLine[]; pending?: PendingItem[] } = {}): string {
  const now = o.now ?? new Date();
  const day = now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
  const L = [`☀️ Rocco's numbers · ${day}`];
  const pb = b.perBrand[0];
  const latest = (k: string): Snapshot | undefined => pb?.trends.find((t) => t.kind === k)?.latest;
  const prev = (k: string): Snapshot | null | undefined => pb?.trends.find((t) => t.kind === k)?.previous;
  // 🚨 First: anything on fire (suppressed listings, lost Buy Box).
  const lh = latest("listing_health");
  if (lh && Number(lh.stats.problems) > 0) L.push(`🚨 ${lh.stats.problems} listing${Number(lh.stats.problems) === 1 ? "" : "s"} not selling${Number(lh.stats.suppressed) ? ` (${lh.stats.suppressed} suppressed)` : ""}${lh.stats.worst ? `: ${lh.stats.worst}` : ""}. Pause their ads and fix in Seller Central.`);
  const bb = latest("business_report");
  if (bb && Number(bb.stats.buyBoxLow) > 0) L.push(`⚠️ Buy Box below 90% on ${bb.stats.buyBoxLow} ASIN${Number(bb.stats.buyBoxLow) === 1 ? "" : "s"}${bb.stats.buyBoxWorst ? ` (worst: ${bb.stats.buyBoxWorst})` : ""}. Ads there may pay for someone else's sale.`);
  const st = latest("sp_search_term");
  if (st) {
    const s = st.stats;
    const p = prev("sp_search_term")?.stats;
    const acos = Number(s.acosPct), target = Math.round((pb?.settings.targetAcos ?? 0.3) * 100);
    const trend = p && Number(p.leakMonthly) ? (Number(s.leakMonthly) < Number(p.leakMonthly) ? " 📉" : Number(s.leakMonthly) > Number(p.leakMonthly) ? " 📈" : "") : "";
    L.push(`📊 Ads: ${$(Number(s.spend))} spend · ${$(Number(s.sales))} sales · ACoS ${Math.round(acos)}% (target ${target}%)`);
    L.push(`🕳️ Leak: ${$(Number(s.leakMonthly))}/mo (${Math.round(Number(s.leakPct ?? 0))}%)${trend}${Number(s.newBurners) > 0 ? ` · 🔥 ${s.newBurners} new money-burner${Number(s.newBurners) === 1 ? "" : "s"}` : ""}`);
  }
  const biz = latest("business_report");
  if (biz) L.push(`🛒 ${$(Number(biz.stats.sales))} total sales · ${Number(biz.stats.conversionPct).toFixed(1)}% conversion${biz.stats.tacosPct ? ` · TACoS ${Number(biz.stats.tacosPct).toFixed(1)}%` : ""}`);
  const inv = latest("inventory");
  if (inv && Number(inv.stats.atRisk) > 0) L.push(`📦 ${inv.stats.atRisk} SKU${Number(inv.stats.atRisk) === 1 ? "" : "s"} could run out within 2 weeks`);
  if (b.totals.applied) L.push(`✅ ${b.totals.worked}/${b.totals.applied} changes worked${b.saved ? ` · ${$(b.saved)} saved so far` : ""}`);
  for (const x of (o.bench ?? []).slice(0, 1)) L.push(`🏁 Better than ${x.betterThanPct}% of Rocco sellers on ${x.label}`);
  const open = pb ? [...pb.open].sort((a, c) => c.valueMonthly - a.valueMonthly).slice(0, 3) : [];
  if (open.length) {
    const val = open.reduce((t, p) => t + p.valueMonthly, 0);
    L.push(`👉 ${open.length} fix${open.length === 1 ? "" : "es"} waiting${val ? ` (~${$(val)}/mo)` : ""}: ${open.map((p) => `${p.code} ${short(p.target)}`).join(", ")}`, `Reply YES ${open.map((p) => p.code).join(" ")} to approve.`);
  }
  if (o.pending?.length) L.push(`⏳ Approved by text, waiting for your AI to apply: ${o.pending.flatMap((p) => p.codes).join(", ")}`);
  const newest = pb?.trends.map((t) => new Date(t.latest.createdAt).getTime()).sort((a, c) => c - a)[0];
  if (!newest) L.push("No numbers yet. In Claude or ChatGPT, say “Rocco, morning check” once and I'll text you every morning.");
  else if (now.getTime() - newest > 2 * DAY) L.push(`⚠️ Last check was ${Math.floor((now.getTime() - newest) / DAY)} days ago. Say “Rocco, morning check” in Claude/ChatGPT to refresh.`);
  if (b.season) L.push(`📅 ${b.season}`);
  return L.join("\n");
}

const short = (s: string) => (s.length > 28 ? s.slice(0, 26) + "…" : s);
