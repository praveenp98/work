import { afterEach, describe, expect, it, vi } from "vitest";
import { POST as reminders } from "../app/api/w/reminders/route";
import { tellTeam } from "./datadoe-sync";
import { amazonNote } from "./messages";
import { accountMemory, tuning } from "./memory";
import { setStoreForTests } from "./store";
import { MemoryStore } from "./store/memory";
import type { Skip } from "./store/types";
import { grantTrial, loadFixture } from "./test-utils";
import { outbox } from "./text/provider";
import { createWorkspace, runAnalysis } from "./workspace";

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

const sk = (reason: Skip["reason"], i: number): Skip => ({ code: `B${i}`, kind: "bid", target: "x", value: 10, at: "2026-11-22", reason });

describe("skip reasons teach Rocco the team's style", () => {
  it("'not my strategy' twice holds that kind of fix; 'already done' and 'not now' don't count against it", () => {
    const later = [sk("done", 1), sk("later", 2), sk("done", 3), sk("later", 4)];
    expect(accountMemory([], later).bid?.skipped).toBe(0);
    expect(tuning(accountMemory([], later), later).bid).toBeUndefined();
    const strat = [sk("strategy", 1), sk("strategy", 2)];
    expect(tuning(accountMemory([], strat), strat).bid).toEqual({ hold: true, why: "you said this isn't your strategy" });
  });
  it("Amazon return codes become plain next steps", () => {
    expect(amazonNote("SC_ACCOUNT_LACKING_PERMISSIONS")).toMatch(/primary user/);
    expect(amazonNote("unknown")).toMatch(/fresh one/);
    expect(amazonNote("connected")).toMatch(/first fixes/);
  });
});

describe("reminders after payment", () => {
  async function team() {
    const store = new MemoryStore(); setStoreForTests(store);
    const { ws, token } = await createWorkspace(store);
    await runAnalysis(store, ws, "Habit Nest US", loadFixture("sp-search-term-report.csv"));
    await store.savePhone({ phone: "+14155550123", workspaceId: ws.id, optedOut: false, createdAt: "2026-11-22" });
    return { store, ws, token };
  }
  const set = (token: string, body: object) => reminders(new Request("https://rocco.works/api/w/reminders", { method: "POST", body: JSON.stringify({ t: token, ...body }) }));

  it("needs a plan; approve-by-text stays locked until they've seen their jobs", async () => {
    const { store, ws, token } = await team();
    expect((await set(token, { cadence: "daily" })).status).toBe(402);
    await grantTrial(store, ws.id);
    const r = await (await set(token, { cadence: "weekly", weekday: 1, channel: "whatsapp", approveByText: true })).json();
    expect(r).toMatchObject({ ok: true, approveLocked: true, reminders: { cadence: "weekly", weekday: 1, channel: "whatsapp", approveByText: false } });
    const w = (await store.getWorkspaceById(ws.id))!; w.seenJobsAt = "2026-11-22"; await store.saveWorkspace(w);
    expect((await (await set(token, { cadence: "daily", channel: "imessage", approveByText: true })).json()).reminders.approveByText).toBe(true);
  });

  it("morning message: dashboard nudge by default, YES codes only with approve-by-text, silent when off or not their day", async () => {
    const { store, ws } = await team();
    await grantTrial(store, ws.id);
    const r = { account: "Habit Nest US", kinds: ["sp_search_term"], errors: [] };
    const send = async (now = new Date("2026-11-24T13:00:00Z")) => { const n = outbox().length; await tellTeam(store, (await store.getWorkspaceById(ws.id))!, r, now); return outbox().slice(n).map((m) => m.text).join("\n"); };
    const def = await send();
    expect(def).toMatch(/fixes? waiting, worth ~\$[\d,]+\/mo\. Approve them here: https:\/\/rocco\.works\/me/);
    expect(def).not.toMatch(/Reply YES/);
    const w = (await store.getWorkspaceById(ws.id))!;
    w.reminders = { cadence: "daily", approveByText: true, setAt: "x" }; await store.saveWorkspace(w);
    expect(await send()).toMatch(/Reply YES [A-Z]\d/);
    w.reminders = { cadence: "weekly", weekday: 1, approveByText: false, setAt: "x" }; await store.saveWorkspace(w);
    expect(await send(new Date("2026-11-25T13:00:00Z"))).toBe(""); // Wednesday
    expect(await send(new Date("2026-11-23T13:00:00Z"))).not.toBe(""); // Monday
    w.reminders = { cadence: "off", approveByText: false, setAt: "x" }; await store.saveWorkspace(w);
    expect(await send()).toBe("");
  });
});
