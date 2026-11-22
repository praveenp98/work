import { afterEach, describe, expect, it, vi } from "vitest";
import { POST as ask } from "../app/api/w/ask/route";
import { POST as skip } from "../app/api/w/skip/route";
import { allowedNumbers, basisOf, checkPlan, refreshManager } from "./manager";
import { accountMemory, applyTuning, memoryText, priorsFrom, tuning } from "./memory";
import type { Proposal } from "./rules/types";
import { setStoreForTests } from "./store";
import { MemoryStore } from "./store/memory";
import type { Action, Skip } from "./store/types";
import { grantTrial, loadFixture } from "./test-utils";
import { buildBrief, createWorkspace, runAnalysis } from "./workspace";

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

const P = (code: string, kind: Proposal["kind"], value: number, target = "gift for mom"): Proposal =>
  ({ code, kind, campaign: "SP Journals", adGroup: "ag", target, reason: `Spent $${value} with 0 orders (90% sure)`, valueMonthly: value, undo: "" });
const act = (kind: Proposal["kind"], status: Action["status"]): Action =>
  ({ id: Math.random().toString(36), workspaceId: "w", brand: "main", runId: "r", code: "N1", proposal: P("N1", kind, 10), appliedAt: "2026-11-01", followUpAt: "2026-11-08", status });

/** Fake Anthropic: returns `json` as the structured output text. */
function stubClaude(json: unknown, text?: string) {
  const seen: Record<string, unknown>[] = [];
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    if (!url.includes("api.anthropic.com")) return new Response("nope", { status: 404 });
    seen.push(JSON.parse(String(init?.body ?? (input instanceof Request ? await input.clone().text() : "{}"))));
    return Response.json({ id: "msg_1", type: "message", role: "assistant", model: "claude-opus-5-5", stop_reason: "end_turn", stop_sequence: null, content: [{ type: "text", text: text ?? JSON.stringify(json) }], usage: { input_tokens: 10, output_tokens: 5 } });
  }));
  return seen;
}

describe("Rocco learns the account (memory + tuning)", () => {
  it("counts approvals, skips and results per fix type, and only tunes after 3+ signals", () => {
    const skips: Skip[] = [1, 2, 3].map((i) => ({ code: `B${i}`, kind: "bid", target: "x", value: 10 * i, at: "2026-11-20" }));
    const mem = accountMemory([act("negative", "worked"), act("negative", "applied"), act("harvest", "worse"), act("harvest", "no_effect"), act("harvest", "reverted")], skips);
    expect(mem.negative).toEqual({ approved: 2, skipped: 0, worked: 1, failed: 0 });
    expect(mem.bid).toEqual({ approved: 0, skipped: 3, worked: 0, failed: 0 });
    const t = tuning(mem, skips);
    expect(t.harvest?.hold).toBe(true); // 3 failures, no wins → held back
    expect(t.bid?.minValue).toBe(40); // skipped small bids → only show ones 2× the median skipped value
    expect(t.negative).toBeUndefined();
    const { shown, held } = applyTuning([P("B9", "bid", 30), P("B8", "bid", 55), P("H1", "harvest", 500), P("N2", "negative", 5)], t);
    expect(shown.map((p) => p.code)).toEqual(["B8", "N2"]);
    expect(held).toBe(2);
    expect(memoryText(mem, t)).toMatch(/bid: approved 0, skipped 3.*only bigger ones show/);
  });

  it("cross-account priors are counts per fix type, and only with 3+ accounts", () => {
    expect(priorsFrom([[act("negative", "worked")], [act("negative", "worse")]])).toEqual({});
    const p = priorsFrom([[act("negative", "worked")], [act("negative", "worked"), act("negative", "applied")], [act("negative", "no_effect")]]);
    expect(p).toEqual({ negative: { worked: 2, measured: 3, accounts: 3 } });
  });
});

