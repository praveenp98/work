import { isBulkSheet, parseBulkRows } from "./parsers/bulk";
import { isBusinessReport, parseBusinessReport } from "./parsers/business";
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
  protectedCampaigns?: string[];
  goals?: import("./rules/settings").ProductGoal[];
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
}

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
    return { kind, analysis: roastAnalysis(r, report), roast: r, report };
  }
  if (kind === "sp_campaign") {
    const { rows, days } = parseCampaignReport(table);
    return { kind, analysis: analyzeBudgets(rows, days, { targetAcos: target, breakevenAcos: breakeven, goals: s.goals }), campaigns: { rows, days } };
  }
  if (kind === "sp_placement") return { kind, analysis: analyzePlacements(parsePlacementReport(table), { targetAcos: target, breakevenAcos: breakeven }) };
  if (kind === "business_report") return { kind, analysis: analyzeBusiness(parseBusinessReport(table), { adSpend: s.adSpend, adSales: s.adSales }) };
  if (kind === "inventory") return { kind, analysis: analyzeStock(parseInventoryReport(table)) };
  if (kind === "listing_health") return { kind, analysis: analyzeListings(parseListingsReport(table)) };
  return { kind, analysis: analyzeStructure(parseBulkRows(table)) };
}
