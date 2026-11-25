import { describe, expect, it } from "vitest";
import { analyzeLook } from "./first-look";

const R = (sku: string, o: Record<string, unknown> = {}) => ({ sku, item_name: `Journal ${sku}`, listing_status: "Active", listing_fulfillment_channel: "AMAZON_NA", fba_quantity_available: "10", fba_quantity_inbound: "0", fba_has_stranded_inventory: "false", generic_keyword: "workout log", bullet_point_1: "a", bullet_point_2: "b", bullet_point_3: "c", cogs_present: "true", ...o });

describe("instant first look", () => {
  it("finds out-of-stock, stranded, inactive, missing keywords and costs, with real counts", () => {
    const l = analyzeLook([
      R("A", { fba_quantity_available: "0" }), R("B", { fba_quantity_available: "0", fba_quantity_inbound: "50" }),
      R("C", { fba_has_stranded_inventory: "true" }), R("D", { listing_status: "Inactive" }),
      R("E", { generic_keyword: "" }), R("F", { cogs_present: "false", bullet_point_3: "" }),
      R("G", { listing_fulfillment_channel: "DEFAULT", fba_quantity_available: "0" }),
    ]);
    const t = Object.fromEntries(l.findings.map((f) => [f.id, f.title]));
    expect(t.oos).toBe("1 SKU out of stock at Amazon, nothing on the way"); // B has inbound, G ships itself
    expect(t.stranded).toMatch(/^1 SKU with stranded/);
    expect(t.inactive).toMatch(/^1 SKU inactive/);
    expect(t.kw).toMatch(/^1 SKU with no backend/);
    expect(t.bullets).toMatch(/^1 SKU with fewer than 3/);
    expect(t.cogs).toMatch(/^1 SKU with no product cost/);
    expect(l.findings[0].severity).toBe("high");
    expect(l.skus).toBe(7);
  });
  it("adds Amazon's own listing errors", () => {
    const l = analyzeLook([R("A")], [{ sku: "A", title: "Journal A", bullets: [], keywords: "", issues: [{ code: "1", message: "Missing image", severity: "ERROR", attributes: [] }], status: [] }]);
    expect(l.findings[0]).toMatchObject({ id: "issues", detail: "Missing image" });
  });
});
