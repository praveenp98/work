/**
 * Payments: Dodo Payments (merchant of record, works for individuals; revenue verifiable on TrustMRR).
 * Checkout = Dodo static payment links. Paid unlock = Dodo license keys, checked with the public
 * /licenses/validate endpoint (no API key needed).
 */
import { SITE } from "./site";

export type PlanId = "holiday" | "seller" | "pro" | "agency";

export const DODO_MODE: "live" | "test" = process.env.DODO_MODE === "test" ? "test" : "live";
const API_BASE = DODO_MODE === "test" ? "https://test.dodopayments.com" : "https://live.dodopayments.com";
const CHECKOUT_BASE = DODO_MODE === "test" ? "https://test.checkout.dodopayments.com" : "https://checkout.dodopayments.com";

/** Dodo product IDs (pdt_…), one per plan. Set in Vercel env; not secret. */
export const DODO_PRODUCTS: Record<PlanId, string | undefined> = {
  holiday: process.env.DODO_PRODUCT_HOLIDAY,
  seller: process.env.DODO_PRODUCT_SELLER,
  pro: process.env.DODO_PRODUCT_PRO,
  agency: process.env.DODO_PRODUCT_AGENCY,
};

/** Static payment link for a plan, or null until the product ID is configured. */
export function checkoutUrl(plan: PlanId, opts: { email?: string } = {}): string | null {
  const pid = DODO_PRODUCTS[plan];
  if (!pid || !/^pdt_[A-Za-z0-9]+$/.test(pid)) return null;
  const q = new URLSearchParams({ quantity: "1", redirect_url: `${SITE.url}/thanks?plan=${plan}` });
  if (opts.email) q.set("email", opts.email);
  return `${CHECKOUT_BASE}/buy/${pid}?${q.toString()}`;
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
