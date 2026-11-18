import { REPORT_HELP, type AnalyzeOutput, type ReportKind } from "../analyze";
import type { Proposal } from "../rules/types";
import type { BenchLine } from "../rules/benchmarks";
import type { TermDiff } from "../rules/terms";
import type { Action, Snapshot } from "../store/types";
import type { buildBrief } from "../workspace";

import { FREE_PROPOSALS } from "../workspace";
export { FREE_PROPOSALS };
const $ = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const ICON: Record<string, string> = { high: "🔴", medium: "🟠", low: "⚪", win: "🟢" };
const KIND_NAME: Record<string, string> = { sp_search_term: "Search terms", sp_campaign: "Budgets", sp_placement: "Placements", business_report: "Business Report", inventory: "Inventory", bulk_structure: "Structure", bulk: "Structure" };

export function proposalLine(p: Proposal): string {
  const change = p.kind === "negative" ? `add ${p.matchType} "${p.target}" in ${p.campaign} / ${p.adGroup}`
    : p.kind === "harvest" ? `add "${p.target}" as ${p.matchType} keyword, start bid $${p.proposed}`
    : p.kind === "bid" ? `${p.target} (${p.matchType}) in ${p.campaign} / ${p.adGroup}: bid → $${p.proposed} (avg CPC $${p.current})`
    : p.kind === "budget" ? `${p.campaign}: daily budget $${p.current} → $${p.proposed}`
    : p.kind === "placement" ? `${p.campaign}: ${p.target} placement adjustment ${p.proposed ? `+${p.proposed} points` : "→ 0%"}`
    : p.kind === "ads_down" ? `lower ad pressure on SKU ${p.target}`
    : `${p.target}`;
  return `- **${p.code}** ${change}. ${p.reason}${p.valueMonthly ? ` (~${$(p.valueMonthly)}/mo)` : ""}`;
}

export function formatAnalysis(out: AnalyzeOutput, o: { licensed: boolean; runId?: string; checked?: Action[]; previous?: Snapshot | null; memory: boolean; diff?: TermDiff | null; bench?: { lines: BenchLine[]; n: number; ready: boolean } }): string {
  const a = out.analysis;
  const lines = [`## Rocco · ${REPORT_HELP[out.kind].name}`, a.headline];
  if (o.previous) lines.push(`_Last time (${o.previous.createdAt.slice(0, 10)}): ${o.previous.headline}_`);
  if (o.bench?.ready) {
    lines.push("", `### vs. other Rocco accounts (anonymized, ${o.bench.n} accounts)`);
    for (const b of o.bench.lines) lines.push(`- ${b.label}: ${b.value}${b.unit} (median ${b.median}${b.unit}) → better than ${b.betterThanPct}% of accounts`);
  }
  if (o.checked?.length) {
    lines.push("", "### How your past changes did");
    for (const c of o.checked) lines.push(`- ${statusIcon(c.status)} **${c.code}** ${c.result?.summary}`);
  }
  if (o.diff && (o.diff.newBurners.length || o.diff.newWinners.length || o.diff.stoppedBurning.length)) {
    lines.push("", "### New since your last report");
    for (const t of o.diff.newBurners.slice(0, 5)) lines.push(`- 🔥 new money-burner "${t.t}": ${t.c} clicks, $${t.s}, 0 orders`);
    for (const t of o.diff.newWinners.slice(0, 5)) lines.push(`- 🌱 new winner "${t.t}": ${t.o} orders, $${t.sa}`);
    if (o.diff.stoppedBurning.length) lines.push(`- ✅ ${o.diff.stoppedBurning.length} old money-burners stopped spending (${o.diff.stoppedBurning.slice(0, 3).map((t) => `"${t.t}"`).join(", ")}${o.diff.stoppedBurning.length > 3 ? "…" : ""})`);
  }
  if (a.findings.length) {
    lines.push("", "### What Rocco found");
    for (const f of a.findings.slice(0, 8)) lines.push(`- ${ICON[f.severity]} **${f.title}**: ${f.detail}${f.line ? ` _Rocco: "${f.line}"_` : ""}`);
  }
  if (a.proposals.length) {
    const shown = o.licensed ? a.proposals : a.proposals.slice(0, FREE_PROPOSALS);
    lines.push("", `### Proposed changes (approval list)${o.runId ? ` · run ${o.runId.slice(0, 8)}` : ""}`);
    lines.push(...shown.map(proposalLine));
    if (!o.licensed && a.proposals.length > shown.length) {
      lines.push(`- ${shown.length ? "…and " : ""}${a.proposals.length - shown.length} fixes worth ~$${Math.round(a.proposals.slice(shown.length).reduce((t, p) => t + p.valueMonthly, 0)).toLocaleString("en-US")}/mo are ready. They unlock with Rocco's 3-day free trial (then $99/year for the whole team).`);
    }
    lines.push("", o.memory
      ? "Ask the seller which codes to approve (e.g. \"N1-N4, B2\"). Then get the change list with export_changes, apply exactly those codes with the seller's Amazon Ads connector (or the seller applies them by hand), and call apply_changes so Rocco tracks them and re-checks results."
      : "Present these as an approval list. For memory (tracking changes and checking results), set up a personal connector with create_workspace.");
  }
  return lines.join("\n");
}

