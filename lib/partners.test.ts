import { readFileSync } from "node:fs";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as dodoWebhook } from "../app/api/dodo/webhook/route";
import { POST as apply } from "../app/api/partners/apply/route";
import { proxy } from "../proxy";
import { funnelFromRows } from "./events";
import { approvedPartner, cleanApplication, listPartners, listReferrals, markPayoutPaid, recordReferral, resetPartnersForTests, savePartnerApplication, setPartnerStatus } from "./partner-db";
import { ALL_PARTNER_PAGES, attachPartner, cleanCode, cookieToSet, EXAMPLE, guaranteeEnds, LANDING, makeCode, PARTNER_SHARE, payoutDue, payoutFor, readPartnerCookie, sharePct } from "./partners";
import { checkoutUrl } from "./payments";
import { hireUrl } from "./paywall";
import { setStoreForTests } from "./store";
import { MemoryStore } from "./store/memory";

const DAY = 86_400_000;
beforeEach(() => resetPartnersForTests());
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

async function approved(name = "Acme PPC", email = "hi@acme.example") {
  await savePartnerApplication({ code: null, name, type: "agency", email, website: "https://acme.example", share: PARTNER_SHARE, status: "pending", reach: "10 to 50", how: "To my clients by email" });
  const p = (await listPartners()).partners.find((x) => x.email === email)!;
  return (await setPartnerStatus(p.id!, "approved"))!;
}

describe("partner codes", () => {
  it("accepts 3 to 24 lowercase letters, digits and inner hyphens; lowercases input", () => {
    expect(cleanCode("acme-ppc")).toBe("acme-ppc");
    expect(cleanCode(" ACME ")).toBe("acme");
    for (const bad of ["ab", "-acme", "acme-", "ac--me", "acme ppc", "a".repeat(25), "acme/../x", "<script>", "", null, 42]) expect(cleanCode(bad)).toBeNull();
  });
  it("makes a code from the name, unique among existing codes", () => {
    expect(makeCode("Acme PPC, LLC", [])).toBe("acme-ppc-llc");
    expect(makeCode("Acme PPC", ["acme-ppc"], () => 0.5)).toBe("acme-ppc-55");
    expect(cleanCode(makeCode("Zoë", []))).not.toBeNull();
    expect(cleanCode(makeCode("!!", []))).not.toBeNull();
  });
  it("approving a partner creates its code; pending and paused codes are not approved", async () => {
    await savePartnerApplication({ code: null, name: "Seller Circle", type: "community", email: "a@circle.example", website: null, share: PARTNER_SHARE, status: "pending", reach: "50 to 250", how: "In my newsletter" });
    expect((await listPartners()).partners[0].code).toBeNull();
    const id = (await listPartners()).partners[0].id!;
    const p = (await setPartnerStatus(id, "approved"))!;
    expect(p.code).toBe("seller-circle");
    expect(await approvedPartner("seller-circle")).toMatchObject({ name: "Seller Circle" });
    await setPartnerStatus(id, "paused");
    expect(await approvedPartner("seller-circle")).toBeNull();
    expect((await setPartnerStatus(id, "approved"))!.code).toBe("seller-circle"); // resume keeps the same code
    expect(await approvedPartner("nobody")).toBeNull();
  });
});

