import { afterEach, describe, expect, it, vi } from "vitest";
import { firstDelivery, optInLinks, parseInbound, sendText, stripOptInCode } from "./provider";

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("LoopMessage provider (per loopmessage.com/apidocs)", () => {
  it("sends with Authorization: <key> (no Bearer) and contact/text fields", async () => {
    vi.stubEnv("LOOPMESSAGE_API_KEY", "lm_key");
    const calls: [string, RequestInit][] = [];
    vi.stubGlobal("fetch", vi.fn(async (u: string, i: RequestInit) => { calls.push([u, i]); return new Response(JSON.stringify({ message_id: "m1", contact: "+14155550100", text: "hi" })); }));
    const r = await sendText("+14155550100", "hi");
    expect(r).toMatchObject({ ok: true, dryRun: false, messageId: "m1" });
    expect(calls[0][0]).toBe("https://a.loopmessage.com/api/v1/message/send/");
    expect((calls[0][1].headers as Record<string, string>).Authorization).toBe("lm_key");
    expect(JSON.parse(String(calls[0][1].body))).toEqual({ contact: "+14155550100", text: "hi" });
  });
  it("reports API failures (success:false)", async () => {
    vi.stubEnv("LOOPMESSAGE_API_KEY", "lm_key");
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ success: false, message: "no active conversation" }), { status: 400 })));
    expect(await sendText("+1", "x")).toMatchObject({ ok: false, error: "HTTP 400: no active conversation" });
  });
  it("dry-runs without a key", async () => {
    expect(await sendText("+1", "x")).toMatchObject({ ok: true, dryRun: true });
  });
  it("generates opt-in links with the link code and shared sender type", async () => {
    vi.stubEnv("LOOPMESSAGE_API_KEY", "lm_key");
    vi.stubEnv("LOOPMESSAGE_SENDER_TYPE", "shared");
    let sent: Record<string, unknown> = {};
    vi.stubGlobal("fetch", vi.fn(async (_u: string, i: RequestInit) => { sent = JSON.parse(String(i.body)); return new Response(JSON.stringify({ imessage: "imessage://x", url: "https://opt-in.imsg.link/x" })); }));
    const l = await optInLinks({ link: "DBZJ7F" });
    expect(l?.url).toBe("https://opt-in.imsg.link/x");
    expect(sent).toMatchObject({ link: "DBZJ7F", sender_type: "shared" });
    expect(String(sent.body)).toContain("[opt-in-code]");
  });
});

describe("parseInbound", () => {
  it("reads message_inbound and ignores statuses", () => {
    expect(parseInbound({ event: "message_inbound", contact: "+13231112233", text: "numbers", webhook_id: "w1" })).toEqual({ id: "w1", contact: "+13231112233", text: "numbers", linkCode: undefined, optIn: false, line: undefined });
    expect(parseInbound({ event: "message_delivered", contact: "+1", text: "x" })).toBeNull();
  });
  it("picks up the workspace link code from opt-in parameters", () => {
    const m = parseInbound({ event: "message_inbound", type: "opt_in", contact: "+1555", text: "Hi Rocco", parameters: { link: "dbzj7f" }, webhook_id: "w2" });
    expect(m).toMatchObject({ linkCode: "DBZJ7F", optIn: true });
  });
  it("hides LoopMessage's opt-in code and reads the line they texted", () => {
    expect(stripOptInCode('I\'m in!\n\n"!9GUF"')).toBe("I'm in!");
    expect(stripOptInCode("Hey Rocco 👋 Show me what you can do !AB12")).toBe("Hey Rocco 👋 Show me what you can do");
    expect(parseInbound({ event: "message_inbound", contact: "+1555", text: "hi", sender_name: "+1 (786) 645-7348" })?.line).toBe("+17866457348");
    expect(parseInbound({ event: "message_inbound", contact: "+1555", text: "hi", sender_name: "rocco@imsg" })?.line).toBeUndefined();
  });
  it("dedupes retried webhooks", () => {
    expect(firstDelivery("dup-1")).toBe(true);
    expect(firstDelivery("dup-1")).toBe(false);
  });
});
