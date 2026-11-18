import { afterEach, describe, expect, it, vi } from "vitest";
import { GET as cron } from "../app/api/cron/daily/route";
import { POST as mcp } from "../app/mcp/[token]/route";
import { morningNudge } from "./notify";
import { setStoreForTests } from "./store";
import { MemoryStore } from "./store/memory";
import { respond } from "./text/handler";
import { outbox } from "./text/provider";
import { loadFixture } from "./test-utils";
import Papa from "papaparse";
import { loadWorkspace } from "./workspace";

afterEach(() => { vi.unstubAllEnvs(); vi.useRealTimers(); outbox().length = 0; });

const call = (token: string, name: string, args: Record<string, unknown> = {}) =>
  mcp(new Request(`https://rocco.works/mcp/${token}`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } }),
  }), { params: Promise.resolve({ token }) });

const flush = () => new Promise((r) => setTimeout(r, 30));
const textsTo = (to: string) => outbox().filter((m) => m.to === to).map((m) => m.text);

describe("Claude bridge: connect once, Rocco texts the team", () => {
  it("bing on first use, numbers pushed once when the check lands, one-tap link next morning", async () => {
    vi.stubEnv("ROCCO_VAULT_KEY", "vault");
    vi.stubEnv("CRON_SECRET", "cron");
    const store = new MemoryStore();
    setStoreForTests(store);
    const me = "+14155550777";

    // iMessage onboarding → one link to connect
    await respond(store, me, "hey");
    const intro = await respond(store, me, "I'm Sam, we sell journals");
    expect(intro.bubbles.at(-2)).toMatch(/Connect once in Claude or ChatGPT/);
    const token = intro.bubbles.at(-1)!.split("/w/")[1];

    // Their AI calls Rocco for the first time → 🔔
    await call(token, "rocco_plan", { job: "morning_check" });
    await flush();
    expect(textsTo(me).join("\n")).toMatch(/🔔 I'm on!/);

    // The check runs (analyze + brief) → numbers pushed right away, once
    const csv = Papa.unparse(loadFixture("sp-search-term-report.csv") as string[][]);
    await call(token, "analyze_report", { report_csv: csv });
    await call(token, "rocco_brief");
    await flush();
    const after1 = textsTo(me);
    expect(after1.join("\n")).toMatch(/✅ Amazon is connected/);
    expect(after1.join("\n")).toMatch(/Rocco's numbers/);
    const n = after1.length;
    await call(token, "rocco_brief");
    await flush();
    expect(textsTo(me).length).toBe(n); // not again today

    // Same day cron: already pushed → nothing
    const r1 = await cron(new Request("https://rocco.works/api/cron/daily", { headers: { authorization: "Bearer cron" } }));
    expect((await r1.json()).sent).toBe(0);

    // Next morning, no check yet → one-tap link that opens Claude with the prompt typed
    vi.useFakeTimers({ now: Date.now() + 26 * 3600_000, shouldAdvanceTime: true });
    await cron(new Request("https://rocco.works/api/cron/daily", { headers: { authorization: "Bearer cron" } }));
    const last = textsTo(me).slice(-2);
    expect(last[0]).toMatch(/Tap to run today's check/);
    expect(last[1]).toBe("https://claude.ai/new?q=Rocco%2C%20morning%20check");
  });

  it("not connected: setup reminders at most 3 times, 2 days apart", async () => {
    const store = new MemoryStore();
    const ws = (await loadWorkspace(store, "x")) ?? { id: "w", createdAt: "", licensed: false, brands: {} };
    const t0 = new Date("2026-11-20T08:00:00Z");
    expect(morningNudge(ws, null, t0)?.[0]).toMatch(/Want me on your Amazon/);
    expect(morningNudge(ws, null, new Date("2026-11-21T08:00:00Z"))).toBeNull();
    expect(morningNudge(ws, null, new Date("2026-11-22T08:00:00Z"))).not.toBeNull();
    expect(morningNudge(ws, null, new Date("2026-11-24T08:00:00Z"))).not.toBeNull();
    expect(morningNudge(ws, null, new Date("2026-11-26T08:00:00Z"))).toBeNull();
  });
});