describe("referral cookie: first partner wins, approved codes only", () => {
  it("cookieToSet", () => {
    expect(cookieToSet(null, "acme", true)).toBe("acme");
    expect(cookieToSet(null, "acme", false)).toBeNull(); // not approved
    expect(cookieToSet("first", "acme", true)).toBeNull(); // first wins
    expect(cookieToSet("bad value!", "acme", true)).toBe("acme"); // a junk cookie doesn't block
    expect(cookieToSet(null, "../x", true)).toBeNull();
    expect(readPartnerCookie("a=1; rocco_partner=acme-ppc; b=2")).toBe("acme-ppc");
    expect(readPartnerCookie("rocco_partner=%3Cx%3E")).toBeNull();
  });
  it("attachPartner tags a team once, and never after it has paid", () => {
    const ws: { partner?: string; licensed?: boolean; hiredAt?: string } = {};
    expect(attachPartner(ws, "acme")).toBe(true);
    expect(attachPartner(ws, "other")).toBe(false);
    expect(ws.partner).toBe("acme");
    expect(attachPartner({ licensed: true }, "acme")).toBe(false);
    expect(attachPartner({}, "no way")).toBe(false);
  });
  it("proxy: ?partner= sets the cookie for an approved code and strips the parameter; first one wins; unknown codes set nothing", async () => {
    await approved();
    const r = await proxy(new NextRequest("https://rocco.works/pricing?partner=acme-ppc&utm_source=x"));
    expect(r.status).toBe(307);
    expect(r.headers.get("location")).toBe("https://rocco.works/pricing?utm_source=x");
    const set = r.headers.get("set-cookie")!;
    expect(set).toMatch(/rocco_partner=acme-ppc/);
    expect(set).toMatch(/Max-Age=5184000/); // 60 days
    expect(set).toMatch(/HttpOnly/i);

    const second = await proxy(new NextRequest("https://rocco.works/?partner=acme-ppc", { headers: { cookie: "rocco_partner=first-one" } }));
    expect(second.headers.get("set-cookie")).toBeNull();

    const unknown = await proxy(new NextRequest("https://rocco.works/?partner=nobody"));
    expect(unknown.status).toBe(307);
    expect(unknown.headers.get("set-cookie")).toBeNull();

    const landing = await proxy(new NextRequest("https://rocco.works/p/acme-ppc"));
    expect(landing.headers.get("location")).toBeNull(); // the page renders
    expect(landing.headers.get("set-cookie")).toMatch(/rocco_partner=acme-ppc/);
  });
  it("/p/<code> renders only for approved partners; anything else redirects home", async () => {
    const { default: Landing } = await import("../app/p/[code]/page");
    await expect(Landing({ params: Promise.resolve({ code: "nobody" }) })).rejects.toMatchObject({ digest: expect.stringMatching(/NEXT_REDIRECT;.*;\/;/) });
    await expect(Landing({ params: Promise.resolve({ code: "<bad>" }) })).rejects.toMatchObject({ digest: expect.stringMatching(/NEXT_REDIRECT/) });
  });
});

describe("checkout metadata", () => {
  it("the partner code goes to Dodo as metadata_partner on yearly and monthly links; ref stays the team id", () => {
    vi.stubEnv("DODO_PRODUCT_ID_ANNUAL", "pdt_year1");
    vi.stubEnv("DODO_PRODUCT_ID_MONTHLY", "pdt_month1");
    for (const plan of ["annual", "monthly"] as const) {
      const u = new URL(hireUrl({ id: "ws-123456", licensed: false, brands: {}, createdAt: "", partner: "acme-ppc" }, plan));
      expect(u.searchParams.get("metadata_partner")).toBe("acme-ppc");
      expect(u.searchParams.get("metadata_ref")).toBe("ws-123456");
    }
    expect(new URL(checkoutUrl({ ref: "ws-123456" })!).searchParams.has("metadata_partner")).toBe(false);
    expect(new URL(checkoutUrl({ ref: "ws-123456", partner: "bad code!" })!).searchParams.has("metadata_partner")).toBe(false);
  });
});

