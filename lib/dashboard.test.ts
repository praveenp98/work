import { describe, expect, it } from "vitest";
import { POST as approve } from "../app/api/w/approve/route";
import { setStoreForTests } from "./store";
import { MemoryStore } from "./store/memory";
import { loadFixture } from "./test-utils";
import { createWorkspace, runAnalysis } from "./workspace";

const post = (body: object) => approve(new Request("https://rocco.works/api/w/approve", { method: "POST", body: JSON.stringify(body) }));

describe("dashboard approvals", () => {
  it("approve queues like YES N1; locked fixes stay locked on free; cancel removes", async () => {
    const store = new MemoryStore();
    setStoreForTests(store);
    const { ws, token } = await createWorkspace(store);
    await runAnalysis(store, ws, "main", loadFixture("sp-search-term-report.csv"));
    const run = (await store.listRuns(ws.id, { limit: 1 }))[0];
    const [free, , , locked] = run.proposals.map((p) => p.code);

    const r = await (await post({ t: token, brand: "main", codes: [free, locked] })).json();
    expect(r).toMatchObject({ approved: [free], locked: [locked] });
    let saved = await store.getWorkspaceById(ws.id);
    expect(saved?.pending?.[0]).toMatchObject({ type: "apply", codes: [free], by: "dashboard" });

    expect((await (await post({ t: token, brand: "main", codes: [free] })).json()).approved).toEqual([]); // no double-queue

    await post({ t: token, brand: "main", codes: [free], cancel: true });
    saved = await store.getWorkspaceById(ws.id);
    expect(saved?.pending ?? []).toEqual([]);

    expect((await post({ t: "rw_nope", codes: [free] })).status).toBe(400);
  });
});
