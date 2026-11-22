import { afterEach, describe, expect, it, vi } from "vitest";
import { POST as dodoWebhook } from "../app/api/dodo/webhook/route";
import { accessOf } from "./access";
import { countSales } from "./payments";
import { paywall } from "./paywall";
import { setStoreForTests } from "./store";
import { MemoryStore } from "./store/memory";
import { grantTrial, loadFixture } from "./test-utils";
import { respond } from "./text/handler";
import { buildBrief, createWorkspace, ensureLinkCode, runAnalysis } from "./workspace";

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

async function seeded() {
  const store = new MemoryStore();
  const { ws } = await createWorkspace(store);
  await runAnalysis(store, ws, "main", loadFixture("sp-search-term-report.csv"));
  return { store, ws };
}

describe("pay at signup: no free fixes, then the offer at the right moments", () => {
  it("without a plan no fix shows, the rest is locked and 'found' pitches hiring, at most every 3 days", async () => {
    const { store, ws } = await seeded();
    const b = await buildBrief(store, ws);
    expect(b.perBrand[0].open).toHaveLength(0);
    expect(b.perBrand[0].hidden).toBeGreaterThan(0);
    const now = new Date("2026-11-18T09:00:00Z");
    expect(paywall(ws, b, "found", { now })?.text).toMatch(/I found ~\$[\d,]+\/mo across \d+ fixes in your account\. Hire me: \$1,190 a year \(2 months free\), or \$119 a month\. 7-day money-back guarantee/);
    expect(paywall(ws, b, "found", { now: new Date("2026-11-20T09:00:00Z") })).toBeNull();
    expect(paywall(ws, b, "found", { now: new Date("2026-11-21T10:00:00Z") })).not.toBeNull();
  });

  it("nothing to sell to people on a trial or a paid plan", async () => {
    const s = await seeded();
    await grantTrial(s.store, s.ws.id);
    const ws = (await s.store.getWorkspaceById(s.ws.id))!;
    expect(accessOf(ws)).toBe("trial");
    expect(paywall(ws, await buildBrief(s.store, ws), "found")).toBeNull();
    expect((await buildBrief(s.store, ws)).perBrand[0].hidden).toBe(0);
  });

  it("texts without a plan: numbers, brief and YES all get the teaser + hire link (checkout tagged with the team)", async () => {
    vi.stubEnv("DODO_API_KEY", "");
    vi.stubEnv("DODO_PRODUCT_ID_ANNUAL", "pdt_year1");
    const { store, ws } = await seeded();
    const code = await ensureLinkCode(store, ws);
    await respond(store, "+14155550111", `link ${code}`);
    for (const t of ["numbers", "brief", "yes N1"]) {
      const r = await respond(store, "+14155550111", t);
      expect(r.bubbles[0]).toMatch(/I found ~\$[\d,]+\/mo across \d+ fixes.*Hire me/);
      expect(r.bubbles[1]).toMatch(/^https:\/\/checkout\.dodopayments\.com\/buy\/.+metadata_ref=/);
    }
    expect((await respond(store, "+14155550111", "help")).bubbles[0]).toMatch(/numbers → today's numbers/); // help still works
  });
});

describe("billing: Dodo subscription → trial, paid, ended", () => {
  function dodo(sub: Record<string, unknown> | null, pay: Record<string, unknown> | null) {
    vi.stubEnv("DODO_API_KEY", "k");
    vi.stubEnv("DODO_PRODUCT_ID_ANNUAL", "pdt_year1");
    if (sub && !sub.product_id) sub = { ...sub, product_id: "pdt_year1" };
    if (pay && !pay.product_cart) pay = { ...pay, product_cart: [{ product_id: "pdt_year1" }] };
    vi.stubGlobal("fetch", vi.fn(async (u: string) => {
      if (sub && String(u).includes("/subscriptions/sub_123456")) return Response.json(sub);
      if (pay && String(u).includes("/payments/pay_123456")) return Response.json(pay);
      return Response.json({ items: [] });
    }));
  }
  const hook = (data: object) => dodoWebhook(new Request("https://x/api/dodo/webhook", { method: "POST", body: JSON.stringify({ type: "subscription.active", data }) }));

  it("an active subscription alone unlocks nothing; a succeeded payment → paid; failed → access ends", async () => {
    const { store, ws } = await seeded();
    setStoreForTests(store);
    const nextYear = new Date(Date.now() + 365 * 86_400_000).toISOString();
    dodo({ subscription_id: "sub_123456", status: "pending", next_billing_date: nextYear, metadata: { ref: ws.id } }, null);
    expect(await (await hook({ subscription_id: "sub_123456" })).json()).toMatchObject({ change: null });
    expect(accessOf((await store.getWorkspaceById(ws.id))!)).toBe("none");

    dodo({ subscription_id: "sub_123456", status: "active", next_billing_date: nextYear, metadata: { ref: ws.id } }, { status: "succeeded", created_at: new Date().toISOString(), subscription_id: "sub_123456", metadata: { ref: ws.id } });
    expect(await (await hook({ payment_id: "pay_123456" })).json()).toMatchObject({ change: "paid" });
    let w = (await store.getWorkspaceById(ws.id))!;
    expect(accessOf(w)).toBe("paid");
    expect(w.paidUntil?.slice(0, 10)).toBe(nextYear.slice(0, 10));

    dodo({ subscription_id: "sub_123456", status: "failed", metadata: { ref: ws.id } }, null);
    expect(await (await hook({ subscription_id: "sub_123456" })).json()).toMatchObject({ change: "ended" });
    expect(accessOf((await store.getWorkspaceById(ws.id))!)).toBe("none");
    w = (await store.getWorkspaceById(ws.id))!;
    expect(w.subStatus).toBe("failed");
  });

  it("a refunded payment ends access, and replaying its old webhook can't switch it back on", async () => {
    const { store, ws } = await seeded();
    setStoreForTests(store);
    const pay = { status: "succeeded", created_at: new Date().toISOString(), metadata: { ref: ws.id } };
    dodo(null, pay);
    expect(await (await hook({ payment_id: "pay_123456" })).json()).toMatchObject({ change: "paid" });
    dodo(null, { ...pay, refunds: [{ status: "succeeded" }] });
    expect(await (await hook({ payment_id: "pay_123456" })).json()).toMatchObject({ change: "ended" });
    expect(await (await hook({ payment_id: "pay_123456" })).json()).toMatchObject({ change: "ended" });
    expect(accessOf((await store.getWorkspaceById(ws.id))!)).toBe("none");
  });

  it("an old payment can't buy a new year (period counts from the payment date)", async () => {
    const { store, ws } = await seeded();
    setStoreForTests(store);
    dodo(null, { status: "succeeded", created_at: new Date(Date.now() - 400 * 86_400_000).toISOString(), metadata: { ref: ws.id } });
    await hook({ payment_id: "pay_123456" });
    expect(accessOf((await store.getWorkspaceById(ws.id))!)).toBe("none");
  });

  it("another product on the same Dodo account never unlocks Rocco", async () => {
    const { store, ws } = await seeded();
    setStoreForTests(store);
    dodo(null, { status: "succeeded", created_at: new Date().toISOString(), metadata: { ref: ws.id }, product_cart: [{ product_id: "pdt_something_else" }] });
    await hook({ payment_id: "pay_123456" });
    expect(accessOf((await store.getWorkspaceById(ws.id))!)).toBe("none");
  });

  it("ignores events it can't verify with Dodo", async () => {
    const { store, ws } = await seeded();
    setStoreForTests(store);
    dodo(null, null);
    expect(await (await hook({ subscription_id: "sub_123456" })).json()).toMatchObject({ change: null });
    expect(accessOf((await store.getWorkspaceById(ws.id))!)).toBe("none");
  });

  it("the ladder counts unique paying customers only (trials and renewals don't move it)", async () => {
    vi.stubEnv("DODO_API_KEY", "k");
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ items: [
      { status: "succeeded", subscription_id: "s1", customer: { customer_id: "c1" } },
      { status: "succeeded", subscription_id: "s1", customer: { customer_id: "c1" } }, // renewal
      { status: "succeeded", subscription_id: "s2", customer: { customer_id: "c2" } },
    ] })));
    expect(await countSales()).toBe(2);
  });
});
