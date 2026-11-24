import { describe, expect, it } from "vitest";
import { acctLabel } from "./health";
import { ADS_COLS, SALES_COLS, mergeDaily, needsBackfill, previousPeriod, rollup, totals } from "./daily";

describe("daily numbers", () => {
  it("rolls export rows into days and sums every field", () => {
    const d = rollup([
      { date: "2026-11-01", total_sales: "$1,200.50", total_units: "30", session: "600", page_views: "900" },
      { date: "2026-11-01", total_sales: "100", total_units: "2", session: "40", page_views: "50" },
      { date: "2026-11-02", total_sales: "800", total_units: "20", session: "500", page_views: "700" },
      { date: "", total_sales: "999" },
    ], SALES_COLS);
    expect(d["2026-11-01"]).toEqual({ s: 1300.5, u: 32, se: 640, pv: 950 });
    expect(Object.keys(d)).toEqual(["2026-11-01", "2026-11-02"]);
  });

  it("merges sales and ads for the same day, newest pull wins, keeps the last N days", () => {
    const a = rollup([{ date: "2026-11-01", total_sales: "100" }], SALES_COLS);
    const b = rollup([{ date: "2026-11-01", ad_spend: "20", ad_sales: "80" }], ADS_COLS);
    expect(mergeDaily(a, b)["2026-11-01"]).toMatchObject({ s: 100, as: 20, asa: 80 });
    expect(mergeDaily({ "2026-11-01": { s: 1 }, "2026-11-02": { s: 2 }, "2026-11-03": { s: 3 } }, {}, 2)).toEqual({ "2026-11-02": { s: 2 }, "2026-11-03": { s: 3 } });
  });

  it("totals and ratios over a range; ratios are null without a denominator", () => {
    const daily = { "2026-11-01": { s: 1000, u: 40, se: 800, as: 100, asa: 400, ac: 200 }, "2026-11-02": { s: 1000, u: 40, se: 800, as: 100, asa: 400, ac: 200 }, "2026-10-31": { s: 5 } };
    const t = totals(daily, "2026-11-01", "2026-11-02");
    expect(t).toMatchObject({ days: 2, sales: 2000, units: 80, sessions: 1600, adSpend: 200, adSales: 800 });
    expect(t.conv).toBeCloseTo(0.05); expect(t.acos).toBeCloseTo(0.25); expect(t.tacos).toBeCloseTo(0.1); expect(t.roas).toBeCloseTo(4); expect(t.cpc).toBeCloseTo(0.5);
    expect(totals({ "2026-11-01": { s: 10 } }, "2026-11-01", "2026-11-01").acos).toBeNull();
  });

  it("previous period has the same length, right before", () => {
    expect(previousPeriod("2026-11-01", "2026-11-30")).toEqual({ from: "2026-10-02", to: "2026-10-31" });
  });

  it("backfills until 60 days are stored", () => {
    expect(needsBackfill(undefined)).toBe(true);
    expect(needsBackfill(Object.fromEntries(Array.from({ length: 60 }, (_, i) => [`d${i}`, {}])))).toBe(false);
  });

  it("account label doesn't repeat the country", () => {
    expect(acctLabel({ name: "Habit Nest US", country: "US" })).toBe("Habit Nest US");
    expect(acctLabel({ name: "The PlugX Method IN", country: "IN" })).toBe("The PlugX Method IN");
    expect(acctLabel({ name: "Bamboo & Co", country: "US" })).toBe("Bamboo & Co · US");
  });
});
