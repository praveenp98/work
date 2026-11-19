import { describe, expect, it } from "vitest";
import { PLAN, PRICE, stateFor } from "./pricing";

describe("quarterly plan (Nov 19): $199 first quarter, then $249/quarter", () => {
  it("is the same for every team, no ladder", () => {
    expect(PLAN).toEqual({ firstCents: 19900, renewCents: 24900, months: 3 });
    expect(stateFor(0, true)).toMatchObject({ priceCents: 19900, renewCents: 24900, nextPriceCents: null });
    expect(stateFor(500, true).priceCents).toBe(19900);
  });
  it("says it the same way everywhere", () => {
    expect(PRICE.line).toBe("$199 for your first 3 months, then $249 every 3 months. Whole team, cancel anytime.");
  });
});
