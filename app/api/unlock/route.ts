import { NextResponse } from "next/server";

/**
 * Validate a Polar license key for the paid unlock.
 * Polar issues license keys as a product benefit; this calls Polar's public validate endpoint.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const key = String(body?.key ?? "").trim();
  if (!key || key.length > 200) return NextResponse.json({ ok: false, error: "Paste the license key from your receipt email." }, { status: 400 });

  const org = process.env.POLAR_ORGANIZATION_ID;
  if (!org) return NextResponse.json({ ok: false, error: "Checkout isn't live yet. Join the list on the pricing page." }, { status: 503 });

  const res = await fetch("https://api.polar.sh/v1/customer-portal/license-keys/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, organization_id: org }),
  }).catch(() => null);
  if (!res) return NextResponse.json({ ok: false, error: "Couldn't reach the license server. Try again." }, { status: 502 });
  if (!res.ok) return NextResponse.json({ ok: false, error: "That key isn't valid. Check your receipt email or contact us." }, { status: 200 });
  const data = (await res.json().catch(() => ({}))) as { status?: string };
  if (data.status && data.status !== "granted") return NextResponse.json({ ok: false, error: "That key has been revoked or disabled." });
  return NextResponse.json({ ok: true });
}
