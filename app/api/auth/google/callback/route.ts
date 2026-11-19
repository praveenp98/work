import { NextResponse } from "next/server";
import { accessOf } from "@/lib/access";
import { googleUser } from "@/lib/google";
import { checkoutUrl } from "@/lib/payments";
import { setSession, TEAM } from "@/lib/session";
import { teamForUser } from "@/lib/signin";
import { SITE } from "@/lib/site";
import { getStore } from "@/lib/store";
import { unseal } from "@/lib/vault";

/**
 * Google sends the person back here. Verify the state, read the verified email, find or create their team, set the
 * session cookies. Then: hiring and not paid yet → checkout (prefilled, tagged with the team) → /welcome → setup.
 * Already paid, or just signing in → their Rocco page.
 */
export const dynamic = "force-dynamic";

const back = (why: string) => NextResponse.redirect(`${SITE.url}/?signin=${why}`);

export async function GET(req: Request) {
  const u = new URL(req.url);
  const cookie = (name: string) => req.headers.get("cookie")?.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`))?.[1];
  let st: { i?: string; n?: string; x?: number } = {};
  try { st = JSON.parse(unseal(u.searchParams.get("state") ?? "") ?? "{}"); } catch { /* bad state */ }
  if (!st.n || st.n !== cookie("rocco_gstate") || !st.x || st.x < Date.now()) return back("expired");
  const code = u.searchParams.get("code");
  if (!code) return back("cancelled");
  const user = await googleUser(code);
  if (!user) return back("failed");
  const store = getStore();
  if (!store) return back("off");

  const browserTeam = unseal(decodeURIComponent(cookie(TEAM) ?? ""));
  const { ws, token } = await teamForUser(store, user.email, browserTeam);
  const pay = st.i === "hire" && accessOf(ws) === "none" ? checkoutUrl({ ref: ws.id, email: user.email, redirect: `${SITE.url}/welcome` }) : null;
  const res = NextResponse.redirect(pay ?? `${SITE.url}/w/${token}`);
  setSession(res, { email: user.email, name: user.name, sub: user.sub }, token);
  res.cookies.set("rocco_gstate", "", { path: "/api/auth/google", maxAge: 0 });
  return res;
}
