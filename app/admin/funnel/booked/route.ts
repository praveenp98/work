import { NextResponse } from "next/server";
import { adminCookieFromHeader, adminCookieOk, recordEvent } from "@/lib/events";

/** Owner-only: log a booked call by hand (there is no booking tool wired in). Form on /admin/funnel posts here. */
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!adminCookieOk(adminCookieFromHeader(req.headers.get("cookie")))) return NextResponse.json({ ok: false }, { status: 401 });
  const form = await req.formData().catch(() => null);
  const source = String(form?.get("source") ?? "").trim().toLowerCase().replace(/[^a-z0-9._-]+/g, "-").slice(0, 80);
  await recordEvent({ event: "call_booked", utm_source: source || null, path: null, props: {} });
  return NextResponse.redirect(new URL("/admin/funnel?logged=1", req.url), 303);
}
