import { describe, expect, it } from "vitest";
import { loadFixture } from "../test-utils";
import { toNumber } from "./normalize";
import { detectReport, parseSearchTermReport } from "./searchTerm";

describe("toNumber", () => {
  it("handles currency, commas, percents and blanks", () => {
    expect(toNumber("$1,349.10")).toBe(1349.1);
    expect(toNumber("17.60%")).toBe(17.6);
    expect(toNumber("₹ 90")).toBe(90);
    expect(toNumber("")).toBe(0);
    expect(toNumber("-")).toBe(0);
    expect(toNumber("1.234,56")).toBe(1234.56);
  });
});

describe("parseSearchTermReport", () => {
  const table = loadFixture("sp-search-term-report.csv");
  it("detects the report by its header row", () => {
    expect(detectReport(table)?.type).toBe("sp_search_term");
    expect(detectReport([["foo", "bar"], ["1", "2"]])).toBeNull();
  });
  it("finds the header even under a title row", () => {
    expect(detectReport([["Sponsored Products Search term report"], ...table])?.headerRow).toBe(1);
  });
  it("parses rows, currency and period", () => {
    const r = parseSearchTermReport(table);
    expect(r.rows).toHaveLength(18);
    expect(r.currency).toBe("$");
    expect(r.days).toBe(30);
    const first = r.rows[0];
    expect(first.searchTerm).toBe("bamboo cutting board");
    expect(first.spend).toBe(237.44);
    expect(first.sales).toBe(1349.1);
    expect(first.orders).toBe(45);
    expect(first.matchType).toBe("-");
  });
  it("throws a friendly error on the wrong file", () => {
    expect(() => parseSearchTermReport([["SKU", "Price"], ["A", "1"]])).toThrow(/search term report/);
  });
});
