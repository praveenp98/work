import { NextResponse } from "next/server";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = String(body?.email ?? "").trim().toLowerCase();
  const source = String(body?.source ?? "site").slice(0, 60);
  if (!EMAIL.test(email) || email.length > 200) return NextResponse.json({ ok: false, error: "Invalid email" }, { status: 400 });

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.warn("[waitlist] Supabase not configured; dropping signup from", source);
    return NextResponse.json({ ok: false, error: "Waitlist not configured" }, { status: 503 });
  }
  const res = await fetch(`${url}/rest/v1/waitlist`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "resolution=ignore-duplicates,return=minimal" },
    body: JSON.stringify({ email, source }),
  });
  if (!res.ok) {
    console.error("[waitlist] insert failed", res.status, await res.text().catch(() => ""));
    return NextResponse.json({ ok: false }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
