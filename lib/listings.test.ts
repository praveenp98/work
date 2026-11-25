import { describe, expect, it } from "vitest";
import { aplusDocument, aplusProblems, canAplus } from "./aplus";
import { attributeBody, BACKEND_BYTES, checkCopy, isSuppressed, keywordPlan, parseListing, updateBody, verifyIssues } from "./listings";
import { asinDayRows, cogsRows, profitBySku } from "./profit";

const T = (t: string, o: number, sa: number) => ({ t, s: 10, sa, o, c: 20 });

describe("profit per product (DataDoe profit table)", () => {
  it("sums per SKU, flags missing product cost, computes margin and break-even ACoS", () => {
    const p = profitBySku([
      { sku: "J-1", child_asin: "B0J", product_name: "Journal", total_sales: "1000", total_units_sold: "40", total_fees: "300", cogs_total: "200", ad_spend: "150", refund_cost: "-20", profit: "330", cogs_present: "true" },
      { sku: "J-1", child_asin: "B0J", product_name: "Journal", total_sales: "500", total_units_sold: "20", total_fees: "150", cogs_total: "100", ad_spend: "50", refund_cost: "0", profit: "200", cogs_present: "true" },
      { sku: "P-2", child_asin: "B0P", product_name: "Planner", total_sales: "400", total_units_sold: "10", total_fees: "120", cogs_total: "0", ad_spend: "90", profit: "190", cogs_present: "false" },
    ]);
    expect(p[0]).toMatchObject({ sku: "J-1", sales: 1500, units: 60, profit: 530, cogsMissing: false });
    expect(p[0].margin).toBeCloseTo(0.353, 3);
    expect(p[0].breakevenAcos).toBeCloseTo((1500 - 450 - 300) / 1500, 3); // margin before ads
    expect(p[1]).toMatchObject({ sku: "P-2", cogsMissing: true, breakevenAcos: null });
  });

  it("traffic columns repeat on each SKU row of an ASIN: keep one per ASIN and date", () => {
    const d = asinDayRows([{ child_asin: "B0J", date: "2026-11-01", total_sessions: "100" }, { child_asin: "B0J", date: "2026-11-01", total_sessions: "100" }, { child_asin: "B0J", date: "2026-11-02", total_sessions: "40" }], ["total_sessions"]);
    expect(d.map((r) => r.total_sessions)).toEqual([100, 40]);
  });

  it("product cost rows for DataDoe: positive values only, in the store currency", () => {
    expect(cogsRows([{ sku: "J-1", cost: 3.456, shipping: 0.5 }, { sku: "X", cost: 0, shipping: 0 }, { sku: "", cost: 2, shipping: 0 }], "USD", "2026-06-01")).toEqual([
      { sku: "J-1", costCurrency: "USD", fromDate: "2026-06-01", costItemValue: 3.46, costItemShippingValue: 0.5 },
    ]);
  });
});

