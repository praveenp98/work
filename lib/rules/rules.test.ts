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
