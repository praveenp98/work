import { describe, expect, it } from "vitest";
import { POST as approve } from "../app/api/w/approve/route";
import { setStoreForTests } from "./store";
import { MemoryStore } from "./store/memory";
import { grantTrial, loadFixture } from "./test-utils";
import { createWorkspace, runAnalysis } from "./workspace";

const post = (body: object) => approve(new Request("https://rocco.works/api/w/approve", { method: "POST", body: JSON.stringify(body) }));

describe("dashboard approvals", () => {
  it("no plan: every fix locked; with a trial: approve queues like YES N1, cancel removes", async () => {
    const store = new MemoryStore();
    setStoreForTests(store);
    const { ws, token } = await createWorkspace(store);
    await runAnalysis(store, ws, "main", loadFixture("sp-search-term-report.csv"));
    const run = (await store.listRuns(ws.id, { limit: 1 }))[0];
    const [first, second] = run.proposals.map((p) => p.code);

    expect(await (await post({ t: token, brand: "main", codes: [first, second] })).json()).toMatchObject({ approved: [], locked: [first, second] });
    await post({ t: token, brand: "main", codes: [first], cancel: true });

    await grantTrial(store, ws.id);
    const r = await (await post({ t: token, brand: "main", codes: [first, second] })).json();
    expect(r).toMatchObject({ approved: [first, second], locked: [] });
    let saved = await store.getWorkspaceById(ws.id);
    expect(saved?.pending?.[0]).toMatchObject({ type: "apply", codes: [first, second], by: "dashboard" });
    expect((await (await post({ t: token, brand: "main", codes: [first] })).json()).approved).toEqual([]); // no double-queue

    await post({ t: token, brand: "main", codes: [first, second], cancel: true });
    saved = await store.getWorkspaceById(ws.id);
    expect(saved?.pending ?? []).toEqual([]);
    expect((await post({ t: "rw_nope", codes: [first] })).status).toBe(400);
  });
});
