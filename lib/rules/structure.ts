import type { BulkRow } from "../parsers/bulk";
import { r2, type Analysis, type Finding, type Proposal } from "./types";

const isNeg = (e: string) => e.includes("negative");
const enabled = (r: BulkRow) => !r.state || r.state === "enabled";

/** Account structure audit from a bulk file: things a good ads manager fixes once and stops bleeding from. */
export function analyzeStructure(rows: BulkRow[]): Analysis {
  const findings: Finding[] = [];
  const proposals: Proposal[] = [];
  let f = 0;

  // 1. Auto campaigns with no negatives at all
  const autos = rows.filter((r) => r.entity === "campaign" && r.targetingType === "auto" && enabled(r));
  for (const c of autos) {
    const negs = rows.filter((r) => r.campaign === c.campaign && isNeg(r.entity));
    if (negs.length === 0) {
      f++;
      findings.push({ severity: "high", title: `Auto campaign "${c.campaign}" has zero negatives`, detail: "Auto campaigns without negatives pay for every loosely related search forever. Run the Ad Roast on its search terms and add the negatives.", line: `"${c.campaign}" has no negatives. That's an open buffet.`, valueMonthly: 0 });
      proposals.push({ code: `F${f}`, kind: "structure", campaign: c.campaign, adGroup: "", target: c.campaign, reason: "Add negatives from the latest search term roast to this auto campaign.", valueMonthly: 0, undo: "Archive the added negatives." });
    }
  }

  // 2. Same keyword + match type enabled in more than one campaign (you bid against yourself)
  const kw = rows.filter((r) => r.entity === "keyword" && enabled(r) && r.keyword);
  const byKey = new Map<string, BulkRow[]>();
  for (const r of kw) {
    const key = `${r.keyword}\u0001${r.matchType}`;
    byKey.set(key, [...(byKey.get(key) ?? []), r]);
  }
  for (const [key, list] of byKey) {
    const camps = [...new Set(list.map((r) => r.campaign))];
    if (camps.length < 2) continue;
    const [text, match] = key.split("\u0001");
    f++;
    findings.push({ severity: "medium", title: `"${text}" (${match}) is in ${camps.length} campaigns`, detail: `${camps.join(", ")}. Your campaigns compete in the same auction and split the data. Keep it in one campaign and pause the others.`, line: `You're bidding against yourself on "${text}". Bold strategy.`, valueMonthly: 0 });
    proposals.push({ code: `F${f}`, kind: "structure", campaign: camps.slice(1).join(", "), adGroup: "", target: text, matchType: match, reason: `Duplicate keyword: keep it in ${camps[0]}, pause it elsewhere.`, valueMonthly: 0, undo: "Re-enable the paused duplicates." });
  }

  // 3. Bid outliers: > 3× the median keyword bid
  const bids = kw.map((r) => r.bid).filter((b) => b > 0).sort((a, b) => a - b);
  const mid = Math.floor(bids.length / 2);
  const median = bids.length === 0 ? 0 : bids.length % 2 ? bids[mid] : (bids[mid - 1] + bids[mid]) / 2;
  for (const r of kw) {
    if (median > 0 && r.bid > median * 3) {
      findings.push({ severity: "medium", title: `"${r.keyword}" bid is $${r.bid.toFixed(2)}`, detail: `${(r.bid / median).toFixed(1)}× your median keyword bid ($${median.toFixed(2)}) in ${r.campaign}. Make sure it's intentional and profitable.`, line: `$${r.bid.toFixed(2)} on "${r.keyword}"? Somebody fell asleep on the bid button.`, valueMonthly: 0 });
    }
  }

  // 4. Big ad groups
  const groups = new Map<string, number>();
  for (const r of kw) groups.set(`${r.campaign} / ${r.adGroup}`, (groups.get(`${r.campaign} / ${r.adGroup}`) ?? 0) + 1);
  for (const [g, n] of groups) if (n > 30) findings.push({ severity: "low", title: `${g} has ${n} keywords`, detail: "Big ad groups make bids and budgets hard to control. Split winners into their own ad groups.", valueMonthly: 0 });

  const campaigns = rows.filter((r) => r.entity === "campaign").length;
  return {
    reportType: "bulk_structure",
    headline: findings.length ? `${findings.length} structure issues across ${campaigns} campaigns.` : `Clean structure across ${campaigns} campaigns. Nice.`,
    findings,
    proposals,
    stats: { campaigns, keywords: kw.length, negatives: rows.filter((r) => isNeg(r.entity)).length, medianBid: r2(median) },
  };
}
