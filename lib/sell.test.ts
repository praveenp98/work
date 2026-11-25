import { describe, expect, it } from "vitest";
import { guideProblems, SELL_ORDER, wordCount } from "./sell";
import { SELL } from "./sell-data";

const MARKET_SECTIONS = ["state", "new", "fit", "account", "costs", "tax", "compliance", "product", "fulfil", "launch", "ads", "grow", "mistakes", "checklist"];

describe("beginner marketplace guides", () => {
  it("has the hub and every marketplace", () => {
    expect(SELL.map((g) => g.slug).sort()).toEqual(["index", ...SELL_ORDER].sort());
  });
  for (const g of SELL) {
    it(`${g.slug}: complete, sourced, deep`, () => {
      expect(guideProblems(g)).toEqual([]);
      if (g.slug !== "index") expect(g.sections.map((s) => s.id)).toEqual(MARKET_SECTIONS);
      expect(g.sources.length).toBeGreaterThanOrEqual(15);
      expect(g.faq.length).toBeGreaterThanOrEqual(8);
      expect(wordCount(g)).toBeGreaterThan(3000);
      expect(g.description.length).toBeLessThanOrEqual(170);
    });
  }
});