describe("listings", () => {
  const result = { items: [{ sku: "J-1", asin: "B0J", productType: "NOTEBOOK", content: { title: "Habit Journal for Adults", bullets: ["Daily prompts", "Undated pages"], keywords: "planner diary" }, issues: [{ code: "90220", message: "'material' is required but not supplied.", severity: "ERROR", attributeNames: ["material"] }], summaries: [{ status: ["BUYABLE"] }] }] };

  it("reads Amazon's listing model and spots a hidden listing", () => {
    const l = parseListing(result, "J-1")!;
    expect(l).toMatchObject({ sku: "J-1", asin: "B0J", productType: "NOTEBOOK", title: "Habit Journal for Adults", bullets: ["Daily prompts", "Undated pages"], keywords: "planner diary" });
    expect(l.issues[0]).toMatchObject({ severity: "ERROR", attributes: ["material"] });
    expect(isSuppressed(l)).toBe(true); // not DISCOVERABLE + an error
  });

  it("keyword plan: only words from searches that sold, keeps existing ones, skips protected words, stays under 250 bytes", () => {
    const l = { title: "Habit Journal for Adults", bullets: ["Daily prompts"], keywords: "planner diary" };
    const p = keywordPlan(l, [T("gratitude journal for women", 6, 120), T("self care notebook", 3, 60), T("moleskine journal", 4, 80), T("free journal pdf", 0, 0)], ["moleskine"]);
    expect(p.keywords.startsWith("planner diary")).toBe(true);
    expect(p.added).toEqual(expect.arrayContaining(["gratitude", "women", "self", "care", "notebook"]));
    expect(p.added).not.toContain("moleskine");
    expect(p.added).not.toContain("pdf"); // that search never sold
    expect(new TextEncoder().encode(p.keywords).length).toBeLessThanOrEqual(BACKEND_BYTES);
    const long = keywordPlan({ title: "x", bullets: [], keywords: "a".repeat(240) }, [T("gratitude notebook women", 5, 100)]);
    expect(new TextEncoder().encode(long.keywords).length).toBeLessThanOrEqual(BACKEND_BYTES);
  });

  it("copy checks catch what Amazon rejects", () => {
    expect(checkCopy("title", "Best Seller Journal 50% off")).toMatch(/Promotional/);
    expect(checkCopy("title", "Habit Journal!!!")).toMatch(/special characters/);
    expect(checkCopy("title", "Habit Journal for Adults, Undated, 6x9 in")).toBeNull();
    expect(checkCopy("bullets", ["Money back guarantee"])).toMatch(/guarantees/);
  });

  it("writes the right DataDoe bodies", () => {
    expect(updateBody("J-1", "US", "keywords", "a b")).toEqual({ type: "AMAZON_LISTINGS_UPDATE", details: { changes: [{ sku: "J-1", language_tag: "en_US", genericKeyword: "a b" }] } });
    expect(updateBody("J-1", "UK", "bullets", ["x", "y"]).details).toEqual({ changes: [{ sku: "J-1", language_tag: "en_GB", bulletPoints: ["x", "y"] }] });
    expect(attributeBody("J-1", "NOTEBOOK", "US", "material", "Paper").details).toEqual({ changes: [{ sku: "J-1", productType: "NOTEBOOK", change: { parameterName: "material", operation: "REPLACE", value: [{ value: "Paper", marketplace_id: "ATVPDKIKX0DER", language_tag: "en_US" }] } }] });
  });

  it("Amazon's preview issues: errors and warnings separated", () => {
    const i = verifyIssues({ issues: [{ code: "1", message: "Bad", severity: "ERROR" }, { code: "2", message: "Hmm", severity: "WARNING" }] });
    expect(i.map((x) => x.severity)).toEqual(["ERROR", "WARNING"]);
  });
});

describe("A+ drafts", () => {
  const ok = { headline: "Build habits that stick", intro: ["Thirty seconds a day."], description: "A guided journal.", specs: [{ label: "Pages", value: "120" }, { label: "Size", value: "6 x 9 in" }] };
  it("blocks text Amazon rejects", () => {
    expect(aplusProblems(ok)).toEqual([]);
    expect(aplusProblems({ ...ok, description: "Money-back guarantee, free shipping!" })[0]).toMatch(/guarantees/);
    expect(aplusProblems({ ...ok, intro: ["Rated 5-star by reviews"] })[0]).toMatch(/reviews/);
  });
  it("builds a text-only Standard A+ document", () => {
    const d = aplusDocument(ok, "US", "Rocco B0J");
    expect(d).toMatchObject({ contentType: "EBC", locale: "en-US" });
    expect(d.contentModuleList.map((m) => m.contentModuleType)).toEqual(["STANDARD_TEXT", "STANDARD_PRODUCT_DESCRIPTION", "STANDARD_TECH_SPECS"]);
    expect(canAplus("DE")).toBe(false);
  });
});
