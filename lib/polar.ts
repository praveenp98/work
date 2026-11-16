/** Server-only: validate a Polar license key. Returns ok/error text. */
export async function validatePolarKey(key: string): Promise<{ ok: boolean; error?: string; status: number }> {
  const k = key.trim();
  if (!k || k.length > 200) return { ok: false, error: "Paste the license key from your receipt email.", status: 400 };
  const org = process.env.POLAR_ORGANIZATION_ID;
  if (!org) return { ok: false, error: "Checkout isn't live yet. Join the list at rocco.works/pricing.", status: 503 };
  const res = await fetch("https://api.polar.sh/v1/customer-portal/license-keys/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key: k, organization_id: org }),
  }).catch(() => null);
  if (!res) return { ok: false, error: "Couldn't reach the license server. Try again.", status: 502 };
  if (!res.ok) return { ok: false, error: "That key isn't valid. Check your receipt email or contact us.", status: 200 };
  const data = (await res.json().catch(() => ({}))) as { status?: string };
  if (data.status && data.status !== "granted") return { ok: false, error: "That key has been revoked or disabled.", status: 200 };
  return { ok: true, status: 200 };
}
