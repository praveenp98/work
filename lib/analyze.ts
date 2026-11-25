import { isBulkSheet, parseBulkRows } from "./parsers/bulk";
import { isBusinessReport, parseBusinessReport, type BusinessRow } from "./parsers/business";
import { isCampaignReport, parseCampaignReport, type CampaignRow } from "./parsers/campaign";
import { isInventoryReport, parseInventoryReport } from "./parsers/inventory";
import { isPlacementReport, parsePlacementReport } from "./parsers/placement";
import { analyzePlacements } from "./rules/placement";
import { detectReport, parseSearchTermReport, type ParsedReport } from "./parsers/searchTerm";
import { analyzeBudgets } from "./rules/budget";
import { analyzeBusiness } from "./rules/business";
import { roastAnalysis } from "./rules/proposals";
import { roast, type RoastResult } from "./rules/roast";
import { DEFAULT_SETTINGS } from "./rules/settings";
import { analyzeStock } from "./rules/stock";
import { analyzeStructure } from "./rules/structure";
import { isListingsReport, parseListingsReport } from "./parsers/listings";
import { analyzeListings } from "./rules/listings";
import type { Analysis } from "./rules/types";

export type ReportKind = "sp_search_term" | "sp_campaign" | "sp_placement" | "business_report" | "inventory" | "listing_health" | "bulk";

export const REPORT_HELP: Record<ReportKind, { name: string; where: string }> = {
  sp_search_term: { name: "Sponsored Products search term report", where: "Amazon Ads → Measurement & Reporting → Sponsored ads reports → Sponsored Products → Search term → Summary, last 30–60 days" },
  sp_campaign: { name: "Sponsored Products campaign report", where: "Amazon Ads → Sponsored ads reports → Sponsored Products → Campaign → Summary, last 30 days" },
  sp_placement: { name: "Sponsored Products placement report", where: "Amazon Ads → Sponsored ads reports → Sponsored Products → Placement (or Campaign → by placement) → Summary, last 30 days" },
  business_report: { name: "Business Report (by child item)", where: "Seller Central → Reports → Business Reports → Detail Page Sales and Traffic by Child Item, last 30 days → Download (.csv)" },
  inventory: { name: "Restock Inventory report", where: "Seller Central → Inventory → FBA Inventory → Restock Inventory → Download" },
  listing_health: { name: "Listings report (suppressed / inactive)", where: "Seller Central → Inventory → Inventory Reports → All Listings report, or Inventory → Fix your products → Suppressed listings → Download" },
  bulk: { name: "Sponsored Products bulk file", where: "Amazon Ads → Bulk operations → Create spreadsheet → Sponsored Products, last 30 days" },
};

export function detectKind(table: unknown[][]): ReportKind | null {
  if (table.slice(0, 5).some((r) => isBulkSheet(r ?? []))) return "bulk";
  if (detectReport(table)) return "sp_search_term";
  if (isBusinessReport(table)) return "business_report";
  if (isInventoryReport(table)) return "inventory";
  if (isListingsReport(table)) return "listing_health";
  if (isPlacementReport(table)) return "sp_placement";
  if (isCampaignReport(table)) return "sp_campaign";
  return null;
}

export interface AnalyzeSettings {
  targetAcos?: number;
  breakevenAcos?: number;
  minClicks?: number;
  protectedTerms?: string[];
  /** Brand names (account brand, listing brands). Never negated; bids on them are never lowered unless allowBrandCuts. */
  brandTerms?: string[];
  allowBrandCuts?: boolean;
  protectedCampaigns?: string[];
  goals?: import("./rules/settings").ProductGoal[];
  monthlyAdBudget?: number;
  /** For TACoS on business reports. */
  adSpend?: number;
  adSales?: number;
}

export interface AnalyzeOutput {
  kind: ReportKind;
  analysis: Analysis;
  /** Present for search term reports: full roast + parsed rows (used for result checks). */
  roast?: RoastResult;
  report?: ParsedReport;
  /** Present for campaign reports (used for budget result checks). */
  campaigns?: { rows: CampaignRow[]; days: number };
  /** Present for business reports: one row per child ASIN. */
  business?: BusinessRow[];
}

/** "Habit Nest US" → ["habit nest", "habitnest"]: brand phrases without the marketplace suffix. */
export function brandPhrases(names: string[]): string[] {
  const out = new Set<string>();
  for (const n of names) {
    const p = n.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\b(us|usa|uk|ca|de|fr|it|es|mx|jp|au|in|ae|sa|nl|se|pl|be|br|sg|tr|eg|ie)\b\s*$/, "").replace(/\s+/g, " ").trim();
    if (p.length < 3) continue;
    out.add(p);
    if (p.includes(" ")) out.add(p.replace(/ /g, ""));
  }
  return [...out];
}
export const isBrandText = (text: string, brands: string[]) => { const t = ` ${text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ")} `; return brands.some((b) => t.includes(` ${b} `) || t.includes(` ${b}`)); };

export function analyze(table: unknown[][], s: AnalyzeSettings = {}): AnalyzeOutput {
  const kind = detectKind(table);
  if (!kind) {
    throw new Error(
      "Rocco couldn't recognize this report. He reads: " + Object.values(REPORT_HELP).map((h) => h.name).join(", ") + ".",
    );
  }
  const target = s.targetAcos ?? DEFAULT_SETTINGS.targetAcos;
  const breakeven = s.breakevenAcos ?? target * 1.5;
  if (kind === "sp_search_term") {
    const report = parseSearchTermReport(table);
    const protectedSet = new Set((s.protectedTerms ?? []).map((t) => t.toLowerCase().trim()).filter(Boolean));
    const r = roast(report, { targetAcos: target, breakevenAcos: breakeven, ...(s.minClicks ? { minClicksNegative: s.minClicks } : {}), ...(s.protectedCampaigns?.length ? { protectedCampaigns: s.protectedCampaigns } : {}), ...(s.goals?.length ? { goals: s.goals } : {}) });
    if (protectedSet.size) {
      const hit = (term: string) => [...protectedSet].some((p) => term.includes(p));
      r.fixes.negatives = r.fixes.negatives.filter((n) => !hit(n.keyword));
    }
    const brands = brandPhrases(s.brandTerms ?? []);
    if (brands.length) {
      const isBrand = (text: string) => isBrandText(text, brands);
      r.fixes.negatives = r.fixes.negatives.filter((n) => !isBrand(n.keyword));
      if (!s.allowBrandCuts) r.fixes.bids = r.fixes.bids.filter((b) => b.changePct > 0 || !isBrand(b.targeting));
    }
    return { kind, analysis: roastAnalysis(r, report), roast: r, report };
  }
  if (kind === "sp_campaign") {
    const { rows, days } = parseCampaignReport(table);
    return { kind, analysis: analyzeBudgets(rows, days, { targetAcos: target, breakevenAcos: breakeven, goals: s.goals, monthlyAdBudget: s.monthlyAdBudget }), campaigns: { rows, days } };
  }
  if (kind === "sp_placement") return { kind, analysis: analyzePlacements(parsePlacementReport(table), { targetAcos: target, breakevenAcos: breakeven }) };
  if (kind === "business_report") { const rows = parseBusinessReport(table); return { kind, analysis: analyzeBusiness(rows, { adSpend: s.adSpend, adSales: s.adSales }), business: rows }; }
  if (kind === "inventory") return { kind, analysis: analyzeStock(parseInventoryReport(table)) };
  if (kind === "listing_health") return { kind, analysis: analyzeListings(parseListingsReport(table)) };
  return { kind, analysis: analyzeStructure(parseBulkRows(table)) };
}
