import { afterEach, describe, expect, it, vi } from "vitest";
import { POST as hire } from "../app/api/hire/route";
import { setStoreForTests } from "./store";
import { MemoryStore } from "./store/memory";

afterEach(() => vi.unstubAllEnvs());

const iphone = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const tap = (h: Record<string, string> = {}) => hire(new Request("https://rocco.works/api/hire", { method: "POST", headers: { "user-agent": iphone, origin: "https://rocco.works", "x-rocco-tap": "1", "x-forwarded-for": "7.7.7.7", ...h }, body: "{}" }));

describe("Hire Rocco: pay at signup", () => {
  it("a real tap makes the team's Rocco, remembers it, and sends them to checkout tagged with that team; bots get nothing", async () => {
    vi.stubEnv("ROCCO_VAULT_KEY", "vault");
    vi.stubEnv("DODO_PRODUCT_ID", "pdt_test123");
    const store = new MemoryStore();
    setStoreForTests(store);

    expect((await hire(new Request("https://rocco.works/api/hire", { method: "POST", headers: { "user-agent": "Googlebot/2.1", origin: "https://rocco.works", "x-rocco-tap": "1" } }))).status).toBe(403);

    const r = await tap();
    const d = await r.json();
    expect(d.url).toMatch(/^https:\/\/checkout\.dodopayments\.com\/buy\/pdt_\w+\?.*metadata_ref=/); // pay first, connect after
    const cookie = r.headers.get("set-cookie")!.split(";")[0];
    expect(cookie).toMatch(/^rocco_team=/);

    // Same browser taps again → same team, no duplicate
    const again = await (await tap({ cookie })).json();
    expect(again.url).toBe(d.url);
  });
});
