import { createHmac } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GET as cron } from "../app/api/cron/daily/route";
import { POST as events } from "../app/api/slack/events/route";
import { GET as oauth } from "../app/api/slack/oauth/route";
import { fromSlack, installUrl, readState, toSlack, verifySlack } from "./slack";
import { setStoreForTests } from "./store";
import { MemoryStore } from "./store/memory";
import { grantTrial, loadFixture } from "./test-utils";
import { createWorkspace, rememberToken, runAnalysis } from "./workspace";

vi.mock("next/server", async (orig) => ({ ...(await orig<typeof import("next/server")>()), after: (fn: () => Promise<void>) => { pending.push(fn()); } }));
const pending: Promise<void>[] = [];

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); pending.length = 0; });

function env() {
  vi.stubEnv("SLACK_CLIENT_ID", "cid");
  vi.stubEnv("SLACK_CLIENT_SECRET", "csecret");
  vi.stubEnv("SLACK_SIGNING_SECRET", "signsecret");
  vi.stubEnv("ROCCO_VAULT_KEY", "vault");
  vi.stubEnv("CRON_SECRET", "cron");
}

function slackNet() {
  const posts: { channel: string; text: string; thread_ts?: string }[] = [];
  vi.stubGlobal("fetch", vi.fn(async (u: string, init?: RequestInit) => {
    if (String(u).includes("oauth.v2.access")) return Response.json({ ok: true, access_token: "xoxb-1", team: { id: "T1", name: "Acme" }, incoming_webhook: { channel_id: "C1", channel: "#amazon-team" } });
    if (String(u).includes("chat.postMessage")) { posts.push(JSON.parse(String(init?.body))); return Response.json({ ok: true }); }
    return Response.json({ items: [] });
  }));
  return posts;
}

function signed(body: object) {
  const raw = JSON.stringify(body);
  const ts = String(Math.floor(Date.now() / 1000));
  const sig = "v0=" + createHmac("sha256", "signsecret").update(`v0:${ts}:${raw}`).digest("hex");
  return new Request("https://rocco.works/api/slack/events", { method: "POST", body: raw, headers: { "x-slack-request-timestamp": ts, "x-slack-signature": sig } });
}

describe("Rocco in Slack", () => {
  it("formats both ways and rejects unsigned requests", () => {
    expect(fromSlack("<@U0ROCCO> yes N1 N2")).toBe("yes N1 N2");
    expect(toSlack("Reply YES N1 B7 to approve")).toBe("Reply *YES N1 B7* to approve");
    vi.stubEnv("SLACK_SIGNING_SECRET", "signsecret");
    expect(verifySlack(new Headers({ "x-slack-request-timestamp": String(Math.floor(Date.now() / 1000)), "x-slack-signature": "v0=bad" }), "{}")).toBe(false);
  });

  it("install → connect → @mention approval in a thread → DM → morning post", async () => {
    env();
    const posts = slackNet();
    const store = new MemoryStore();
    setStoreForTests(store);
    const { ws, token } = await createWorkspace(store);
    ws.trialEndsAt = (await grantTrial(store, ws.id)).trialEndsAt;
    await rememberToken(store, ws, token);
    await runAnalysis(store, ws, "main", loadFixture("sp-search-term-report.csv"));

    const url = new URL(installUrl(ws.id)!);
    expect(url.searchParams.get("scope")).toContain("app_mentions:read");
    expect(readState(url.searchParams.get("state"))).toBe(ws.id);

    const back = await oauth(new Request(`https://rocco.works/api/slack/oauth?code=abc&state=${encodeURIComponent(url.searchParams.get("state")!)}`));
    expect(back.headers.get("location")).toContain(`/w/${token}?slack=connected`);
    expect(posts[0]).toMatchObject({ channel: "C1" });
    expect(posts[0].text).toMatch(/I'm Rocco/);

    const challenge = await events(signed({ type: "url_verification", challenge: "xyz" }));
    expect(await challenge.json()).toEqual({ challenge: "xyz" });

    const runs = await store.listRuns(ws.id, { limit: 1 });
    const code = runs[0].proposals[0].code;
    await events(signed({ type: "event_callback", team_id: "T1", event_id: "Ev1", event: { type: "app_mention", user: "U9", text: `<@U0ROCCO> yes ${code}`, channel: "C1", ts: "111.1" } }));
    await Promise.all(pending);
    const reply = posts.at(-1)!;
    expect(reply).toMatchObject({ channel: "C1", thread_ts: "111.1" });
    expect(reply.text).toMatch(new RegExp(`Approved ✅ ${code}`));
    expect((await store.getWorkspaceById(ws.id))?.pending?.[0].codes).toContain(code);

    await events(signed({ type: "event_callback", team_id: "T1", event_id: "Ev2", event: { type: "message", channel_type: "im", user: "U9", text: "help", channel: "D1", ts: "112.1" } }));
    await Promise.all(pending);
    expect(posts.at(-1)).toMatchObject({ channel: "D1" });
    expect(posts.at(-1)!.thread_ts).toBeUndefined();

    const before = posts.length;
    const res = await cron(new Request("https://rocco.works/api/cron/daily", { headers: { authorization: "Bearer cron" } }));
    expect((await res.json()).sent).toBeGreaterThan(0);
    expect(posts.slice(before).some((p) => p.channel === "C1" && /Rocco's numbers/.test(p.text))).toBe(true);
  });
});
