import { findId, runAction } from "./datadoe";

/**
 * One-tap restock: Rocco creates the FBA inbound plan in Amazon (DataDoe Action AMAZON_FBA_INBOUND_PLANS_ADD,
 * Amazon Fulfillment Inbound 2024-03-20). The seller then finishes boxes, carrier and labels in Seller Central's
 * Send to Amazon, because those steps need physical facts (carton sizes, weights, pickup) and commit fees.
 *
 * Creating a plan costs nothing on Amazon's side and can be cancelled (AMAZON_FBA_INBOUND_PLANS_CANCEL) until a
 * shipment is confirmed. DataDoe: 0.3 AI Token per write Action, 0.1 per read.
 * Docs: datadoe.com/hub/docs/datadoe-actions/fba-inbound · docs/RESTOCK.md (edge cases).
 */

export const MARKETPLACE: Record<string, string> = {
  US: "ATVPDKIKX0DER", CA: "A2EUQ1WTGCTBG2", MX: "A1AM78C64UM0Y8",
  UK: "A1F83G8C2ARO7P", GB: "A1F83G8C2ARO7P", DE: "A1PA6795UKMFR9", FR: "A13V1IB3VIYZZH", IT: "APJ6JRA9NG5V4", ES: "A1RKKUPIHCS9HS",
  NL: "A1805IZSGTT6HS", SE: "A2NODRKZP88ZB9", PL: "A1C3SOZRARQ6R3", BE: "AMEN7PMS3EDWL", TR: "A33AVAJ2PDY3EV", IE: "A28R8C7NBKEWEA",
  IN: "A21TJRUUN4KGV", JP: "A1VC38T7YXB528", AU: "A39IBJ37TRP1C6", SG: "A19VAU5U5O7RUS",
  AE: "A2VIGQ35RCS4UG", SA: "A17E79C6D8DWNP", EG: "ARBP9OOSHTCHU", ZA: "AE08WJ6YKNBMC",
};
// Brazil: DataDoe doesn't support creating inbound plans there.

const SC: Record<string, string> = {
  US: "sellercentral.amazon.com", CA: "sellercentral.amazon.ca", MX: "sellercentral.amazon.com.mx", UK: "sellercentral.amazon.co.uk", GB: "sellercentral.amazon.co.uk",
  IN: "sellercentral.amazon.in", JP: "sellercentral.amazon.co.jp", AU: "sellercentral.amazon.com.au", SG: "sellercentral.amazon.sg", AE: "sellercentral.amazon.ae",
  SA: "sellercentral.amazon.sa", EG: "sellercentral.amazon.eg", TR: "sellercentral.amazon.com.tr", ZA: "sellercentral.amazon.co.za",
};
/** Send to Amazon, where the seller finishes the plan (EU marketplaces share one Seller Central). */
export const sendToAmazonUrl = (country: string) => `https://${SC[country.toUpperCase()] ?? "sellercentral-europe.amazon.com"}/fba/sendtoamazon`;

export const canRestock = (country?: string) => !!country && !!MARKETPLACE[country.toUpperCase()];

export type Owner = "SELLER" | "AMAZON" | "NONE";
export interface ShipFrom {
  name: string; addressLine1: string; addressLine2?: string; city: string; stateOrProvinceCode?: string;
  postalCode: string; countryCode: string; phoneNumber: string; companyName?: string;
  /** Who puts the FNSKU barcode on each unit (NONE = manufacturer barcode). Who preps (bags, bubble wrap). */
  labelOwner: Owner; prepOwner: Owner;
}
export interface RestockItem { sku: string; qty: number }

