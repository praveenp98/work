import { NextResponse } from "next/server";
import { ADMIN_COOKIE, adminCookieValue } from "@/lib/events";
import { clientIp } from "@/lib/human";
import { allowShared } from "@/lib/limits";
import { adminOk } from "@/lib/security";

/**
 * Owner sign-in for /admin pages: /admin/login?key=<CRON_SECRET>. Checks the secret, sets an httpOnly cookie for
 * 12 hours and redirects to /admin/funnel, so the secret never sits in the URL of a page.
 */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!(await allowShared(`admin-login:${clientIp(req.headers)}`, 10, 10 * 60_000))) return NextResponse.json({ ok: false }, { status: 429 });
  if (!adminOk(req)) return NextResponse.json({ ok: false }, { status: 401 });
  const res = NextResponse.redirect(new URL("/admin/funnel", req.url), 302);
  res.cookies.set(ADMIN_COOKIE, adminCookieValue(), { httpOnly: true, secure: true, sameSite: "strict", path: "/", maxAge: 12 * 3600 });
  res.headers.set("Referrer-Policy", "no-referrer");
  return res;
}
