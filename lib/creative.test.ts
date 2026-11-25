import { describe, expect, it } from "vitest";
import { cleanConcepts, imageSlotBody, promptProblems } from "./creative";
import { listingImages } from "./listings";
import { parseStatus } from "./higgsfield";
import { actionByType, availableFor, catalogueText, DOE_ACTIONS, itemCount } from "./doe-actions";
import { dryRunText, planFresh, resultText, type ActionPlan } from "./action-agent";

describe("image studio", () => {
  it("blocks what Amazon doesn't allow in images", () => {
    expect(promptProblems("Product on a kitchen counter with an Amazon's Choice badge in the corner")).toMatch(/amazon's choice/i);
    expect(promptProblems("Show the price $19.99 in big letters next to the product on white")).toMatch(/not allow|doesn't allow/);
    expect(promptProblems("Journal open on a wooden desk in morning light, coffee cup, soft shadows")).toBeNull();
  });

  it("cleans the model's plan: listing images are square slots 2–8, bad words stripped", () => {
    const c = cleanConcepts([
      { slot: "1", title: "Hero", why: "Shows it in use", prompt: "The notebook on a desk, best seller ribbon, morning light, clean scandinavian room", negative: "blur", aspect: "16:9" },
      { slot: "x", title: "Too short", why: "", prompt: "tiny", negative: "", aspect: "1:1" },
    ], "listing");
    expect(c).toHaveLength(1);
    expect(c[0].slot).toBe("2");
    expect(c[0].aspect).toBe("1:1");
    expect(c[0].prompt).not.toMatch(/best seller/i);
    expect(c[0].negative).toMatch(/altered product/);
  });

  it("puts an image into Amazon's other_product_image_locator slot", () => {
    const b = imageSlotBody("SKU1", "NOTEBOOK", "US", 3, "https://cdn.example.com/a.png");
    expect(b.type).toBe("AMAZON_LISTINGS_DETAILS_UPDATE");
    const ch = (b.details.changes[0] as { change: { parameterName: string; value: { media_location: string; marketplace_id: string }[] } }).change;
    expect(ch.parameterName).toBe("other_product_image_locator_2");
    expect(ch.value[0]).toEqual({ media_location: "https://cdn.example.com/a.png", marketplace_id: "ATVPDKIKX0DER" });
    expect((imageSlotBody("S", "T", "US", 99, "https://x/y.png").details.changes[0] as { change: { parameterName: string } }).change.parameterName).toBe("other_product_image_locator_7");
  });

  it("reads Higgsfield statuses and finds Amazon image URLs in a listing", () => {
    expect(parseStatus({ status: "completed", request_id: "r1", images: [{ url: "https://cdn.x/1.png" }, { url: "nope" }] })).toEqual({ requestId: "r1", status: "completed", images: ["https://cdn.x/1.png"] });
    expect(parseStatus({ status: "nsfw", request_id: "r2" }).error).toMatch(/safety filter/);
    expect(listingImages({ summaries: [{ mainImage: { link: "https://m.media-amazon.com/images/I/abc.jpg" } }], other: "https://evil.com/x.jpg" })).toEqual(["https://m.media-amazon.com/images/I/abc.jpg"]);
  });
});

describe("actions catalogue", () => {
  it("covers every DataDoe area with a field for each type", () => {
    expect(DOE_ACTIONS.length).toBeGreaterThanOrEqual(100);
    expect(new Set(DOE_ACTIONS.map((a) => a.type)).size).toBe(DOE_ACTIONS.length);
    for (const t of ["AMAZON_ADS_TARGETS_UPDATE", "AMAZON_LISTINGS_PRICING_UPDATE", "AMAZON_APLUS_CONTENT_PUBLISH", "AMAZON_ORDERS_SOLICITATION_FEEDBACK_SEND", "AMAZON_FBA_REMOVAL_ORDERS_ADD", "AMAZON_MCF_ORDERS_ADD"]) expect(actionByType(t), t).toBeTruthy();
    expect(actionByType("AMAZON_ADS_TARGETS_UPDATE")!.key).toBe("targets");
    expect(actionByType("AMAZON_ORDERS_CANCEL")!.risk).toBe("high");
    expect(actionByType("AMAZON_LISTINGS_FIND")!.mode).toBe("R");
  });

  it("keeps vendor-only types away from seller accounts", () => {
    const v = actionByType("AMAZON_VENDOR_PURCHASE_ORDERS_ACKNOWLEDGE")!;
    expect(availableFor(v, "SELLER")).toBe(false);
    expect(catalogueText("SELLER")).not.toMatch(/VENDOR_PURCHASE/);
    expect(itemCount("AMAZON_ADS_TARGETS_UPDATE", { targets: [{}, {}, {}] })).toBe(3);
  });

  it("plan helpers: dry-run text, 30-minute expiry, result text", () => {
    expect(dryRunText({ ok: true, status: "VALIDATED" })).toBe("VALIDATED");
    expect(dryRunText({ ok: false, error: "details.targets: must be an array." })).toMatch(/^NOT VALID/);
    const p = { status: "planned", at: new Date(Date.now() - 31 * 60_000).toISOString() } as ActionPlan;
    expect(planFresh(p)).toBe(false);
    expect(planFresh({ ...p, at: new Date().toISOString() })).toBe(true);
    expect(resultText({ status: "COMPLETED" })).toMatch(/Done/);
    expect(resultText({ status: "FAILED", error: { m: "x" } })).toMatch(/Amazon said no/);
  });
});
