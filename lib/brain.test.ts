import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { askRocco } from "./brain";
import { MemoryStore } from "./store/memory";
import { grantTrial, wsOfPhone } from "./test-utils";
import { respond } from "./text/handler";
import { parseInbound } from "./text/provider";

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

const CSV = fs.readFileSync(path.join(__dirname, "..", "fixtures", "sp-search-term-report.csv"), "utf8");

/** Fake network: the texted file, and (optionally) the Anthropic Messages API. */
function stubNet(reply?: string) {
  const seen: { url: string; body?: Record<string, unknown> }[] = [];
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const raw = init?.body ?? (input instanceof Request ? await input.clone().text() : undefined);
    seen.push({ url, body: raw ? JSON.parse(String(raw)) : undefined });
    if (url.includes("files.example/report.csv")) return new Response(CSV);
    if (url.includes("api.anthropic.com")) {
      return new Response(JSON.stringify({ id: "msg_1", type: "message", role: "assistant", model: "claude-opus-5-5", stop_reason: "end_turn", stop_sequence: null, content: [{ type: "text", text: reply ?? "ok" }], usage: { input_tokens: 10, output_tokens: 5 } }), { headers: { "content-type": "application/json" } });
    }
    return new Response("not found", { status: 404 });
  }));
  return seen;
}

describe("Rocco reads what you text him", () => {
  it("picks attachments out of the webhook", () => {
    expect(parseInbound({ event: "message_inbound", contact: "+1", text: "", attachments: ["https://files.example/a.png", { url: "https://files.example/b.csv" }, "http://insecure"] })?.attachments)
      .toEqual(["https://files.example/a.png", "https://files.example/b.csv"]);
  });

  it("files and screenshots by text are for teams that hired Rocco (no free analysis, no free AI calls)", async () => {
    stubNet();
    const store = new MemoryStore();
    const r = await respond(store, "+14155550900", "", new Date(), { attachments: ["https://files.example/report.csv"] });
    expect(r.bubbles[0]).toMatch(/for teams that hired me/);
    expect(r.bubbles[1]).toMatch(/rocco\.works|dodopayments/);
    expect((await store.listPhones({})).length).toBe(1);
  });

  it("a screenshot without the brain gets an honest fallback with the link", async () => {
    stubNet();
    const store = new MemoryStore();
    await respond(store, "+14155550901", "hi");
    const ph = await store.getPhone("+14155550901");
    if (ph?.workspaceId) await grantTrial(store, ph.workspaceId);
    const r = await respond(store, "+14155550901", "", new Date(), { attachments: ["https://files.example/shot.png"] });
    expect(r.bubbles[0]).toMatch(/can't read screenshots yet/);
  });

  it("with ANTHROPIC_API_KEY: free text and screenshots go to Claude with the team's context", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "sk-test");
    const seen = stubNet("ACoS is up because top-of-search bids rose Tuesday. Reply YES P1 to roll it back.");
    const store = new MemoryStore();
    await respond(store, "+14155550902", "hi");
    await respond(store, "+14155550902", "I'm Sam, we sell journals"); // intro answer (rules)
    await grantTrial(store, (await wsOfPhone(store, "+14155550902"))!.id);
    const r = await respond(store, "+14155550902", "why is my acos up?");
    expect(r.bubbles[0]).toMatch(/top-of-search/);
    const call = seen.find((s) => s.url.includes("api.anthropic.com"))!;
    expect(call.body).toMatchObject({ model: "claude-opus-5-5", fallbacks: "default", output_config: { effort: "low" } });
    expect(JSON.stringify(call.body)).toMatch(/we sell journals/);

    const shot = await respond(store, "+14155550902", "what do you see?", new Date(), { attachments: ["https://files.example/shot.png"] });
    expect(shot.bubbles[0]).toMatch(/top-of-search/);
    const img = seen.filter((s) => s.url.includes("api.anthropic.com")).at(-1)!;
    expect(JSON.stringify(img.body)).toMatch(/"type":"image","source":\{"type":"url","url":"https:\/\/files\.example\/shot\.png"/);
  });

  it("is off without a key", async () => {
    expect(await askRocco({ question: "hi", context: "" })).toBeNull();
  });
});
