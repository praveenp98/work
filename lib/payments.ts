/**
 * Payments: Dodo Payments (merchant of record for individuals; revenue verifiable on TrustMRR).
 * One product, "Hire Rocco", sold on a price ladder (lib/pricing.ts).
 * - Checkout: Dodo static payment link.
 * - Unlock: Dodo license keys, checked with the public /licenses/validate endpoint.
 * - Ladder: count succeeded payments via the Dodo API (DODO_API_KEY, server only) and PATCH the product price.
 */
import { priceCentsForSold, stateFor, type PriceState } from "./pricing";
import { SITE } from "./site";

export const DODO_MODE: "live" | "test" = process.env.DODO_MODE === "test" ? "test" : "live";
const API_BASE = DODO_MODE === "test" ? "https://test.dodopayments.com" : "https://live.dodopayments.com";
const CHECKOUT_BASE = DODO_MODE === "test" ? "https://test.checkout.dodopayments.com" : "https://checkout.dodopayments.com";

/** The single live product (created Nov 17, 2026). Env overrides for test mode. */
export const PRODUCT_ID = process.env.DODO_PRODUCT_ID || (DODO_MODE === "live" ? "pdt_0Ns7dcv01gDgTlIQC1O1b" : undefined);

export function checkoutUrl(opts: { email?: string; ref?: string } = {}): string | null {
  if (!PRODUCT_ID || !/^pdt_[A-Za-z0-9]+$/.test(PRODUCT_ID)) return null;
  const q = new URLSearchParams({ quantity: "1", redirect_url: `${SITE.url}/thanks` });
  if (opts.email) q.set("email", opts.email);
  if (opts.ref) q.set("metadata_ref", opts.ref);
  return `${CHECKOUT_BASE}/buy/${PRODUCT_ID}?${q.toString()}`;
}

/** Server-only: validate a Rocco license key with Dodo. */
export async function validateLicenseKey(key: string): Promise<{ ok: boolean; error?: string; status: number }> {
  const k = key.trim();
  if (!k || k.length > 200) return { ok: false, error: "Paste the license key from your receipt email.", status: 400 };
  const res = await fetch(`${API_BASE}/licenses/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ license_key: k }),
    cache: "no-store",
  }).catch(() => null);
  if (!res) return { ok: false, error: "Couldn't reach the license server. Try again.", status: 502 };
  const data = (await res.json().catch(() => ({}))) as { valid?: boolean };
  if (res.ok && data.valid === true) return { ok: true, status: 200 };
  return { ok: false, error: "That key isn't valid (or has expired). Check your receipt email or contact us.", status: 200 };
}

interface DodoPayment { status?: string; product_cart?: { product_id: string; quantity?: number }[] | null }

/**
 * Server-only: look a payment up in Dodo (never trust a webhook body) and return the workspace it was bought for.
 * The ref comes from checkoutUrl({ ref }) → metadata_ref on the payment.
 */
export async function verifiedPurchase(paymentId: string): Promise<{ ref: string } | null> {
  const key = process.env.DODO_API_KEY;
  if (!key || !/^[A-Za-z0-9_-]{6,80}$/.test(paymentId)) return null;
  const res = await fetch(`${API_BASE}/payments/${paymentId}`, { headers: { Authorization: `Bearer ${key}` }, cache: "no-store" }).catch(() => null);
  if (!res?.ok) return null;
  const p = (await res.json().catch(() => null)) as (DodoPayment & { metadata?: Record<string, string> }) | null;
  if (!p || p.status !== "succeeded") return null;
  if (PRODUCT_ID && p.product_cart && !p.product_cart.some((c) => c.product_id === PRODUCT_ID)) return null;
  const ref = p.metadata?.ref;
  return ref && /^[A-Za-z0-9-]{6,64}$/.test(ref) ? { ref } : null;
}

/** Count succeeded payments for the product. Null when the API key isn't configured. */
export async function countSales(): Promise<number | null> {
  const key = process.env.DODO_API_KEY;
  if (!key || !PRODUCT_ID) return null;
  let sold = 0;
  for (let page = 0; page < 50; page++) {
    const res = await fetch(`${API_BASE}/payments?page_size=100&page_number=${page}&status=succeeded`, {
      headers: { Authorization: `Bearer ${key}` }, cache: "no-store",
    }).catch(() => null);
    if (!res?.ok) return page === 0 ? null : sold;
    const items = ((await res.json().catch(() => ({}))) as { items?: DodoPayment[] }).items ?? [];
    for (const p of items) {
      if (p.status && p.status !== "succeeded") continue;
      const line = p.product_cart?.find((c) => c.product_id === PRODUCT_ID);
      if (p.product_cart && !line) continue;
      sold += line?.quantity ?? 1;
    }
    if (items.length < 100) break;
  }
  return sold;
}

/** Make the live Dodo price match the ladder. Idempotent: safe to call on every page render or webhook. */
export async function syncPrice(sold: number): Promise<boolean> {
  const key = process.env.DODO_API_KEY;
  if (!key || !PRODUCT_ID) return false;
  const want = priceCentsForSold(sold);
  const cur = await fetch(`${API_BASE}/products/${PRODUCT_ID}`, { headers: { Authorization: `Bearer ${key}` }, cache: "no-store" }).catch(() => null);
  const have = cur?.ok ? ((await cur.json().catch(() => ({}))) as { price?: { price?: number } }).price?.price : undefined;
  if (have === want) return true;
  const res = await fetch(`${API_BASE}/products/${PRODUCT_ID}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ price: { type: "one_time_price", currency: "USD", price: want, discount: 0, purchasing_power_parity: false } }),
  }).catch(() => null);
  return !!res?.ok;
}

const g = globalThis as unknown as { __roccoPrice?: { at: number; state: PriceState } };

/** Current ladder state (cached 60s). Syncs the Dodo price when the count is known. */
export async function getPriceState(opts: { fresh?: boolean } = {}): Promise<PriceState> {
  if (!opts.fresh && g.__roccoPrice && Date.now() - g.__roccoPrice.at < 60_000) return g.__roccoPrice.state;
  const sold = await countSales();
  const state = stateFor(sold ?? 0, sold !== null);
  if (sold !== null) await syncPrice(sold);
  g.__roccoPrice = { at: Date.now(), state };
  return state;
}
