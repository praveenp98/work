import { afterEach, describe, expect, it, vi } from "vitest";
import { fmtLocal, localPrices, priceMatches } from "./ppp";

afterEach(() => vi.unstubAllEnvs());

describe("local prices (Dodo PPP mirror)", () => {
  it("reads LOCAL_PRICES and ignores bad entries", () => {
    vi.stubEnv("LOCAL_PRICES", JSON.stringify({ IN: { currency: "INR", symbol: "₹", annual: 39900, monthly: 3990 }, XX: { currency: "X" }, us: { currency: "USD", annual: 1, monthly: 1 } }));
    expect(Object.keys(localPrices())).toEqual(["IN"]);
    expect(fmtLocal(39900, localPrices().IN)).toBe("₹39,900");
  });
  it("survives a broken env var", () => {
    vi.stubEnv("LOCAL_PRICES", "{not json");
    expect(localPrices()).toEqual({});
  });
  it("flags a charge that doesn't match the shown price (2% tolerance)", () => {
    vi.stubEnv("LOCAL_PRICES", JSON.stringify({ IN: { currency: "INR", symbol: "₹", annual: 39900, monthly: 3990 } }));
    expect(priceMatches("INR", 39900, "annual")).toBe(true);
    expect(priceMatches("INR", 40500, "annual")).toBe(true);
    expect(priceMatches("INR", 49900, "annual")).toBe(false);
    expect(priceMatches("USD", 1190, "annual")).toBeNull();
    expect(priceMatches("BRL", 2990, "annual")).toBeNull();
  });
});
