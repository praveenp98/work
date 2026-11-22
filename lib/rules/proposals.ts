import { acos, aggregateTargets, aggregateTerms, type TermStats } from "./aggregate";
import { k } from "../parsers/bulk";
import type { ParsedReport } from "../parsers/searchTerm";
import type { RoastResult } from "./roast";
import { r2, type Analysis, type Finding, type Metrics, type Proposal } from "./types";

export function metricsOf(t: Pick<TermStats, "spend" | "sales" | "clicks" | "orders">, days: number): Metrics {
  return {
    spendPerDay: r2(t.spend / days),
    salesPerDay: r2(t.sales / days),
    clicksPerDay: r2(t.clicks / days),
    ordersPerDay: r2(t.orders / days),
    acos: t.sales > 0 ? r2(t.spend / t.sales) : -1,
  };
}

/** Turn a roast's fixes into approvable proposals (N = negative, H = harvest, B = bid), with before-metrics for later result checks. */
export function proposalsFromRoast(r: RoastResult, report: ParsedReport): Proposal[] {
  const terms = aggregateTerms(report.rows);
  const termIdx = new Map(terms.map((t) => [k(t.campaign, t.adGroup, t.searchTerm), t]));
  const termAny = new Map<string, TermStats>();
  for (const t of terms) { const p = termAny.get(t.searchTerm); if (!p || t.sales > p.sales) termAny.set(t.searchTerm, t); }
  const targets = new Map(aggregateTargets(terms).map((t) => [k(t.campaign, t.adGroup, t.targeting, t.matchType), t]));
  const d = report.days;
  const perMonth = (n: number) => r2((n * 30) / d);
  const out: Proposal[] = [];

  r.fixes.negatives.forEach((n, i) => {
    const t = termIdx.get(k(n.campaign, n.adGroup, n.keyword));
    out.push({
      code: `N${i + 1}`, kind: "negative", campaign: n.campaign, adGroup: n.adGroup, target: n.keyword,
      matchType: n.matchType === "NEGATIVE_PRODUCT" ? "negative product" : "negative exact",
      reason: n.reason, valueMonthly: perMonth(n.spend), before: t ? metricsOf(t, d) : undefined,
      ids: t?.ids ? { campaignId: t.ids.campaignId, adGroupId: t.ids.adGroupId } : undefined,
      undo: `Archive the negative "${n.keyword}" in ${n.campaign} / ${n.adGroup}.`,
    });
  });
  r.fixes.harvest.forEach((h, i) => {
    const t = termAny.get(h.keyword);
    out.push({
      code: `H${i + 1}`, kind: "harvest", campaign: "(your exact/manual campaign)", adGroup: "", target: h.keyword,
      matchType: h.matchType === "PRODUCT" ? "product" : "exact", proposed: h.suggestedBid,
      reason: `${h.reason}. Then add it as negative exact in ${h.sourceCampaign} / ${h.sourceAdGroup}.`,
      valueMonthly: 0, before: t ? metricsOf(t, d) : undefined,
      // Source campaign/ad group (where it converts today): the new exact campaign copies its product, and the
      // search becomes negative exact here so the two campaigns don't bid against each other.
      ids: t?.ids?.campaignId && t.ids.adGroupId ? { campaignId: t.ids.campaignId, adGroupId: t.ids.adGroupId } : undefined,
      undo: `Pause the new keyword "${h.keyword}" and remove the negative from ${h.sourceCampaign}.`,
    });
  });
  r.fixes.bids.forEach((b, i) => {
    const t = targets.get(k(b.campaign, b.adGroup, b.targeting, b.matchType));
    const saving = t && b.changePct < 0 ? Math.max(0, t.spend - t.sales * r.settings.targetAcos) : 0;
    out.push({
      code: `B${i + 1}`, kind: "bid", campaign: b.campaign, adGroup: b.adGroup, target: b.targeting, matchType: b.matchType,
      current: b.currentCpc, proposed: b.newBid, reason: `${b.reason} (${b.changePct > 0 ? "+" : ""}${b.changePct}% vs avg CPC)`,
      valueMonthly: perMonth(saving * Math.min(1, Math.abs(b.changePct) / 100 * 2)), before: t ? metricsOf(t, d) : undefined,
      ids: t?.ids, changePct: b.changePct,
      undo: `Set the bid on ${b.targeting} back to its previous value (avg CPC was ${b.currentCpc}).`,
    });
  });
  return out;
}

/** Roast as a generic Analysis (for MCP + memory). */
export function roastAnalysis(r: RoastResult, report: ParsedReport): Analysis {
  const findings: Finding[] = r.leaks.map((l) => ({ severity: l.wasted > 0 ? "high" : "medium", title: l.title, detail: `${l.count} terms${l.wasted ? `, about ${r.currency}${Math.round(l.monthly)}/month` : ""}.`, line: l.line, valueMonthly: l.monthly }));
  if (r.win) findings.push({ severity: "win", title: `Best term: "${r.win.term}"`, detail: `${r.currency}${Math.round(r.win.sales)} at ${Math.round(r.win.acos * 100)}% ACoS.`, valueMonthly: 0 });
  return {
    reportType: "sp_search_term",
    headline: `Grade ${r.grade}. ${r.headline}`,
    findings,
    proposals: proposalsFromRoast(r, report),
    stats: {
      grade: r.grade, days: r.days, currency: r.currency, spend: r.totals.spend, sales: r.totals.sales, acosPct: r2(r.totals.acos * 100),
      leakMonthly: r.leakMonthly, leakYearly: r.leakYearly, projectedAcosPct: r2(r.projectedAcos * 100), leakPct: r2(r.leakPct * 100),
    },
  };
}

export { acos };
