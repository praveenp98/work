import { afterEach, describe, expect, it, vi } from "vitest";
import { BENEFIT_HOLIDAY, BENEFIT_LIFETIME, validatePolarKey } from "./polar";

const mockFetch = (status: number, body: object) =>
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(body), { status })));

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

describe("validatePolarKey", () => {
  it("accepts a granted lifetime key", async () => {
    mockFetch(200, { status: "granted", benefit_id: BENEFIT_LIFETIME });
    expect((await validatePolarKey("ROCCO-ABC")).ok).toBe(true);
  });
  it("rejects unknown keys", async () => {
    mockFetch(404, { error: "ResourceNotFound" });
    expect((await validatePolarKey("ROCCO-NOPE")).ok).toBe(false);
  });
  it("rejects revoked keys", async () => {
    mockFetch(200, { status: "revoked", benefit_id: BENEFIT_LIFETIME });
    expect((await validatePolarKey("ROCCO-X")).ok).toBe(false);
  });
  it("accepts Holiday Pass keys until Jan 31, 2027 and rejects after", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    mockFetch(200, { status: "granted", benefit_id: BENEFIT_HOLIDAY });
    vi.setSystemTime(new Date("2027-01-31T20:00:00Z"));
    expect((await validatePolarKey("ROCCOHP-A")).ok).toBe(true);
    vi.setSystemTime(new Date("2027-02-02T00:00:00Z"));
    expect((await validatePolarKey("ROCCOHP-A")).error).toMatch(/Holiday Pass ended/);
  });
  it("rejects empty keys without calling Polar", async () => {
    expect((await validatePolarKey("  ")).status).toBe(400);
  });
});
