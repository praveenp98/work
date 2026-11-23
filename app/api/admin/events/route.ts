import { NextResponse } from "next/server";
import { adminCookieFromHeader, adminCookieOk, eventsPersistent, recentEvents } from "@/lib/events";
import { adminOk } from "@/lib/security";

/** Owner-only: the newest funnel events, to check they arrive. GET /api/admin/events?limit=50 (admin key or /admin sign-in). */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!adminOk(req) && !adminCookieOk(adminCookieFromHeader(req.headers.get("cookie")))) return NextResponse.json({ ok: false }, { status: 401 });
  const limit = Number(new URL(req.url).searchParams.get("limit") ?? 50);
  return NextResponse.json({ ok: true, stored: eventsPersistent() ? "supabase" : "memory (no Supabase configured)", events: await recentEvents(limit) }, { headers: { "cache-control": "no-store" } });
}
