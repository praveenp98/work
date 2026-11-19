/**
 * Who is signed in (Google) and which team this browser uses. Both live in sealed (AES-256-GCM) httpOnly cookies:
 *  - rocco_user: { email, name, sub } of the signed-in person
 *  - rocco_team: the team's workspace key (shared with the text links, the Claude connector page and /welcome)
 */
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { seal, unseal } from "./vault";

export const USER_COOKIE = "rocco_user";
export const TEAM = "rocco_team";
const opts = { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/", maxAge: 180 * 86_400 };

export interface SessionUser { email: string; name?: string; sub: string }

export function readUser(raw?: string): SessionUser | null {
  const s = unseal(raw);
  if (!s) return null;
  try {
    const u = JSON.parse(s) as SessionUser;
    return u.email && u.sub ? u : null;
  } catch {
    return null;
  }
}

export async function currentUser(): Promise<SessionUser | null> {
  return readUser((await cookies()).get(USER_COOKIE)?.value);
}

export function setSession(res: NextResponse, user: SessionUser | null, teamToken?: string) {
  if (user) { const v = seal(JSON.stringify(user)); if (v) res.cookies.set(USER_COOKIE, v, opts); }
  if (teamToken) { const v = seal(teamToken); if (v) res.cookies.set(TEAM, v, opts); }
  if (user) res.cookies.set("rocco_in", "1", { ...opts, httpOnly: false }); // not secret: only tells the nav to show "Your Rocco"
}

export function clearSession(res: NextResponse) {
  res.cookies.set(USER_COOKIE, "", { ...opts, maxAge: 0 });
  res.cookies.set(TEAM, "", { ...opts, maxAge: 0 });
  res.cookies.set("rocco_in", "", { ...opts, httpOnly: false, maxAge: 0 });
}
