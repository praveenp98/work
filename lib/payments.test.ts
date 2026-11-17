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
  it("builds a static payment link with a redirect, or null when not configured", async () => {
    vi.stubEnv("DODO_PRODUCT_PRO", "pdt_abc123");
    const { checkoutUrl } = await import("./payments");
    const u = new URL(checkoutUrl("pro")!);
    expect(u.origin + u.pathname).toBe("https://checkout.dodopayments.com/buy/pdt_abc123");
    expect(u.searchParams.get("redirect_url")).toMatch(/\/thanks\?plan=pro$/);
    expect(checkoutUrl("agency")).toBeNull();
  });
});
