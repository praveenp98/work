import { describe, expect, it } from "vitest";
import { analyze, detectKind } from "../analyze";
import { jsonToTable } from "../parsers/json";
import { demoMorning } from "../demo";
import { loadFixture } from "../test-utils";

describe("listing health", () => {
  it("detects the All Listings / suppressed report and flags problems", () => {
    const t = loadFixture("listings-health.csv");
    expect(detectKind(t)).toBe("listing_health");
    const out = analyze(t);
    expect(out.analysis.stats).toMatchObject({ listings: 4, problems: 2, suppressed: 1 });
    expect(out.analysis.headline).toMatch(/2 listings not selling: 1 suppressed/);
    expect(out.analysis.findings[0].title).toMatch(/suppressed/);
    expect(out.analysis.findings[0].detail).toMatch(/non-white background/);
  });

  it("doesn't mistake a restock report for a listings report", () => {
    expect(detectKind(loadFixture("restock-inventory.csv"))).toBe("inventory");
  });

  it("reads Amazon connector JSON (Listings Items API shape)", () => {
    const t = jsonToTable([
      { sku: "A-1", asin: "B01", status: "BUYABLE", issues: [] },
      { sku: "A-2", asin: "B02", status: "DISCOVERABLE", issues: [{ severity: "ERROR", message: "Price is missing" }] },
    ]);
    const out = analyze(t!);
    expect(out.kind).toBe("listing_health");
    expect(out.analysis.stats.problems).toBe(1);
    expect(out.analysis.findings[0].detail).toMatch(/Price is missing/);
  });

  it("the demo morning leads with the fire alarm", async () => {
    const d = await demoMorning();
    const lines = d.text.split("\n");
    expect(lines[1]).toMatch(/^🚨 2 listings not selling \(1 suppressed\)/);
  });
});
