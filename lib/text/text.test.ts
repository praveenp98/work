import { describe, expect, it, vi } from "vitest";
import { MemoryStore } from "../store/memory";
import { loadFixture } from "../test-utils";
import { applyChanges, buildBrief, clearPending, createWorkspace, ensureLinkCode, loadWorkspace, runAnalysis } from "../workspace";
import { normPhone, parseCommand } from "./commands";
import { dailyNumbers } from "./daily";
import { handleInbound, respond } from "./handler";

describe("parseCommand", () => {
  it("understands the core commands", () => {
    expect(parseCommand("Hi Rocco, link R7K2QX")).toEqual({ kind: "link", code: "R7K2QX" });
    expect(parseCommand("yes N1 N2")).toEqual({ kind: "approve", codes: ["N1", "N2"] });
    expect(parseCommand("approve N1-N3 and G2")).toEqual({ kind: "approve", codes: ["N1-N3", "G2"] });
    expect(parseCommand("N4")).toEqual({ kind: "approve", codes: ["N4"] });
    expect(parseCommand("undo B3")).toEqual({ kind: "undo", codes: ["B3"] });
    expect(parseCommand("STOP").kind).toBe("stop");
    expect(parseCommand("numbers").kind).toBe("numbers");
    expect(parseCommand("what should I do today?").kind).toBe("brief");
    expect(parseCommand("how's stock looking?")).toMatchObject({ kind: "ask", topic: "stock" });
    expect(parseCommand("why is ACoS up")).toMatchObject({ kind: "ask", topic: "ads" });
  });
  it("normalizes phone numbers", () => {
    expect(normPhone("(415) 555-0100")).toBe("+14155550100");
    expect(normPhone("+44 7700 900123")).toBe("+447700900123");
  });
});

describe("Text Rocco: brand-new number", () => {
  it("hello + one question + card; the answer gets a demo morning and ONE link on its own; commands answer", async () => {
    vi.stubEnv("ROCCO_VAULT_KEY", "test-vault");
    const store = new MemoryStore();
    const now = new Date();
    const hi = await respond(store, "+14085550123", "Hey Rocco 👋 Show me what you can do", now);
    expect(hi.bubbles).toHaveLength(2);
    expect(hi.bubbles[1]).toMatch(/Who am I talking to/);
    expect(hi.card).toBe(true);
    const intro = await respond(store, "+14085550123", "Praveen here. I sell journals.", now);
    expect(intro.bubbles[0]).toMatch(/Nice to meet you, Praveen/);
    expect(intro.bubbles[1]).toMatch(/Demo brand · Rocco's numbers/);
    expect(intro.bubbles[1]).toMatch(/Reply YES/);
    const link = intro.bubbles.at(-1)!;
    expect(link).toMatch(/^https:\/\/rocco\.works\/w\/rw_[A-Za-z0-9]{24}$/); // alone in its bubble → rich preview, one tap
    expect(intro.bubbles.join(" ")).not.toMatch(/link [A-Z0-9]{6}/); // no codes to type
    const token = link.split("/w/")[1];
    expect((await loadWorkspace(store, token))?.about).toMatch(/journals/);
    expect(await handleInbound(store, "+14085550123", "Help", now)).toMatch(/invite → add a teammate/);
    const nums = await respond(store, "+14085550123", "numbers", now);
    expect(nums.bubbles[1]).toBe(link);
    expect((await respond(store, "+14085550123", "yes N1", now)).bubbles[0]).toMatch(/That's the move/);
    expect((await respond(store, "+14085550123", "link", now)).bubbles[1]).toBe(link);
    expect(await handleInbound(store, "+14085550123", "invite", now)).toMatch(/https:\/\/rocco\.works\/j\/[A-Z2-9]{6}$/); // our invite page, never a raw opt-in link
    expect((await store.listPhones({})).length).toBe(1);
    vi.unstubAllEnvs();
  });
  it("a command during the intro just works", async () => {
    const store = new MemoryStore();
    await respond(store, "+14085550124", "hey");
    expect(await handleInbound(store, "+14085550124", "help")).toMatch(/numbers → today's numbers/);
  });
  it("teammates join with 'join CODE' too", () => {
    expect(parseCommand("join R7K2QX")).toEqual({ kind: "link", code: "R7K2QX" });
  });
});

describe("Text Rocco flow", () => {
  it("links a teammate, texts numbers, queues approvals for the AI, clears them on apply", async () => {
    const store = new MemoryStore();
    const { ws } = await createWorkspace(store);
    await runAnalysis(store, ws, "main", loadFixture("sp-search-term-report.csv"));
    await runAnalysis(store, ws, "main", loadFixture("restock-inventory.csv"));
    const now = new Date();

    // stranger
    expect(await handleInbound(store, "+14155550100", "hello", now)).toMatch(/Who am I talking to/);
    // link with the workspace code
    const code = await ensureLinkCode(store, ws);
    expect(code).toMatch(/^[A-Z2-9]{6}$/);
    expect(await handleInbound(store, "(415) 555-0100", `Hi Rocco, link ${code}`, now)).toMatch(/You're in/);
    // a second teammate joins the same line
    expect(await handleInbound(store, "+14155550199", `link ${code}`, now)).toMatch(/2 teammates/);

    // daily numbers
    const nums = await handleInbound(store, "+14155550100", "numbers", now);
    expect(nums).toMatch(/Rocco's numbers/);
    expect(nums).toMatch(/Leak: \$481\/mo/);
    expect(nums).toMatch(/could run out/);
    expect(nums).toMatch(/Reply YES/);

    // approve by text → queued (free plan: N1-N3 ok, N4 locked)
    const reply = await handleInbound(store, "+14155550100", "yes N1 N2 N4 Z9", now);
    expect(reply).toMatch(/Approved ✅ N1, N2/);
    expect(reply).toMatch(/🔒 N4/);
    expect(reply).toMatch(/Don't recognize Z9/);
    const fresh = (await store.getWorkspaceById(ws.id))!;
    expect(fresh.pending?.[0]).toMatchObject({ type: "apply", codes: ["N1", "N2"], by: "•••0100" });

    // the AI applies them → queue clears
    const res = await applyChanges(store, fresh, ["N1", "N2"]);
    await clearPending(store, fresh, "apply", res.actions.map((a) => a.code));
    expect((await store.getWorkspaceById(ws.id))!.pending).toEqual([]);

    // STOP / START
    expect(await handleInbound(store, "+14155550100", "stop", now)).toMatch(/Paused/);
    expect((await store.listPhones({ optedIn: true })).map((p) => p.phone)).toEqual(["+14155550199"]);
    expect(await handleInbound(store, "+14155550100", "start", now)).toMatch(/Back on/);

    // ask from memory
    expect(await handleInbound(store, "+14155550100", "how's stock?", now)).toMatch(/could run out/);
  });

  it("warns when numbers are stale", async () => {
    const store = new MemoryStore();
    const { ws } = await createWorkspace(store);
    await runAnalysis(store, ws, "main", loadFixture("sp-search-term-report.csv"));
    const later = new Date(Date.now() + 4 * 86400000);
    expect(dailyNumbers(await buildBrief(store, ws, later), { now: later })).toMatch(/Last check was 4 days ago/);
  });
});