describe("payouts", () => {
  const paid = new Date("2026-12-01T10:00:00Z");
  const r = { paid_at: paid.toISOString(), guarantee_ends_at: guaranteeEnds(paid), refunded: false, payout_status: "due" as const };
  it("are due only once the 7-day guarantee has passed and the seller hasn't refunded", () => {
    expect(r.guarantee_ends_at).toBe("2026-12-08T10:00:00.000Z");
    expect(payoutDue(r, new Date(paid.getTime() + 6 * DAY))).toBe(false);
    expect(payoutDue(r, new Date(paid.getTime() + 7 * DAY - 1))).toBe(false);
    expect(payoutDue(r, new Date(paid.getTime() + 7 * DAY))).toBe(true);
    expect(payoutDue({ ...r, refunded: true }, new Date(paid.getTime() + 30 * DAY))).toBe(false);
    expect(payoutDue({ ...r, payout_status: "paid" }, new Date(paid.getTime() + 30 * DAY))).toBe(false);
    expect(payoutDue({ ...r, payout_status: "void" }, new Date(paid.getTime() + 30 * DAY))).toBe(false);
  });
  it("amounts come from the real prices and PARTNER_SHARE", () => {
    expect(payoutFor(2790)).toBeCloseTo(2790 * PARTNER_SHARE);
    expect(EXAMPLE.yearlyPayout).toBe(`$${Math.round(2790 * PARTNER_SHARE).toLocaleString("en-US")}`);
    expect(sharePct()).toBe(`${Math.round(PARTNER_SHARE * 100)}%`);
  });
  it("one referral per team; mark paid only when due", async () => {
    await approved();
    const sale = { partner: "acme-ppc", workspaceId: "ws-1", paymentId: "pay_1", plan: "annual" as const, amountUsd: 2790, paidAt: paid.toISOString() };
    expect(await recordReferral(sale)).toBe("recorded");
    expect(await recordReferral({ ...sale, paymentId: "pay_2" })).toBe("duplicate");
    expect(await recordReferral({ ...sale, workspaceId: "ws-2", partner: "nobody" })).toBe("unknown_partner");
    const ref = (await listReferrals()).referrals[0];
    expect(await markPayoutPaid(ref.id!, 837, "2026-12-03", new Date(paid.getTime() + 2 * DAY))).toMatchObject({ ok: false, error: "not_due" });
    expect(await markPayoutPaid(ref.id!, -5, "2026-12-09", new Date(paid.getTime() + 8 * DAY))).toMatchObject({ ok: false });
    expect(await markPayoutPaid(ref.id!, 837, "2026-12-09", new Date(paid.getTime() + 8 * DAY))).toMatchObject({ ok: true });
    expect((await listReferrals()).referrals[0]).toMatchObject({ payout_status: "paid", payout_amount: 837 });
    expect(await markPayoutPaid(ref.id!, 837, "2026-12-09", new Date(paid.getTime() + 8 * DAY))).toMatchObject({ ok: false }); // not twice
  });
});

describe("Dodo webhook with a partner in metadata (fixtures/dodo-payment-partner.json)", () => {
  async function setup(refunded = false) {
    const store = new MemoryStore();
    setStoreForTests(store);
    const ws = await store.createWorkspace("hash-partner");
    await approved();
    const paidAt = new Date(Date.now() - 60_000).toISOString();
    const pay = JSON.parse(readFileSync(new URL("../fixtures/dodo-payment-partner.json", import.meta.url), "utf8").replace("__PAID_AT__", paidAt).replace("__WORKSPACE_ID__", ws.id));
    if (refunded) pay.refunds = [{ status: "succeeded" }];
    vi.stubEnv("DODO_API_KEY", "k");
    vi.stubEnv("DODO_PRODUCT_ID_ANNUAL", "pdt_year1");
    vi.stubGlobal("fetch", vi.fn(async (u: string) => {
      if (String(u).includes("/payments/pay_partner01")) return Response.json(pay);
      if (String(u).includes("/subscriptions/sub_partner01")) return Response.json({ subscription_id: "sub_partner01", status: "active", product_id: "pdt_year1", metadata: pay.metadata, next_billing_date: new Date(Date.now() + 365 * DAY).toISOString() });
      return Response.json({ items: [] });
    }));
    return { store, ws, paidAt };
  }
  const hook = () => dodoWebhook(new Request("https://x/api/dodo/webhook", { method: "POST", body: JSON.stringify({ type: "payment.succeeded", data: { payment_id: "pay_partner01" } }) }));

  it("stores the code on the team and a referral row for the payment, once", async () => {
    const { store, ws, paidAt } = await setup();
    expect(await (await hook()).json()).toMatchObject({ change: "paid" });
    await hook(); // replay
    expect((await store.getWorkspaceById(ws.id))!.partner).toBe("acme-ppc");
    const { referrals } = await listReferrals();
    expect(referrals).toHaveLength(1);
    expect(referrals[0]).toMatchObject({ partner_code: "acme-ppc", workspace_id: ws.id, payment_id: "pay_partner01", plan: "annual", amount: 2790, refunded: false, payout_status: "due", paid_at: paidAt });
    expect(referrals[0].guarantee_ends_at).toBe(guaranteeEnds(paidAt));
  });

  it("a payment that arrives already refunded records no referral", async () => {
    await setup(true);
    expect(await (await hook()).json()).toMatchObject({ change: "ended" });
    expect((await listReferrals()).referrals).toHaveLength(0);
  });

  it("a sale first recorded, then refunded, ends up void", async () => {
    const { ws } = await setup();
    await hook();
    expect((await listReferrals()).referrals[0].payout_status).toBe("due");
    const pay = JSON.parse(readFileSync(new URL("../fixtures/dodo-payment-partner.json", import.meta.url), "utf8").replace("__PAID_AT__", new Date().toISOString()).replace("__WORKSPACE_ID__", ws.id));
    pay.refunds = [{ status: "succeeded" }];
    vi.stubGlobal("fetch", vi.fn(async (u: string) => (String(u).includes("/payments/") ? Response.json(pay) : Response.json({ items: [] }))));
    expect(await (await hook()).json()).toMatchObject({ change: "ended" });
    expect((await listReferrals()).referrals[0]).toMatchObject({ refunded: true, payout_status: "void" });
  });
});

