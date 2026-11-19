import { NextResponse } from "next/server";
import { clearSession } from "@/lib/session";
import { SITE } from "@/lib/site";

/** Sign out: forget the person and the team on this browser. POST only, so link prefetchers can't sign you out. */
export async function POST() {
  const res = NextResponse.redirect(`${SITE.url}/`, 303);
  clearSession(res);
  return res;
}
