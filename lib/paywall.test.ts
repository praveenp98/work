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
    expect(paywall(ws, b, "found", { now })?.text).toMatch(/I found ~\$[\d,]+\/mo across \d+ fixes in your account\. Hire me: \$1,190 a year \(2 months free\), or \$119 a month\. 30-day money-back guarantee/);
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
    vi.stubGlobal("fetch", vi.fn(async (u: string) => {
      if (sub && String(u).includes("/subscriptions/sub_123456")) return Response.json(sub);
      if (pay && String(u).includes("/payments/pay_123456")) return Response.json(pay);
      return Response.json({ items: [] });
    }));
  }
  const hook = (data: object) => dodoWebhook(new Request("https://x/api/dodo/webhook", { method: "POST", body: JSON.stringify({ type: "subscription.active", data }) }));

  it("card trial starts → 3 days of access; payment → paid for a year; failed → access ends", async () => {
    const { store, ws } = await seeded();
    setStoreForTests(store);
    const in3 = new Date(Date.now() + 3 * 86_400_000).toISOString();
    dodo({ subscription_id: "sub_123456", status: "active", next_billing_date: in3, metadata: { ref: ws.id } }, null);
    expect(await (await hook({ subscription_id: "sub_123456" })).json()).toMatchObject({ change: "trial" });
    let w = (await store.getWorkspaceById(ws.id))!;
    expect(accessOf(w)).toBe("trial");
    expect(w.subscriptionId).toBe("sub_123456");

    const nextYear = new Date(Date.now() + 365 * 86_400_000).toISOString();
    dodo({ subscription_id: "sub_123456", status: "active", next_billing_date: nextYear, metadata: { ref: ws.id } }, { status: "succeeded", subscription_id: "sub_123456", metadata: { ref: ws.id } });
    expect(await (await hook({ payment_id: "pay_123456" })).json()).toMatchObject({ change: "paid" });
    w = (await store.getWorkspaceById(ws.id))!;
    expect(accessOf(w)).toBe("paid");
    expect(w.paidUntil?.slice(0, 10)).toBe(nextYear.slice(0, 10));

    dodo({ subscription_id: "sub_123456", status: "failed", metadata: { ref: ws.id } }, null);
    expect(await (await hook({ subscription_id: "sub_123456" })).json()).toMatchObject({ change: "ended" });
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