const clean = (s: unknown, max = 120) => String(s ?? "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, max);
const OWNERS: Owner[] = ["SELLER", "AMAZON", "NONE"];

/** Validate and normalise a ship-from address. Returns the address or a plain-English problem. */
export function checkShipFrom(a: Partial<ShipFrom> | undefined): { ok: true; value: ShipFrom } | { ok: false; error: string } {
  if (!a) return { ok: false, error: "Add the address you ship from." };
  const v: ShipFrom = {
    name: clean(a.name, 50), addressLine1: clean(a.addressLine1, 180), addressLine2: clean(a.addressLine2, 60) || undefined, city: clean(a.city, 30),
    stateOrProvinceCode: clean(a.stateOrProvinceCode, 30) || undefined, postalCode: clean(a.postalCode, 32), countryCode: clean(a.countryCode, 2).toUpperCase(),
    phoneNumber: clean(a.phoneNumber, 20), companyName: clean(a.companyName, 50) || undefined,
    labelOwner: OWNERS.includes(a.labelOwner as Owner) ? (a.labelOwner as Owner) : "SELLER",
    prepOwner: OWNERS.includes(a.prepOwner as Owner) ? (a.prepOwner as Owner) : "NONE",
  };
  const missing = (["name", "addressLine1", "city", "postalCode", "countryCode", "phoneNumber"] as const).filter((k) => !v[k]);
  if (missing.length) return { ok: false, error: `Missing: ${missing.join(", ")}.` };
  if (!/^[A-Z]{2}$/.test(v.countryCode)) return { ok: false, error: "Country must be a 2-letter code, like US or IN." };
  if (["US", "CA", "IN", "AU", "MX"].includes(v.countryCode) && !v.stateOrProvinceCode) return { ok: false, error: "Add the state / province." };
  if (!/^\+?[\d\s().-]{7,20}$/.test(v.phoneNumber)) return { ok: false, error: "Phone number looks wrong." };
  return { ok: true, value: v };
}

/** Units, sane: whole numbers 1–10,000 per SKU, at most 200 SKUs, no duplicates. */
export function checkItems(items: unknown): { ok: true; value: RestockItem[] } | { ok: false; error: string } {
  if (!Array.isArray(items) || !items.length) return { ok: false, error: "Pick at least one product." };
  const seen = new Set<string>();
  const out: RestockItem[] = [];
  for (const it of items.slice(0, 200) as { sku?: unknown; qty?: unknown }[]) {
    const sku = clean(it?.sku, 40);
    const qty = Math.floor(Number(it?.qty));
    if (!sku || seen.has(sku)) continue;
    if (!Number.isFinite(qty) || qty < 1) continue; // 0 = skip this SKU
    if (qty > 10_000) return { ok: false, error: `${sku}: ${qty} units is more than one plan should carry. Lower it or split it in Seller Central.` };
    seen.add(sku); out.push({ sku, qty });
  }
  return out.length ? { ok: true, value: out } : { ok: false, error: "Set a quantity above 0 for at least one product." };
}

/** The createInboundPlan body DataDoe forwards to Amazon. */
export function planBody(country: string, from: ShipFrom, items: RestockItem[], name: string) {
  return {
    body: {
      name: name.slice(0, 40),
      destinationMarketplaces: [MARKETPLACE[country.toUpperCase()]],
      items: items.map((i) => ({ msku: i.sku, quantity: i.qty, labelOwner: from.labelOwner, prepOwner: from.prepOwner })),
      sourceAddress: {
        name: from.name, addressLine1: from.addressLine1, ...(from.addressLine2 ? { addressLine2: from.addressLine2 } : {}), city: from.city,
        ...(from.stateOrProvinceCode ? { stateOrProvinceCode: from.stateOrProvinceCode } : {}), postalCode: from.postalCode,
        countryCode: from.countryCode, phoneNumber: from.phoneNumber, ...(from.companyName ? { companyName: from.companyName } : {}),
      },
    },
  };
}

/** Amazon's error messages, shortened into something a seller can act on. */
export function explain(err: string): string {
  if (/role|authori[sz]|403|unauthori/i.test(err)) return "Amazon didn't let me create shipments for this account. In DataDoe, check the account has Read and write access and the FBA inbound Actions are on; you may need to reconnect Amazon.";
  if (/not enabled|disabled|action type/i.test(err)) return "Shipment plans aren't switched on yet for Rocco. (Owner: DataDoe → Settings → Actions → enable the FBA inbound Actions.)";
  if (/prep/i.test(err)) return "Amazon needs prep details for some of these products first (Seller Central → product → Prep). Then try again.";
  if (/expir/i.test(err)) return "A product with expiry dates needs its own plan with dates. Create that one in Seller Central.";
  if (/hazmat|dangerous|restrict|eligib/i.test(err)) return "Amazon won't accept one of these products into FBA right now (restricted or dangerous goods). Check it in Seller Central.";
  if (/token|spending limit|credit/i.test(err)) return "Rocco's Amazon connection is out of credits for today. Try again in a bit.";
  return `Amazon said no: ${err.slice(0, 200)}`;
}

export type CreateResult =
  | { ok: true; planId?: string; actionId: string; pending: boolean }
  | { ok: false; error: string };

/**
 * Dry run (free: checks fields and permissions), then the live write with an idempotency key so a double tap or a
 * retry can't create two plans. Never retried automatically after an uncertain result (DataDoe's guidance).
 */
export async function createPlan(accountId: string, country: string, from: ShipFrom, items: RestockItem[], key: string, name: string, wait: (id: string) => Promise<{ status: string; result?: unknown; error?: unknown } | null>): Promise<CreateResult> {
  if (!canRestock(country)) return { ok: false, error: "Rocco can't create shipment plans in this marketplace yet. Use Send to Amazon in Seller Central." };
  const details = planBody(country, from, items, name);
  const dry = await runAction(accountId, "AMAZON_FBA_INBOUND_PLANS_ADD", details, { dryRun: true });
  if (!dry.ok) return { ok: false, error: explain(dry.error ?? "") };
  const live = await runAction(accountId, "AMAZON_FBA_INBOUND_PLANS_ADD", details, { idempotencyKey: key });
  if (!live.ok || !live.id) return { ok: false, error: explain(live.error ?? "no action id") };
  const done = await wait(live.id);
  if (!done) return { ok: true, actionId: live.id, pending: true }; // Amazon still working: check later, never resend
  if (/FAIL|ERROR|REJECT/i.test(done.status)) return { ok: false, error: explain(JSON.stringify(done.error ?? done.result ?? done.status)) };
  return { ok: true, actionId: live.id, planId: findId(done.result, "inboundPlanId"), pending: false };
}
