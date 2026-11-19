import { NextResponse } from "next/server";
import { REGION_COOKIE } from "@/lib/region";
import { SITE } from "@/lib/site";

/** Switch versions: /api/region?r=intl (scheduled reports) or ?r=us (Claude). Remembered for 30 days. */
export function GET(req: Request) {
  const u = new URL(req.url);
  const r = u.searchParams.get("r") === "intl" ? "intl" : "us";
  const to = u.searchParams.get("to") ?? "/";
  const res = NextResponse.redirect(`${SITE.url}${to.startsWith("/") && !to.startsWith("//") ? to : "/"}`);
  res.cookies.set(REGION_COOKIE, r, { path: "/", maxAge: 30 * 86_400, sameSite: "lax", secure: true });
  return res;
}
