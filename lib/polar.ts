/** Polar organization (not secret). Env var overrides for sandbox testing. */
export const POLAR_ORG_ID = process.env.POLAR_ORGANIZATION_ID || "1098166b-7605-4f08-aa7c-2800c1ca5d21";

/** License-key benefits in Polar. Holiday Pass keys stop working after Jan 31, 2027 (Pacific). */
export const BENEFIT_LIFETIME = "0b2ab254-2283-4d9a-a010-ee2c49b9ad88";
export const BENEFIT_HOLIDAY = "3ea385ab-8d46-4b97-a552-f14e5e8dae15";
export const HOLIDAY_PASS_ENDS = new Date("2027-02-01T08:00:00Z");

/** Server-only: validate a Polar license key. Returns ok/error text. */
export async function validatePolarKey(key: string): Promise<{ ok: boolean; error?: string; status: number }> {
  const k = key.trim();
  if (!k || k.length > 200) return { ok: false, error: "Paste the license key from your receipt email.", status: 400 };
  const org = POLAR_ORG_ID;
  if (!org) return { ok: false, error: "Checkout isn't live yet. Join the list at rocco.works/pricing.", status: 503 };
  const res = await fetch("https://api.polar.sh/v1/customer-portal/license-keys/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key: k, organization_id: org }),
  }).catch(() => null);
  if (!res) return { ok: false, error: "Couldn't reach the license server. Try again.", status: 502 };
  if (!res.ok) return { ok: false, error: "That key isn't valid. Check your receipt email or contact us.", status: 200 };
  const data = (await res.json().catch(() => ({}))) as { status?: string; benefit_id?: string };
  if (data.status && data.status !== "granted") return { ok: false, error: "That key has been revoked or disabled.", status: 200 };
  if (data.benefit_id === BENEFIT_HOLIDAY && Date.now() >= HOLIDAY_PASS_ENDS.getTime())
    return { ok: false, error: "Your Holiday Pass ended on Jan 31, 2027. Upgrade to a lifetime plan at rocco.works/pricing.", status: 200 };
  return { ok: true, status: 200 };
}
