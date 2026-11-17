import { describe, expect, it } from "vitest";
import { analyze } from "../analyze";
import { loadFixture } from "../test-utils";
import { accountScore } from "./score";

describe("accountScore", () => {
  it("combines every report into one score and money at stake", () => {
    const all = ["sp-search-term-report.csv", "sp-campaign-report.csv", "sp-placement-report.csv", "business-report.csv", "restock-inventory.csv", "sp-bulk-structure.csv"].map((f) => analyze(loadFixture(f)).analysis);
    const s = accountScore(all);
    expect(s.score).toBeLessThan(60);
    expect(s.atStakeMonthly).toBeGreaterThan(1000);
    expect(s.proposals[0].valueMonthly).toBeGreaterThanOrEqual(s.proposals[1].valueMonthly);
  });
  it("is 100 when there is nothing to fix", () => {
    expect(accountScore([{ reportType: "x", headline: "", findings: [], proposals: [], stats: {} }]).score).toBe(100);
  });
});

describe("placement analyzer", () => {
  it("raises profitable placements and zeroes losing ones", () => {
    const a = analyze(loadFixture("sp-placement-report.csv"), { targetAcos: 0.3, breakevenAcos: 0.45 });
    expect(a.kind).toBe("sp_placement");
    const p = a.analysis.proposals;
    expect(p.find((x) => x.campaign === "SP - Bamboo Board - Exact" && x.target === "Top of search")?.proposed).toBe(30);
    expect(p.find((x) => x.campaign === "SP - Bamboo Board - Broad" && x.target === "Product pages")?.proposed).toBe(0);
    expect(p.some((x) => x.target === "Other")).toBe(false);
  });
});