describe("the senior manager can't invent codes or money (checkPlan)", () => {
  const ps = [P("N1", "negative", 82), P("N2", "negative", 41, "free journal"), P("B1", "bid", 12)];
  const input = "Ad spend 2631.45, ACoS 20%\nN1 | negative | gift for mom | ~$82/mo\nN2 | ~$41/mo\nB1 | ~$12/mo";

  it("keeps real codes once, drops unknown ones, caps at 5, and rejects sentences with made-up numbers", () => {
    const v = checkPlan({
      brief: "Spend is $2,631 at 20% ACoS; two gift searches burn $123 a month.", // 123 = a computed total → rejected
      picks: [
        { codes: ["n1", "N2", "X9"], title: "Stop paying for gift searches", why: "These two searches cost $82 and $41 a month with no orders!" },
        { codes: ["N1", "B1"], title: "Raise bid 15%", why: "Wins 35% more clicks." }, // N1 reused, 15/35 invented
      ],
    }, ps, input);
    expect(v.brief).toBeNull();
    expect(v.picks).toHaveLength(2);
    expect(v.picks[0]).toEqual({ codes: ["N1", "N2"], title: "Stop paying for gift searches", why: "These two searches cost $82 and $41 a month with no orders." });
    expect(v.picks[1]).toMatchObject({ codes: ["B1"], title: "Adjust a bid", why: ps[2].reason });
    expect(v.basis).toBe(basisOf(ps));
    expect(allowedNumbers(input).has("2631")).toBe(true); // rounded forms of real numbers are fine
  });
});

describe("manager pass, skips and Ask Rocco end to end", () => {
  async function team() {
    const store = new MemoryStore(); setStoreForTests(store);
    const { ws, token } = await createWorkspace(store);
    await runAnalysis(store, ws, "main", loadFixture("sp-search-term-report.csv"));
    return { store, ws, token };
  }

  it("refreshManager stores Claude's picks for paying teams only, and reruns only when the fixes change", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "sk-test");
    const { store, ws } = await team();
    const open = (await (async () => { await grantTrial(store, ws.id); return buildBrief(store, (await store.getWorkspaceById(ws.id))!); })()).perBrand[0].open;
    const [a, b] = open.map((p) => p.code);
    const seen = stubClaude({ brief: "Two searches are wasting money with no orders.", picks: [{ codes: [a, b], title: "Cut two money-burners", why: "Neither has sold after real spend." }] });
    expect(await refreshManager(store, ws.id)).toBe(1);
    const saved = (await store.getWorkspaceById(ws.id))!.manager!.main;
    expect(saved).toMatchObject({ brief: "Two searches are wasting money with no orders.", picks: [{ codes: [a, b], title: "Cut two money-burners" }] });
    expect(seen[0]).toMatchObject({ model: "claude-opus-5-5", fallbacks: "default", output_config: { effort: "medium", format: { type: "json_schema" } } });
    expect(JSON.stringify(seen[0])).toMatch(/Today's fixes \(code \| type/);
    expect(await refreshManager(store, ws.id)).toBe(0); // same fixes → no new call
    expect(seen).toHaveLength(1);

    const unpaid = await team();
    expect(await refreshManager(unpaid.store, unpaid.ws.id)).toBe(0);
  });

  it("Skip is remembered with the fix type and value; Ask needs a plan and answers from the account", async () => {
    const { store, ws, token } = await team();
    const code = (await store.listRuns(ws.id, { limit: 1 }))[0].proposals[0].code;
    const post = (fn: typeof skip, body: object) => fn(new Request("https://rocco.works/x", { method: "POST", body: JSON.stringify(body) }));
    expect(await (await post(skip, { t: token, codes: [code] })).json()).toMatchObject({ skipped: [code] });
    expect((await store.getWorkspaceById(ws.id))!.skips![0]).toMatchObject({ code, kind: "negative" });

    vi.stubEnv("ANTHROPIC_API_KEY", "sk-test");
    expect((await post(ask, { t: token, q: "what first?" })).status).toBe(402);
    await grantTrial(store, ws.id);
    const seen = stubClaude(null, `Start with ${code}: it has spent with no orders.`);
    const r = await (await post(ask, { t: token, q: "what first?" })).json();
    expect(r.answer).toMatch(new RegExp(`Start with ${code}`));
    expect(JSON.stringify(seen[0])).toMatch(/Their question:\\nwhat first\?/);
    expect(JSON.stringify(seen[0])).toMatch(/skipped 1/);
  });
});
