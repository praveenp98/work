import { beforeEach, describe, expect, it } from "vitest";
import { adminCookieOk, adminCookieValue, cleanClientEvent, cleanPath, funnel, funnelFromRows, recentEvents, recordEvent, recordPaid, resetEventsForTests } from "./events";

describe("funnel events", () => {
  beforeEach(() => { resetEventsForTests(); delete process.env.SUPABASE_URL; delete process.env.SUPABASE_SERVICE_ROLE_KEY; });

  it("never keeps a team link or a query string in the path", () => {
    expect(cleanPath("/w/rw_abcdefghijkmnopqrstuvwxy/log")).toBe("/w");
    expect(cleanPath("/pricing?utm_source=x#top")).toBe("/pricing");
    expect(cleanPath("/")).toBe("/");
    expect(cleanPath("https://evil.example/x")).toBeNull();
  });

  it("accepts only client events, and page views only on landing pages", () => {
    expect(cleanClientEvent({ event: "paid", path: "/" })).toBeNull();
    expect(cleanClientEvent({ event: "call_booked", path: "/" })).toBeNull();
    expect(cleanClientEvent({ event: "page_view", path: "/w/rw_abc" })).toBeNull();
    expect(cleanClientEvent({ event: "nope", path: "/" })).toBeNull();
    const row = cleanClientEvent({ event: "tool_result", path: "/tools/ad-roast", utm: { source: " X Thread!! ", campaign: "Day 7" }, ref_host: "www.X.com", aid: "0b7e-anon-id-123", props: { tool: "ad-roast", email: "a@b.co" } });
    expect(row).toMatchObject({ event: "tool_result", path: "/tools/ad-roast", utm_source: "x-thread", utm_campaign: "day-7", ref_host: "x.com", anon_id: "0b7e-anon-id-123", props: { tool: "ad-roast" } });
    expect(JSON.stringify(row)).not.toContain("a@b.co");
  });

  it("counts people for visits and checkouts, events for the rest, by first-touch source", async () => {
    await recordEvent({ event: "page_view", path: "/", utm_source: "x", anon_id: "visitor-aaaa" });
    await recordEvent({ event: "page_view", path: "/pricing", utm_source: "x", anon_id: "visitor-aaaa" });
    await recordEvent({ event: "page_view", path: "/", utm_source: "x", anon_id: "visitor-bbbb" });
    await recordEvent({ event: "page_view", path: "/", ref_host: "reddit.com", anon_id: "visitor-cccc" });
    await recordEvent({ event: "page_view", path: "/" });
    await recordEvent({ event: "lead_captured", utm_source: "x", anon_id: "visitor-aaaa", props: { magnet: "checklist" } });
    await recordEvent({ event: "call_click", utm_source: "x" });
    await recordEvent({ event: "call_booked", utm_source: "x" });
    await recordEvent({ event: "checkout_started", utm_source: "x", anon_id: "visitor-aaaa", ref: "team-1" });
    await recordEvent({ event: "checkout_started", utm_source: "x", anon_id: "visitor-aaaa", ref: "team-1" });
    const { rows } = await funnel(7);
    expect(rows.find((r) => r.source === "x")).toEqual({ source: "x", visits: 2, leads: 1, call_clicks: 1, calls_booked: 1, checkouts: 1, paid: 0 });
    expect(rows.find((r) => r.source === "reddit.com")?.visits).toBe(1);
    expect(rows.find((r) => r.source === "direct")?.visits).toBe(1);
  });

  it("records a payment once per team, with the source of its checkout", async () => {
    await recordEvent({ event: "checkout_started", utm_source: "linkedin", utm_campaign: "day-9", anon_id: "visitor-dddd", ref: "team-9" });
    expect(await recordPaid("team-9")).toBe(true);
    expect(await recordPaid("team-9")).toBe(false);
    expect(await recordPaid("team-with-no-checkout")).toBe(true);
    const { rows } = await funnel(30);
    expect(rows.find((r) => r.source === "linkedin")).toMatchObject({ checkouts: 1, paid: 1 });
    expect(rows.find((r) => r.source === "direct")?.paid).toBe(1);
    expect((await recentEvents(1))[0]).toMatchObject({ event: "paid", ref: "team-with-no-checkout" });
  });

  it("drops rows older than the window", () => {
    const now = Date.parse("2026-11-23T00:00:00Z");
    const old = new Date(now - 10 * 86_400_000).toISOString();
    const rows = funnelFromRows([{ event: "page_view", anon_id: "visitor-eeee", created_at: old }], 7, now);
    expect(rows).toEqual([]);
    expect(funnelFromRows([{ event: "page_view", anon_id: "visitor-eeee", created_at: old }], 30, now)[0].visits).toBe(1);
  });

  it("admin cookie is a keyed hash of the secret, never the secret", () => {
    process.env.CRON_SECRET = "s3cret-for-tests";
    const v = adminCookieValue();
    expect(v).toHaveLength(64);
    expect(v).not.toContain("s3cret");
    expect(adminCookieOk(v)).toBe(true);
    expect(adminCookieOk("s3cret-for-tests")).toBe(false);
    delete process.env.CRON_SECRET;
    expect(adminCookieOk(v)).toBe(false);
    expect(adminCookieOk("")).toBe(false);
  });
});
