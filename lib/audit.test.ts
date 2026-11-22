import { describe, expect, it, vi } from "vitest";
import { respond } from "./text/handler";
import { MemoryStore } from "./store/memory";
import { createWorkspace, ensureLinkCode } from "./workspace";

describe("audit fixes (Nov 22)", () => {
  it("a license key no longer unlocks a team, even a valid one", async () => {
    vi.stubEnv("DODO_API_KEY", "k");
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ valid: true })));
    const store = new MemoryStore();
    const { ws } = await createWorkspace(store);
    const code = await ensureLinkCode(store, ws);
    await respond(store, "+14155550300", `link ${code}`);
    const r = await respond(store, "+14155550300", "activate ABCD-1234-EFGH");
    expect(r.bubbles.join(" ")).toMatch(/don't unlock Rocco anymore/);
    expect((await store.getWorkspaceById(ws.id))!.licensed).toBe(false);
  });

  it("CANCEL by text never cancels the plan (any linked phone could)", async () => {
    const store = new MemoryStore();
    const { ws } = await createWorkspace(store);
    ws.subscriptionId = "sub_123456"; await store.saveWorkspace(ws);
    const code = await ensureLinkCode(store, ws);
    await respond(store, "+14155550301", `link ${code}`);
    const fetchSpy = vi.fn(async (_u: string) => Response.json({}));
    vi.stubGlobal("fetch", fetchSpy);
    const r = await respond(store, "+14155550301", "cancel");
    expect(r.bubbles.join(" ")).toMatch(/receipt email|hello@rocco\.works/);
    expect(fetchSpy.mock.calls.some((c) => String(c[0]).includes("/subscriptions/"))).toBe(false);
  });
});
