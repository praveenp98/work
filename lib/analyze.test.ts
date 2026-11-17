import { describe, expect, it } from "vitest";
import { analyze, detectKind } from "./analyze";
import { loadFixture } from "./test-utils";

describe("detectKind", () => {
  it("recognizes every supported report", () => {
    expect(detectKind(loadFixture("sp-search-term-report.csv"))).toBe("sp_search_term");
    expect(detectKind(loadFixture("sp-campaign-report.csv"))).toBe("sp_campaign");
    expect(detectKind(loadFixture("business-report.csv"))).toBe("business_report");
    expect(detectKind(loadFixture("restock-inventory.csv"))).toBe("inventory");
    expect(detectKind(loadFixture("sp-bulk-structure.csv"))).toBe("bulk");
    expect(detectKind(loadFixture("sp-bulk-export.csv"))).toBe("bulk");
    expect(detectKind([["foo", "bar"], ["1", "2"]])).toBeNull();
  });
  it("throws a helpful error for unknown files", () => {
    expect(() => analyze([["foo"], ["1"]])).toThrow(/Business Report/);
  });
});

describe("search term → proposals", () => {
  const out = analyze(loadFixture("sp-search-term-report.csv"));
  it("codes proposals N/H/B with before metrics", () => {
    const codes = out.analysis.proposals.map((p) => p.code);
    expect(codes).toContain("N1");
    expect(codes).toContain("H1");
    expect(codes).toContain("B1");
    const n1 = out.analysis.proposals.find((p) => p.code === "N1")!;
    expect(n1.before?.spendPerDay).toBeGreaterThan(0);
    expect(n1.undo).toMatch(/Archive/);
  });
  it("never negates protected brand terms", () => {
    const p = analyze(loadFixture("sp-search-term-report.csv"), { protectedTerms: ["plastic"] });
    expect(p.analysis.proposals.some((x) => x.target.includes("plastic"))).toBe(false);
  });
});

describe("business report", () => {
  const out = analyze(loadFixture("business-report.csv"), { adSpend: 1459, adSales: 5307 });
  it("flags traffic-but-no-conversion and buy box", () => {
    const titles = out.analysis.findings.map((f) => f.title).join(" | ");
    expect(titles).toMatch(/B0BAMBOO02 gets traffic but doesn't convert/);
    expect(titles).toMatch(/B0CHARC001 only wins the buy box 72%/);
    expect(titles).not.toMatch(/B0BAMBOO01 gets traffic/);
  });
  it("computes TACoS", () => {
    expect(out.analysis.stats.tacosPct).toBeCloseTo((1459 / 24752.36) * 100, 1);
  });
});

describe("inventory", () => {
  const out = analyze(loadFixture("restock-inventory.csv"));
  it("flags stockout risk, overstock and dead stock", () => {
    const t = out.analysis.findings.map((f) => f.title).join(" | ");
    expect(t).toMatch(/Bamboo Cutting Board Large: ~14 days/);
    expect(t).toMatch(/Set of 3: 420 days/);
    expect(t).toMatch(/Mini Serving Board: no sales/);
    expect(out.analysis.proposals[0].code).toBe("S1");
    expect(out.analysis.proposals[0].target).toBe("BB-LG");
  });
});

describe("campaign budgets", () => {
  const out = analyze(loadFixture("sp-campaign-report.csv"), { targetAcos: 0.3, breakevenAcos: 0.45 });
  it("raises capped winners and cuts losers", () => {
    const p = out.analysis.proposals;
    const exact = p.find((x) => x.campaign === "SP - Bamboo Board - Exact")!;
    expect(exact.proposed).toBe(15);
    const broad = p.find((x) => x.campaign === "SP - Bamboo Board - Broad")!;
    expect(broad.proposed!).toBeLessThan(broad.current!);
    expect(p.some((x) => x.campaign === "SP - Bamboo Board - Phrase")).toBe(false);
  });
});

describe("structure audit", () => {
  const out = analyze(loadFixture("sp-bulk-structure.csv"));
  const t = out.analysis.findings.map((f) => f.title).join(" | ");
  it("finds auto without negatives, duplicates and bid outliers", () => {
    expect(t).toMatch(/Auto campaign "SP - Auto" has zero negatives/);
    expect(t).not.toMatch(/"SP - Auto 2" has zero/);
    expect(t).toMatch(/"bamboo cutting board" \(exact\) is in 2 campaigns/);
    expect(t).toMatch(/"charcuterie board" bid is \$6.50/);
  });
});
