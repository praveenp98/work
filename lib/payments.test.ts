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
  it("links to the single live product with a redirect", async () => {
    const { checkoutUrl } = await import("./payments");
    const u = new URL(checkoutUrl()!);
    expect(u.origin + u.pathname).toBe("https://checkout.dodopayments.com/buy/pdt_0Ns7dcv01gDgTlIQC1O1b");
    expect(u.searchParams.get("redirect_url")).toMatch(/\/thanks$/);
  });
  it("is null in test mode without a test product", async () => {
    vi.stubEnv("DODO_MODE", "test");
    const { checkoutUrl } = await import("./payments");
    expect(checkoutUrl()).toBeNull();
  });
});

describe("price ladder sync", () => {
  it("counts succeeded payments for the product and patches the price", async () => {
    vi.stubEnv("DODO_API_KEY", "k");
    const pid = "pdt_0Ns7dcv01gDgTlIQC1O1b";
    const payments = { items: [
      ...Array.from({ length: 6 }, () => ({ status: "succeeded", product_cart: [{ product_id: pid, quantity: 1 }] })),
      { status: "succeeded", product_cart: [{ product_id: "pdt_other", quantity: 1 }] },
    ] };
    const calls: [string, RequestInit | undefined][] = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
      calls.push([url, init]);
      if (url.includes("/payments")) return new Response(JSON.stringify(payments));
      if (init?.method === "PATCH") return new Response("", { status: 200 });
      return new Response(JSON.stringify({ price: { price: 9900 } }));
    }));
    const { getPriceState } = await import("./payments");
    const s = await getPriceState({ fresh: true });
    expect(s).toMatchObject({ sold: 6, priceCents: 15900, salesUntilNext: 1, live: true });
    const patch = calls.find(([, i]) => i?.method === "PATCH")!;
    expect(JSON.parse(String(patch[1]!.body)).price.price).toBe(15900);
  });
  it("falls back to the start price without an API key", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}")));
    const { getPriceState } = await import("./payments");
    expect(await getPriceState({ fresh: true })).toMatchObject({ sold: 0, priceCents: 9900, live: false });
  });
});
