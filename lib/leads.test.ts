import { beforeEach, describe, expect, it } from "vitest";
import { POST } from "@/app/api/leads/route";
import { POST as UNSUB } from "@/app/api/leads/unsubscribe/route";
import { CONSENT_TEXT, groupLeads, listLeads, readUnsubscribeToken, resetLeadsForTests, unsubscribeToken } from "./leads";

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const ft = (o: object) => `rocco_ft=${encodeURIComponent(JSON.stringify(o))}`;
let ipN = 0;
function post(body: unknown, { cookie = "", origin = "https://rocco.works", ua = UA, ip }: { cookie?: string; origin?: string; ua?: string; ip?: string } = {}) {
  return POST(new Request("https://rocco.works/api/leads", { method: "POST", headers: { "content-type": "application/json", origin, "user-agent": ua, cookie, "x-forwarded-for": ip ?? `10.0.0.${++ipN}` }, body: JSON.stringify(body) }));
}

describe("POST /api/leads", () => {
  beforeEach(() => { resetLeadsForTests(); delete process.env.SUPABASE_URL; delete process.env.SUPABASE_SERVICE_ROLE_KEY; });

  it("stores a lead with the first-touch source from the cookie, consent off by default", async () => {
    const res = await post({ email: " Seller@Brand.com ", leadMagnet: "bfcm-checklist-2026", marketplace: "India", page: "/free/black-friday-checklist?x=1" }, { cookie: ft({ source: "X", medium: "social", campaign: "Day 8 BFCM", ref: "www.x.com" }) });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    const [lead] = (await listLeads()).leads;
    expect(lead).toMatchObject({ email: "seller@brand.com", lead_magnet: "bfcm-checklist-2026", marketplace: "India", source_page: "/free/black-friday-checklist", utm_source: "x", utm_medium: "social", utm_campaign: "day-8-bfcm", referrer: "x.com", consent_marketing: false, consent_text: null });
  });

  it("records the exact consent words only when the box is ticked", async () => {
    await post({ email: "a@brand.com", leadMagnet: "m", consent: true });
    await post({ email: "b@brand.com", leadMagnet: "m", consent: "yes" });
    const leads = (await listLeads()).leads;
    expect(leads.find((l) => l.email === "a@brand.com")).toMatchObject({ consent_marketing: true, consent_text: CONSENT_TEXT });
    expect(leads.find((l) => l.email === "b@brand.com")).toMatchObject({ consent_marketing: false, consent_text: null });
  });

  it("keeps one row per email and magnet; a later tick turns consent on, a later blank never turns it off", async () => {
    await post({ email: "a@brand.com", leadMagnet: "m" }, { cookie: ft({ source: "reddit" }) });
    await post({ email: "a@brand.com", leadMagnet: "m", consent: true }, { cookie: ft({ source: "x" }) });
    await post({ email: "a@brand.com", leadMagnet: "m" });
    await post({ email: "a@brand.com", leadMagnet: "other" });
    const leads = (await listLeads()).leads;
    expect(leads).toHaveLength(2);
    expect(leads.find((l) => l.lead_magnet === "m")).toMatchObject({ utm_source: "reddit", consent_marketing: true });
  });

  it("rejects bad emails, unknown marketplaces are dropped, and nothing unexpected is stored", async () => {
    expect((await post({ email: "not-an-email", leadMagnet: "m" })).status).toBe(400);
    expect((await post({ email: "a@brand.com" })).status).toBe(400);
    await post({ email: "c@brand.com", leadMagnet: "m", marketplace: "<script>", notes: "x", unsubscribed_at: "2020-01-01" });
    expect((await listLeads()).leads[0]).toMatchObject({ marketplace: null });
    expect((await listLeads()).leads[0].notes).toBeUndefined();
  });

  it("honeypot: a filled hidden field gets an ok and stores nothing", async () => {
    const res = await post({ email: "bot@spam.com", leadMagnet: "m", website: "http://spam.example" });
    expect(await res.json()).toEqual({ ok: true });
    expect((await listLeads()).leads).toHaveLength(0);
  });

  it("refuses other sites and bots", async () => {
    expect((await post({ email: "a@brand.com", leadMagnet: "m" }, { origin: "https://evil.example" })).status).toBe(403);
    expect((await post({ email: "a@brand.com", leadMagnet: "m" }, { ua: "curl/8.0" })).status).toBe(403);
    expect((await listLeads()).leads).toHaveLength(0);
  });

  it("rate-limits one visitor (shared limits)", async () => {
    const codes: number[] = [];
    for (let i = 0; i < 8; i++) codes.push((await post({ email: `u${i}@brand.com`, leadMagnet: "m" }, { ip: "203.0.113.9" })).status);
    expect(codes.filter((c) => c === 200)).toHaveLength(6);
    expect(codes.slice(6)).toEqual([429, 429]);
  });

  it("unsubscribe: only a correctly signed token works, and it covers every magnet for that email", async () => {
    await post({ email: "a@brand.com", leadMagnet: "m", consent: true });
    await post({ email: "a@brand.com", leadMagnet: "n", consent: true });
    await post({ email: "z@brand.com", leadMagnet: "m", consent: true });
    const token = unsubscribeToken("A@brand.com")!;
    expect(readUnsubscribeToken(token)).toBe("a@brand.com");
    expect(readUnsubscribeToken(token.slice(0, -2) + "xx")).toBeNull();
    expect(readUnsubscribeToken(`${Buffer.from("z@brand.com").toString("base64url")}.${token.split(".")[1]}`)).toBeNull();
    const form = new FormData(); form.set("token", token);
    const res = await UNSUB(new Request("https://rocco.works/api/leads/unsubscribe", { method: "POST", body: form, headers: { "x-forwarded-for": "198.51.100.7" } }));
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toContain("done=1");
    const leads = (await listLeads()).leads;
    expect(leads.filter((l) => l.email === "a@brand.com").every((l) => l.unsubscribed_at && !l.consent_marketing)).toBe(true);
    expect(leads.find((l) => l.email === "z@brand.com")).toMatchObject({ consent_marketing: true, unsubscribed_at: null });
    expect(groupLeads(leads).find((g) => g.lead_magnet === "m")).toMatchObject({ leads: 2, consented: 1, unsubscribed: 1 });
  });
});
