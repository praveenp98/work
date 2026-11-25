import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { googleAuthUrl, googleOn } from "@/lib/google";
import { SITE } from "@/lib/site";
import { seal } from "@/lib/vault";

/**
 * Start "Continue with Google". intent=hire → after sign-in go straight to checkout (sign up → pay → set up).
 * intent=audit → start the free read-only audit (lib/free-audit.ts), then connect Amazon. intent=signin → open your Rocco. The state is sealed and bound to this browser by a short-lived nonce cookie.
 * Nothing is created until Google sends back a real, verified sign-in, so bots tapping this cost nothing.
 */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const u = new URL(req.url);
  const i = u.searchParams.get("intent");
  const intent = i === "hire" || i === "audit" ? i : "signin"; // audit: start the free read-only audit after sign-in
  if (!googleOn()) return NextResponse.redirect(`${SITE.url}/${intent === "hire" ? "pricing" : ""}?signin=off`);
  const n = randomBytes(16).toString("hex");
  const p = u.searchParams.get("plan");
  const plan = p === "monthly" || p === "annual" ? p : undefined; // none: the plan is picked after sign-up
  const state = seal(JSON.stringify({ i: intent, p: plan, n, x: Date.now() + 10 * 60_000 }));
  if (!state) return NextResponse.redirect(`${SITE.url}/?signin=off`);
  const res = NextResponse.redirect(googleAuthUrl(state));
  res.cookies.set("rocco_gstate", n, { httpOnly: true, secure: true, sameSite: "lax", path: "/api/auth/google", maxAge: 600 });
  return res;
}
