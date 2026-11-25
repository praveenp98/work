import { NextResponse, type NextRequest } from "next/server";
import { approvedPartner } from "@/lib/partner-db";
import { cleanCode, COOKIE_DAYS, cookieToSet, PARTNER_COOKIE, PARTNER_PARAM } from "@/lib/partners";
import { trackServer } from "@/lib/track-server";

/**
 * Partner referrals (lib/partners.ts, docs/PARTNERSHIPS.md). Runs only on /p/<code> and on pages opened with
 * ?partner=<code> (see the matcher), never on anything else.
 *  - Sets the first-party cookie rocco_partner for 60 days, only for an approved partner, and never replaces an
 *    existing one (first partner wins).
 *  - ?partner= links redirect to the same page without the parameter, so referral URLs never get indexed or shared
 *    onwards with the code in them. /p/<code> renders its own page (noindex, canonical to /).
 */
export async function proxy(req: NextRequest) {
  const url = req.nextUrl;
  const landing = url.pathname.startsWith("/p/");
  const incoming = landing ? url.pathname.split("/")[2] : url.searchParams.get(PARTNER_PARAM);
  const existing = req.cookies.get(PARTNER_COOKIE)?.value;
  const code = cleanCode(incoming);
  const approved = code ? !!(await approvedPartner(code).catch(() => null)) : false; // cached for a minute
  const set = cookieToSet(existing, code, approved);

  let res: NextResponse;
  if (landing) res = NextResponse.next();
  else {
    const clean = url.clone();
    clean.searchParams.delete(PARTNER_PARAM);
    res = NextResponse.redirect(clean, 307);
    res.headers.set("X-Robots-Tag", "noindex");
    if (code && approved) trackServer(`partner:${code}`, "partner_landing_viewed", { code, via: "link", path: url.pathname.slice(0, 120) });
  }
  if (set) res.cookies.set(PARTNER_COOKIE, set, { httpOnly: true, secure: url.protocol === "https:", sameSite: "lax", path: "/", maxAge: COOKIE_DAYS * 86_400 });
  return res;
}

export const config = {
  matcher: [
    "/p/:code",
    { source: "/((?!api/|_next/|ingest/|admin|w/|mcp/).*)", has: [{ type: "query", key: "partner" }] },
  ],
};
