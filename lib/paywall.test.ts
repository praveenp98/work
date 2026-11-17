import { afterEach, describe, expect, it, vi } from "vitest";
import { POST as dodoWebhook } from "../app/api/dodo/webhook/route";
import { paywall } from "./paywall";
import { setStoreForTests } from "./store";
import { MemoryStore } from "./store/memory";
import { loadFixture } from "./test-utils";
import { respond } from "./text/handler";
import { buildBrief, createWorkspace, ensureLinkCode, runAnalysis } from "./workspace";

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

async function seeded() {
  const store = new MemoryStore();
  const { ws } = await createWorkspace(store);
  await runAnalysis(store, ws, "main", loadFixture("sp-search-term-report.csv"));
  return { store, ws };
}

describe("paywall timing", () => {
  it("shows 'found money' once there are locked fixes, then stays quiet for 3 days", async () => {
    const { store, ws } = await seeded();
    const b = await buildBrief(store, ws);
    expect(b.perBrand[0].hidden).toBeGreaterThan(0);
    expect(b.perBrand[0].hiddenValue).toBeGreaterThan(0);
    const now = new Date("2026-11-18T09:00:00Z");
    const p = paywall(ws, b, "found", { now });
    expect(p?.text).toMatch(/I found ~\$[\d,]+\/mo\. Your top 3 fixes/);
    expect(paywall(ws, b, "found", { now: new Date("2026-11-20T09:00:00Z") })).toBeNull();
    expect(paywall(ws, b, "found", { now: new Date("2026-11-21T10:00:00Z") })).not.toBeNull();
  });

  it("never shows when licensed or when nothing is locked", async () => {
    const store = new MemoryStore();
    const { ws } = await createWorkspace(store);
    expect(paywall(ws, await buildBrief(store, ws), "found")).toBeNull(); // no data yet
    const s = await seeded();
    s.ws.licensed = true;
    expect(paywall(s.ws, await buildBrief(s.store, s.ws), "found")).toBeNull();
  });

  it("'worked' shows once per win; 'locked' shows every time", async () => {
    const { store, ws } = await seeded();
    const b = await buildBrief(store, ws);
    expect(paywall(ws, b, "worked", { key: "a1", saved: 120 })?.text).toMatch(/That fix worked: ~\$120\/mo saved/);
    expect(paywall(ws, b, "worked", { key: "a1" })).toBeNull();
    expect(paywall(ws, b, "locked")).not.toBeNull();
    expect(paywall(ws, b, "locked")).not.toBeNull();
  });

  it("texts: numbers carry the offer + link once; a locked YES always gets it", async () => {
    vi.stubEnv("DODO_API_KEY", "");
    const { store, ws } = await seeded();
    const code = await ensureLinkCode(store, ws);
    await respond(store, "+14155550111", `link ${code}`);
    const first = await respond(store, "+14155550111", "numbers");
    expect(first.bubbles[1]).toMatch(/I found/);
    expect(first.bubbles[2]).toMatch(/^https:\/\/checkout\.dodopayments\.com\/buy\/.+metadata_ref=/);
    expect((await respond(store, "+14155550111", "numbers")).bubbles).toHaveLength(1);
    const runs = await store.listRuns(ws.id, { limit: 1 });
    const lockedCode = runs[0].proposals[3].code;
    const r = await respond(store, "+14155550111", `yes ${lockedCode}`);
    expect(r.bubbles.join(" ")).toMatch(new RegExp(`🔒 ${lockedCode} is for hired Rocco`));
  });

  it("a verified Dodo payment unlocks the workspace it was bought for", async () => {
    const { store, ws } = await seeded();
    setStoreForTests(store);
    vi.stubEnv("DODO_API_KEY", "k");
    vi.stubGlobal("fetch", vi.fn(async (u: string) => {
      if (String(u).includes("/payments/pay_123")) return new Response(JSON.stringify({ status: "succeeded", metadata: { ref: ws.id }, product_cart: null }));
      return new Response(JSON.stringify({ items: [] }));
    }));
    const res = await dodoWebhook(new Request("https://x/api/dodo/webhook", { method: "POST", body: JSON.stringify({ type: "payment.succeeded", data: { payment_id: "pay_123" } }) }));
    expect(await res.json()).toMatchObject({ unlocked: true });
    expect((await store.getWorkspaceById(ws.id))?.licensed).toBe(true);
  });
});
