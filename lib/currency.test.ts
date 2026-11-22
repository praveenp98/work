import { describe, expect, it } from "vitest";
import { currencyOf, localize, money, toUsd } from "./currency";

describe("money in the account's currency", () => {
  it("maps marketplaces to currencies", () => {
    expect(currencyOf("IN").symbol).toBe("₹");
    expect(currencyOf("GB").code).toBe("GBP");
    expect(currencyOf("DE").symbol).toBe("€");
    expect(currencyOf(undefined).code).toBe("USD");
  });
  it("formats and localizes engine text", () => {
    expect(money(12400, currencyOf("IN"))).toBe("₹12,400");
    expect(localize("Spent $93 with 0 orders; saves ~$186/mo.", currencyOf("IN"))).toBe("Spent ₹93 with 0 orders; saves ~₹186/mo.");
    expect(localize("Spent $93", currencyOf("US"))).toBe("Spent $93");
  });
  it("compares savings with Rocco's USD price approximately", () => {
    expect(Math.round(toUsd(10000, currencyOf("IN")))).toBe(120);
  });
});
