import { afterEach, describe, expect, it, vi } from "vitest";
import { POST as restock } from "../app/api/w/restock/route";
import { checkItems, checkShipFrom, explain, planBody, type ShipFrom } from "./restock";
import { analyzeStock } from "./rules/stock";
import { setStoreForTests } from "./store";
import { MemoryStore } from "./store/memory";
import { grantTrial } from "./test-utils";
import { createWorkspace } from "./workspace";

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

const FROM: ShipFrom = { name: "Sam", addressLine1: "1 Main St", city: "Austin", stateOrProvinceCode: "TX", postalCode: "78701", countryCode: "US", phoneNumber: "+1 512 555 0100", labelOwner: "SELLER", prepOwner: "NONE" };

describe("restock rules", () => {
  it("suggests ~60 days of cover minus stock on hand, rounded up to 5", () => {
    const a = analyzeStock([{ sku: "SKU-1", asin: "B1", name: "Gym Journal: long title", available: 10, inbound: 0, sold30: 60, daysOfSupply: -1 }]);
    const f = a.findings.find((x) => x.restock)!;
    expect(f.restock).toEqual({ sku: "SKU-1", asin: "B1", available: 10, daily: 2, suggest: 110 }); // 2/day × 60 − 10 = 110
    expect(f.title).toMatch(/^Gym Journal: ~5 days of stock left/);
  });

  it("validates the ship-from address and quantities", () => {
    expect(checkShipFrom({ ...FROM, stateOrProvinceCode: "" }).ok).toBe(false); // US needs a state
    expect(checkShipFrom({ ...FROM, phoneNumber: "abc" }).ok).toBe(false);
    expect(checkShipFrom(FROM).ok).toBe(true);
    expect(checkItems([{ sku: "A", qty: 0 }]).ok).toBe(false);
    expect(checkItems([{ sku: "A", qty: 20000 }]).ok).toBe(false);
    expect(checkItems([{ sku: "A", qty: 12.7 }, { sku: "A", qty: 5 }, { sku: "B", qty: 0 }])).toEqual({ ok: true, value: [{ sku: "A", qty: 12 }] });
  });

  it("builds Amazon's createInboundPlan body for the marketplace", () => {
    const b = planBody("US", FROM, [{ sku: "A", qty: 12 }], "Rocco restock Nov 23").body;
    expect(b.destinationMarketplaces).toEqual(["ATVPDKIKX0DER"]);
    expect(b.items).toEqual([{ msku: "A", quantity: 12, labelOwner: "SELLER", prepOwner: "NONE" }]);
    expect(b.sourceAddress).toMatchObject({ city: "Austin", stateOrProvinceCode: "TX", countryCode: "US" });
  });

  it("turns Amazon errors into something a seller can act on", () => {
    expect(explain("403 missing Amazon Fulfillment role")).toMatch(/Read and write/);
    expect(explain("Action type AMAZON_FBA_INBOUND_PLANS_ADD is disabled")).toMatch(/Settings → Actions/);
    expect(explain("prepDetails missing for msku")).toMatch(/prep details/);
  });
});

describe("POST /api/w/restock", () => {
  it("saves the address, dry-runs then creates the plan once, blocks a duplicate, and can cancel it", async () => {
    vi.stubEnv("DATADOE_API_KEY", "k");
    const sent: { dryRun?: boolean; type: string; key?: string }[] = [];
    vi.stubGlobal("fetch", vi.fn(async (u: string, init?: RequestInit) => {
      if (String(u).endsWith("/actions") && init?.method === "POST") {
        const b = JSON.parse(String(init.body)); sent.push({ dryRun: b.dryRun, type: b.type, key: b.idempotencyKey });
        return Response.json(b.dryRun ? { status: "VALIDATED" } : { id: `act-${sent.length}`, status: "RUNNING" });
      }
      if (/\/actions\/act-/.test(String(u))) return Response.json({ status: "COMPLETED", result: { response: { inboundPlanId: "wf-123", operationId: "op-1" } } });
      return Response.json({}, { status: 404 });
    }));
    const store = new MemoryStore(); setStoreForTests(store);
    const { ws, token } = await createWorkspace(store);
    const fresh = (await store.getWorkspaceById(ws.id))!;
    fresh.amazon = { accounts: [{ id: "acct-1", name: "Habit Nest US", country: "US", connectedAt: new Date().toISOString() }] };
    await store.saveWorkspace(fresh);
    await grantTrial(store, ws.id);
    const call = async (body: object) => (await restock(new Request("https://rocco.works/api/w/restock", { method: "POST", body: JSON.stringify({ t: token, ...body }) }))).json();

    expect(await call({ items: [{ sku: "SKU-1", qty: 110 }] })).toMatchObject({ ok: false, needAddress: true });
    const r = await call({ address: FROM, items: [{ sku: "SKU-1", qty: 110 }] });
    expect(r).toMatchObject({ ok: true, restock: { status: "created", planId: "wf-123", items: [{ sku: "SKU-1", qty: 110 }] }, next: "https://sellercentral.amazon.com/fba/sendtoamazon" });
    expect(sent.map((s) => [s.type, !!s.dryRun])).toEqual([["AMAZON_FBA_INBOUND_PLANS_ADD", true], ["AMAZON_FBA_INBOUND_PLANS_ADD", false]]);
    expect(sent[1].key).toMatch(/^rocco:.+:restock:SKU-1x110/);

    expect(await call({ items: [{ sku: "SKU-1", qty: 50 }] })).toMatchObject({ ok: false, error: expect.stringMatching(/already a plan/) });

    const c = await call({ cancel: r.restock.id });
    expect(c).toMatchObject({ ok: true, restock: { status: "cancelled" } });
    expect(sent.at(-1)!.type).toBe("AMAZON_FBA_INBOUND_PLANS_CANCEL");
  }, 20_000);
});