export function statusIcon(s: Action["status"]) {
  return ({ applied: "⏳", worked: "✅", no_effect: "➖", worse: "⚠️", not_enough_data: "⏳", reverted: "↩️" } as const)[s];
}

export function formatActions(list: Action[]): string {
  if (!list.length) return "No changes logged yet. Analyze a report, approve some codes, then call apply_changes.";
  return list.map((a) => `- ${statusIcon(a.status)} \`${a.id.slice(0, 8)}\` ${a.appliedAt.slice(0, 10)} · **${a.code}** [${a.brand}] ${proposalLine(a.proposal).replace(/^- \*\*\w+\*\* /, "")}${a.result ? `\n  → ${a.result.summary}` : `\n  → check after ${a.followUpAt.slice(0, 10)}`}`).join("\n");
}

export function formatBrief(b: Awaited<ReturnType<typeof buildBrief>>): string {
  const L: string[] = ["## Rocco's brief"];
  if (b.season) L.push(`📅 ${b.season}`);
  if (b.totals.applied) L.push(`Since you hired Rocco: ${b.totals.applied} changes logged, ${b.totals.worked} confirmed working${b.saved ? `, ~${$(b.saved)} saved so far` : ""}.`);
  if (b.recentResults.length) {
    L.push("", "### Results since last time");
    for (const a of b.recentResults.slice(0, 8)) L.push(`- ${statusIcon(a.status)} **${a.code}** ${a.result!.summary}`);
  }
  if (b.due.length) {
    L.push("", `### Due for a check (${b.due.length})`);
    L.push(`Changes from ${[...new Set(b.due.map((a) => a.appliedAt.slice(0, 10)))].join(", ")} are ready to judge. Follow rocco_plan("results_check") to pull daily data since then, and Rocco will grade each change.`);
  }
  for (const pb of b.perBrand) {
    L.push("", `### ${pb.brand}${pb.settings.targetAcos ? ` · target ACoS ${Math.round(pb.settings.targetAcos * 100)}%` : ""}`);
    for (const t of pb.trends) L.push(`- ${KIND_NAME[t.kind] ?? t.kind} (${t.latest.createdAt.slice(0, 10)}): ${t.latest.headline}${trend(t.latest, t.previous)}${Number(t.latest.stats.newBurners) > 0 ? ` · 🔥 ${t.latest.stats.newBurners} new money-burning terms` : ""}${Number(t.latest.stats.newWinners) > 0 ? ` · 🌱 ${t.latest.stats.newWinners} new winners` : ""}`);
    if (pb.open.length) {
      L.push(`- **${pb.open.length} proposed changes not applied yet**${pb.openValue ? ` (~${$(pb.openValue)}/mo at stake)` : ""}:`);
      L.push(...[...pb.open].sort((a, b) => b.valueMonthly - a.valueMonthly).slice(0, 5).map((p) => "  " + proposalLine(p)));
    }
    if (pb.hidden) L.push(`- ${pb.hidden} fixes (~$${Math.round(pb.hiddenValue ?? 0).toLocaleString("en-US")}/mo) are ready and unlock with the 3-day free trial (then $99/year).`);
    const todo = pb.stale;
    if (todo.length) L.push(`- Not checked in 7+ days: ${pb.stale.map((k: ReportKind) => REPORT_HELP[k].name).join(", ")}. Say "morning check" and Rocco will pull them (rocco_plan).`);
  }
  if (!b.totals.applied && b.perBrand.every((p) => !p.trends.length)) {
    L.push("", "Nothing to brief yet. Follow rocco_plan(\"morning_check\") to pull the account data, then analyze it.");
  }
  return L.join("\n");
}

function trend(latest: Snapshot, prev: Snapshot | null): string {
  if (!prev) return "";
  const a = Number(latest.stats.leakMonthly), b = Number(prev.stats.leakMonthly);
  if (Number.isFinite(a) && Number.isFinite(b) && b > 0) return ` (leak ${$(b)} → ${$(a)}/mo${a < b ? " 📉 nice" : ""})`;
  const x = Number(latest.stats.acosPct), y = Number(prev.stats.acosPct);
  if (Number.isFinite(x) && Number.isFinite(y)) return ` (ACoS ${y}% → ${x}%)`;
  return "";
}
