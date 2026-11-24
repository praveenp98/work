import { afterEach, describe, expect, it, vi } from "vitest";

const mockFetch = (status: number, body: object) =>
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(body), { status })));

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.resetModules(); });

describe("validateLicenseKey (Dodo)", () => {
  it("accepts valid keys and calls the live endpoint", async () => {
    mockFetch(200, { valid: true });
    const { validateLicenseKey } = await import("./payments");
    expect((await validateLicenseKey("ROCCO-ABC")).ok).toBe(true);
    const call = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[0]).toBe("https://live.dodopayments.com/licenses/validate");
    expect(JSON.parse(call[1].body)).toEqual({ license_key: "ROCCO-ABC" });
  });
  it("rejects invalid, expired and unknown keys", async () => {
    const { validateLicenseKey } = await import("./payments");
    mockFetch(200, { valid: false });
    expect((await validateLicenseKey("X")).ok).toBe(false);
    mockFetch(404, { code: "NOT_FOUND" });
    expect((await validateLicenseKey("X")).ok).toBe(false);
  });
  it("rejects empty keys without calling Dodo", async () => {
    const { validateLicenseKey } = await import("./payments");
    expect((await validateLicenseKey("  ")).status).toBe(400);
  });
  it("uses the test endpoint in test mode", async () => {
    vi.stubEnv("DODO_MODE", "test");
    mockFetch(200, { valid: true });
    const { validateLicenseKey } = await import("./payments");
    await validateLicenseKey("K");
    expect((fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0]).toBe("https://test.dodopayments.com/licenses/validate");
  });
});

describe("checkoutUrl", () => {
  it("links to the yearly product with a redirect; no product set = no checkout (never the old $233 product)", async () => {
    const { checkoutUrl } = await import("./payments");
    expect(checkoutUrl()).toBeNull();
    vi.stubEnv("DODO_PRODUCT_ID_ANNUAL", "pdt_year1");
    const u = new URL(checkoutUrl()!);
    expect(u.origin + u.pathname).toBe("https://checkout.dodopayments.com/buy/pdt_year1");
    expect(u.searchParams.get("redirect_url")).toMatch(/\/thanks$/);
  });
  it("is null in test mode without a test product", async () => {
    vi.stubEnv("DODO_MODE", "test");
    const { checkoutUrl } = await import("./payments");
    expect(checkoutUrl()).toBeNull();
  });
});

describe("hire count", () => {
  it("counts unique paying customers and never changes the Dodo price", async () => {
    vi.stubEnv("DODO_API_KEY", "k");
    const pid = "pdt_0Ns7dcv01gDgTlIQC1O1b";
    const payments = { items: [
      ...Array.from({ length: 6 }, (_, i) => ({ status: "succeeded", product_cart: [{ product_id: pid, quantity: 1 }], customer: { customer_id: `c${i}` } })),
      { status: "succeeded", product_cart: [{ product_id: "pdt_other", quantity: 1 }] },
    ] };
    const calls: [string, RequestInit | undefined][] = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
      calls.push([url, init]);
      return new Response(JSON.stringify(url.includes("/payments") ? payments : {}));
    }));
    const { getPriceState } = await import("./payments");
    expect(await getPriceState({ fresh: true })).toMatchObject({ sold: 6, priceCents: 279000, renewCents: 27900, live: true });
    expect(calls.some(([, i]) => i?.method === "PATCH")).toBe(false);
  });
  it("falls back to the plan price without an API key", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}")));
    const { getPriceState } = await import("./payments");
    expect(await getPriceState({ fresh: true })).toMatchObject({ sold: 0, priceCents: 279000, live: false });
  });
});
