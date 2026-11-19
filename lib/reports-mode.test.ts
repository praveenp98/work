import { afterEach, describe, expect, it, vi } from "vitest";
import { POST as applied } from "../app/api/w/applied/route";
import { howTo } from "./howto";
import { regionOf } from "./region";
import { setStoreForTests } from "./store";
import { MemoryStore } from "./store/memory";
import { grantTrial, loadFixture } from "./test-utils";
import { respond } from "./text/handler";
import { createWorkspace, ensureLinkCode, runAnalysis } from "./workspace";

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("US vs everywhere else", () => {
  it("US visitors get Claude, everyone else the report inbox; the cookie overrides", () => {
    expect(regionOf(new Headers({ "x-vercel-ip-country": "US" }))).toBe("us");
    expect(regionOf(new Headers({ "x-vercel-ip-country": "IN" }))).toBe("intl");
    expect(regionOf(new Headers({ "x-vercel-ip-country": "IN" }), "us")).toBe("us");
    expect(regionOf(new Headers())).toBe("us");
  });
});

describe("report-inbox teams make approved changes by hand", () => {
  async function team() {
    vi.stubEnv("DODO_API_KEY", "");
    const store = new MemoryStore();
    setStoreForTests(store);
    const { ws, token } = await createWorkspace(store);
    ws.mode = "reports";
    await store.saveWorkspace(ws);
    await runAnalysis(store, ws, "main", loadFixture("sp-search-term-report.csv"));
    await grantTrial(store, ws.id);
    return { store, ws: (await store.getWorkspaceById(ws.id))!, token };
  }

  it("each fix comes with exact Ads console steps", async () => {
    const { store, ws } = await team();
    const p = (await store.listRuns(ws.id, { limit: 1 }))[0].proposals.find((x) => x.kind === "negative")!;
    expect(howTo(p)).toMatch(new RegExp(`Campaign Manager → “${p.campaign}” → ad group “${p.adGroup}” → Negative targeting → Add “${p.target}”`));
  });

  it("texting YES gets the steps (no Claude link); DONE logs it for next week's check", async () => {
    const { store, ws } = await team();
    await respond(store, "+14155550777", `link ${await ensureLinkCode(store, ws)}`);
    const yes = await respond(store, "+14155550777", "yes N1");
    expect(yes.bubbles.join("\n")).toMatch(/Make it in the Ads console/);
    expect(yes.bubbles.join("\n")).toMatch(/N1: Campaign Manager →/);
    expect(yes.bubbles.join("\n")).not.toMatch(/claude\.ai/);
    const done = await respond(store, "+14155550777", "done N1");
    expect(done.bubbles[0]).toMatch(/Logged ✅ N1/);
    expect((await store.listActions(ws.id))[0]).toMatchObject({ code: "N1", status: "applied" });
  });

  it("the dashboard's “I've made these changes” logs them too", async () => {
    const { store, ws, token } = await team();
    const r = await applied(new Request("https://rocco.works/api/w/applied", { method: "POST", body: JSON.stringify({ t: token, brand: "main", codes: ["N1", "N2"] }) }));
    expect(await r.json()).toMatchObject({ ok: true, logged: ["N1", "N2"] });
    expect(await store.listActions(ws.id)).toHaveLength(2);
  });
});