describe("apply form", () => {
  const ua = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15";
  const post = (body: object, ip = "9.9.9.9") => apply(new Request("https://rocco.works/api/partners/apply", { method: "POST", headers: { "user-agent": ua, origin: "https://rocco.works", "x-forwarded-for": ip, "content-type": "application/json" }, body: JSON.stringify(body) }));
  const good = { name: "Acme PPC", email: "Hi@Acme.example", website: "acme.example", type: "agency", reach: "10 to 50", how: "I'd tell my clients about it." };

  it("validates every field", () => {
    expect(cleanApplication({ ...good, name: "" })).toMatchObject({ field: "name" });
    expect(cleanApplication({ ...good, email: "nope" })).toMatchObject({ field: "email" });
    expect(cleanApplication({ ...good, website: "not a site" })).toMatchObject({ field: "website" });
    expect(cleanApplication({ ...good, type: "reseller" })).toMatchObject({ field: "type" });
    expect(cleanApplication({ ...good, reach: "lots" })).toMatchObject({ field: "reach" });
    expect(cleanApplication({ ...good, how: "hi" })).toMatchObject({ field: "how" });
    const ok = cleanApplication({ ...good, website: "" });
    expect(ok).toMatchObject({ partner: { email: "hi@acme.example", website: null, status: "pending", code: null } });
    expect(cleanApplication(good)).toMatchObject({ partner: { website: "https://acme.example" } });
  });

  it("saves a pending partner, refuses other sites, takes the honeypot quietly, rate limits", async () => {
    expect((await post({ ...good, email: "bad" })).status).toBe(400);
    expect(await (await post(good)).json()).toMatchObject({ ok: true, duplicate: false });
    expect(await (await post(good)).json()).toMatchObject({ ok: true, duplicate: true });
    expect((await listPartners()).partners).toHaveLength(1);
    expect((await listPartners()).partners[0]).toMatchObject({ status: "pending", code: null });
    expect(await (await post({ ...good, email: "bot@x.example", company: "spam" }, "8.8.8.8")).json()).toMatchObject({ ok: true });
    expect((await listPartners()).partners).toHaveLength(1);
    const other = await apply(new Request("https://rocco.works/api/partners/apply", { method: "POST", headers: { "user-agent": ua, origin: "https://evil.example" }, body: JSON.stringify(good) }));
    expect(other.status).toBe(403);
    let last = 200;
    for (let i = 0; i < 10; i++) last = (await post({ ...good, email: `x${i}@a.example` }, "6.6.6.6")).status;
    expect(last).toBe(429);
  });
});

describe("copy and funnel", () => {
  it("no partner page links or mentions the 'Could I Fire My Agency?' tool, and every page shows the share from the constant", () => {
    const all = JSON.stringify([ALL_PARTNER_PAGES, LANDING]);
    expect(all).not.toMatch(/could-i-fire|fire my agency/i);
    for (const p of ALL_PARTNER_PAGES) expect(JSON.stringify(p)).toContain(sharePct());
    expect(all).not.toMatch(/—/);
  });
  it("/admin/funnel counts partner visits and sales under partner:<code>", () => {
    const rows = funnelFromRows([
      { event: "page_view", anon_id: "a1", props: { partner: "acme-ppc" }, utm_source: "x" },
      { event: "paid", ref: "ws-1", props: { partner: "acme-ppc" } },
      { event: "page_view", anon_id: "a2", utm_source: "x" },
    ], 7);
    expect(rows.find((r) => r.source === "partner:acme-ppc")).toMatchObject({ visits: 1, paid: 1 });
    expect(rows.find((r) => r.source === "x")).toMatchObject({ visits: 1 });
  });
});
