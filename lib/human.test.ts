import { afterEach, describe, expect, it, vi } from "vitest";
import { POST as start } from "../app/api/text/start/route";
import { allow, looksLikeBot } from "./human";

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

const iphone = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const req = (h: Record<string, string>, body: object = {}) => new Request("https://rocco.works/api/text/start", { method: "POST", headers: { "content-type": "application/json", ...h }, body: JSON.stringify(body) });

describe("LoopMessage opt-in links are only made for people", () => {
  it("spots bots, link previews and prefetch", () => {
    expect(looksLikeBot(new Headers({ "user-agent": "facebookexternalhit/1.1 Facebot Twitterbot/1.0" }))).toBe("bot user agent"); // Apple's iMessage link preview
    expect(looksLikeBot(new Headers({ "user-agent": "Slackbot-LinkExpanding 1.0" }))).toBe("bot user agent");
    expect(looksLikeBot(new Headers({ "user-agent": iphone, "sec-purpose": "prefetch" }))).toBe("prefetch");
    expect(looksLikeBot(new Headers({}))).toBe("no user agent");
    expect(looksLikeBot(new Headers({ "user-agent": iphone }))).toBeNull();
  });

  it("rate limits per visitor", () => {
    const t = 1_000_000;
    expect([1, 2, 3, 4].every((i) => allow("ip:test", 4, 600_000, t + i))).toBe(true);
    expect(allow("ip:test", 4, 600_000, t + 5)).toBe(false);
    expect(allow("ip:test", 4, 600_000, t + 700_000)).toBe(true);
  });

  it("the endpoint refuses anything but a real tap from rocco.works", async () => {
    vi.stubEnv("LOOPMESSAGE_API_KEY", "k");
    let made = 0;
    vi.stubGlobal("fetch", vi.fn(async () => { made++; return Response.json({ url: "https://opt-in.imsg.link/x" }); }));
    expect((await start(req({ "user-agent": iphone, origin: "https://rocco.works" }))).status).toBe(403); // no tap header
    expect((await start(req({ "user-agent": iphone, origin: "https://evil.example", "x-rocco-tap": "1" }))).status).toBe(403);
    expect((await start(req({ "user-agent": "Googlebot/2.1", origin: "https://rocco.works", "x-rocco-tap": "1" }))).status).toBe(403);
    expect(made).toBe(0);
    const ok = await start(req({ "user-agent": iphone, origin: "https://rocco.works", "x-rocco-tap": "1", "x-forwarded-for": "9.9.9.9" }, { q: "my ACoS" }));
    expect(await ok.json()).toMatchObject({ ok: true, url: "https://opt-in.imsg.link/x" });
    expect(made).toBe(1);
    for (let i = 0; i < 3; i++) await start(req({ "user-agent": iphone, origin: "https://rocco.works", "x-rocco-tap": "1", "x-forwarded-for": "9.9.9.9" }));
    expect((await start(req({ "user-agent": iphone, origin: "https://rocco.works", "x-rocco-tap": "1", "x-forwarded-for": "9.9.9.9" }))).status).toBe(429);
  });
});
