import { describe, expect, it } from "vitest";
import { parseBulk } from "../parsers/bulk";
import { parseSearchTermReport } from "../parsers/searchTerm";
import { loadFixture } from "../test-utils";
import { aggregateTerms } from "./aggregate";
import { bidFor } from "./bids";
import { bulkSheetCsv, fixListCsv } from "./export";
import { findHarvest } from "./harvest";
import { findNegatives, isJunk } from "./negatives";
import { freeView, gradeFor, roast } from "./roast";
import { DEFAULT_SETTINGS as S } from "./settings";

const report = parseSearchTermReport(loadFixture("sp-search-term-report.csv"));
const terms = aggregateTerms(report.rows);

describe("negatives", () => {
  const neg = findNegatives(terms, S);
  const kws = neg.map((n) => n.keyword);
  it("negates zero-order terms over the click threshold", () => {
    expect(kws).toContain("plastic cutting board dishwasher safe");
    expect(kws).toContain("free cutting board");
    expect(kws).toContain("bamboo board used");
  });
  it("skips terms under the threshold and converting terms", () => {
    expect(kws).not.toContain("bamboo board 3 pack"); // 6 clicks
    expect(kws).not.toContain("bamboo cutting board");
  });
  it("does not negate an exact keyword against itself", () => {
    expect(kws).not.toContain("bamboo cutting board set");
  });
  it("uses negative product for ASINs", () => {
    expect(neg.find((n) => n.keyword === "b0c1abcd23")?.matchType).toBe("NEGATIVE_PRODUCT");
  });
  it("states the math: expected orders, confidence, or junk intent", () => {
    const n = neg.find((x) => x.keyword === "plastic cutting board dishwasher safe")!;
    expect(n.reason).toMatch(/64 clicks, 0 orders\. At (your|this ad group's) [\d.]+% conversion rate that's [\d.]+ orders expected \(\d+% sure/);
    expect(n.confidence).toBeGreaterThan(0.85);
    expect(neg.find((x) => x.keyword === "bamboo board used")?.why).toBe("junk_intent");
  });
  it("never auto-negates inside launch / ranking / brand-defense campaigns", () => {
    const launch = terms.map((t) => ({ ...t, campaign: t.campaign.replace("Broad", "Launch") }));
    expect(findNegatives(launch, S).map((x) => x.keyword)).not.toContain("plastic cutting board dishwasher safe");
    expect(findNegatives(terms, S, { protectedCampaigns: ["broad"] }).map((x) => x.keyword)).not.toContain("plastic cutting board dishwasher safe");
  });
  it("waits for low-volume terms instead of cutting on 10 clicks", () => {
    const thin = [{ campaign: "C", adGroup: "A", targeting: "x", matchType: "BROAD", searchTerm: "oak board", impressions: 500, clicks: 11, spend: 9, sales: 0, orders: 0 },
      { campaign: "C", adGroup: "A", targeting: "x", matchType: "BROAD", searchTerm: "board", impressions: 5000, clicks: 400, spend: 300, sales: 1200, orders: 30 }];
    expect(findNegatives(thin, S)).toHaveLength(0); // 11 clicks × 7.5% = 0.8 expected orders: not proof yet
  });
  it("ignores the last days of a daily report (orders still landing)", () => {
    const mature = terms.map((t) => (t.searchTerm === "plastic cutting board dishwasher safe" ? { ...t, clicks: 3 } : t));
    expect(findNegatives(terms, S, { mature, lagDays: 3 }).map((x) => x.keyword)).not.toContain("plastic cutting board dishwasher safe");
  });
  it("flags junk intent", () => {
    expect(isJunk("free cutting board")).toBe(true);
    expect(isJunk("how to clean cutting board")).toBe(true);
    expect(isJunk("freedom board")).toBe(false);
  });
});

describe("harvest", () => {
  const h = findHarvest(terms, S);
  const kws = h.map((x) => x.keyword);
  it("harvests converting terms not yet targeted as exact", () => {
    expect(kws).toContain("charcuterie board large");
    expect(kws).toContain("large bamboo board for kitchen");
    expect(kws).toContain("wood cutting board with handle");
  });
  it("skips terms already targeted as exact and over-target terms", () => {
    expect(kws).not.toContain("bamboo cutting board"); // already exact
    expect(kws).not.toContain("cutting board"); // 52% ACoS
  });
});

describe("bid formula", () => {
  it("is capped at ±20%", () => {
    // ACoS 10% vs target 30% would be +200% → capped at +20%
    expect(bidFor({ spend: 100, sales: 1000, clicks: 100, orders: 50 }, S)).toBe(1.2);
    // ACoS 100% → ratio 0.3 → capped at −20%
    expect(bidFor({ spend: 100, sales: 100, clicks: 100, orders: 5 }, S)).toBe(0.8);
  });
  it("drops zero-order targets by the cap", () => {
    expect(bidFor({ spend: 50, sales: 0, clicks: 40, orders: 0 }, S)).toBe(1);
  });
  it("skips tiny moves and low-data targets", () => {
    expect(bidFor({ spend: 100, sales: 340, clicks: 100, orders: 10 }, S)).toBeNull(); // ~29.4% ACoS
    expect(bidFor({ spend: 5, sales: 0, clicks: 3, orders: 0 }, S)).toBeNull();
  });
});

describe("roast", () => {
  const r = roast(report);
  it("computes leak, grade and headline", () => {
    expect(r.leakTotal).toBeGreaterThan(0);
    expect(r.leakTotal).toBeLessThan(r.totals.spend);
    expect(r.grade).toBe(gradeFor(r.leakPct));
    expect(r.headline).toMatch(/% of your ad spend is leaking/);
    expect(r.leaks[0].wasted).toBeGreaterThanOrEqual(r.leaks[1].wasted);
  });
  it("free view hides fix lists", () => {
    const f = freeView(r);
    expect(f.fixes).toBeUndefined();
    expect(f.leaks.length).toBeLessThanOrEqual(3);
    expect(f.fixCounts.negatives).toBe(r.fixes.negatives.length);
  });
  it("finds nothing to roast in a clean account", () => {
    const clean = roast({ ...report, rows: report.rows.filter((x) => x.orders > 0 && x.spend / x.sales < 0.3) });
    expect(clean.leakTotal).toBe(0);
    expect(clean.grade).toBe("A");
  });
});

describe("exports", () => {
  const r = roast(report);
  it("writes a fix list with a header and one row per fix", () => {
    const lines = fixListCsv(r).split("\n");
    expect(lines[0]).toMatch(/^Action,Campaign/);
    expect(lines.length).toBe(1 + r.fixes.negatives.length + r.fixes.harvest.length + r.fixes.bids.length);
  });
  it("maps names to IDs from the bulk export", () => {
    const idx = parseBulk(loadFixture("sp-bulk-export.csv"));
    const { csv, matched } = bulkSheetCsv(r, idx);
    expect(matched).toBeGreaterThan(0);
    expect(csv).toContain("Negative Keyword,Create,112,212");
    expect(csv).toContain("free cutting board,negativeExact");
    expect(csv).toMatch(/Keyword,Update,113,213,421/);
  });
});

describe("bulk bids use the current bid", () => {
  it("applies the capped ratio to the bid in the bulk file", () => {
    const r = roast(report);
    const idx = parseBulk(loadFixture("sp-bulk-export.csv"));
    const { csv } = bulkSheetCsv(r, idx);
    // charcuterie board exact: bid 1.70, ACoS 58% → −20% → 1.36
    expect(csv).toMatch(/Keyword,Update,113,213,421,,SP - Bamboo Board - Exact,Exact,,1\.36,charcuterie board,exact/);
  });
});

describe("aha numbers", () => {
  const r = roast(report);
  it("projects a lower ACoS after cutting the leak", () => {
    expect(r.projectedAcos).toBeLessThan(r.totals.acos);
    expect(r.projectedAcos).toBeCloseTo((r.totals.spend - r.leakTotal) / r.totals.sales, 1);
  });
  it("lists eaten terms by spend and computes yearly leak", () => {
    expect(r.eaten[0].term).toBe("plastic cutting board dishwasher safe");
    expect(r.leakYearly).toBeCloseTo(r.leakMonthly * 12, 0);
  });
  it("computes payback days", async () => {
    const { paybackDays } = await import("./roast");
    expect(paybackDays(299, 300)).toBe(30);
    expect(paybackDays(299, 0)).toBeNull();
  });
});
