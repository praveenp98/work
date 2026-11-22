import { modeFor, regionFromRequest } from "@/lib/region";
import { NextResponse } from "next/server";
import { accessOf } from "@/lib/access";
import { hireUrl } from "@/lib/paywall";
import { googleUser } from "@/lib/google";
import { setSession, TEAM } from "@/lib/session";
import { teamForUser } from "@/lib/signin";
import { SITE } from "@/lib/site";
import { getStore } from "@/lib/store";
import { trackServer } from "@/lib/track-server";
import { unseal } from "@/lib/vault";

/**
 * Google sends the person back here. Verify the state, read the verified email, find or create their team, set the
 * session cookies. Pay at signup (like localseo.to): an unpaid team that tapped Hire goes straight to checkout, tagged with
 * their team; after paying, /welcome opens their page to connect Amazon. Plain sign-in opens their page.
 */
export const dynamic = "force-dynamic";

const back = (why: string) => NextResponse.redirect(`${SITE.url}/?signin=${why}`);

export async function GET(req: Request) {
  const u = new URL(req.url);
  const cookie = (name: string) => req.headers.get("cookie")?.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`))?.[1];
  let st: { i?: string; p?: string; n?: string; x?: number } = {};
  try { st = JSON.parse(unseal(u.searchParams.get("state") ?? "") ?? "{}"); } catch { /* bad state */ }
  if (!st.n || st.n !== cookie("rocco_gstate") || !st.x || st.x < Date.now()) return back("expired");
  const code = u.searchParams.get("code");
  if (!code) return back("cancelled");
  const user = await googleUser(code);
  if (!user) return back("failed");
  const store = getStore();
  if (!store) return back("off");

  const browserTeam = unseal(decodeURIComponent(cookie(TEAM) ?? ""));
  const { ws, token, created } = await teamForUser(store, user.email, browserTeam, user.name);
  trackServer(ws.id, created ? "signed_up" : "signed_in", { intent: st.i ?? "signin" });
  if (!ws.mode) { ws.mode = modeFor(regionFromRequest(req)); await store.saveWorkspace(ws); } // US: Claude; elsewhere: report inbox // prefilled at checkout
  const res = NextResponse.redirect(st.i === "hire" && accessOf(ws) === "none" && st.p ? hireUrl(ws, st.p === "monthly" ? "monthly" : "annual") : `${SITE.url}/w/${token}` /* no plan picked yet: the plan step */);
  setSession(res, { email: user.email, name: user.name, sub: user.sub }, token);
  res.cookies.set("rocco_gstate", "", { path: "/api/auth/google", maxAge: 0 });
  return res;
}
