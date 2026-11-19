/**
 * Sign in with Google (OpenID Connect, server-side code flow). Keys: GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET in Vercel.
 * Redirect URI registered in Google Cloud: {SITE.url}/api/auth/google/callback.
 * We only ask for the email + name (openid email profile). The code is exchanged server-side over TLS, and the
 * identity is read from Google's userinfo endpoint with that fresh access token (so no JWT parsing to get wrong).
 */
import { SITE } from "./site";

export const googleOn = () => !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
export const googleRedirect = () => `${SITE.url}/api/auth/google/callback`;

export function googleAuthUrl(state: string, loginHint?: string): string {
  const q = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? "",
    redirect_uri: googleRedirect(),
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });
  if (loginHint) q.set("login_hint", loginHint);
  return `https://accounts.google.com/o/oauth2/v2/auth?${q}`;
}

export interface GoogleUser { sub: string; email: string; name?: string }

/** Code → verified Google user, or null (bad code, unverified email, Google down). */
export async function googleUser(code: string): Promise<GoogleUser | null> {
  try {
    const tok = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ code, client_id: process.env.GOOGLE_CLIENT_ID ?? "", client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "", redirect_uri: googleRedirect(), grant_type: "authorization_code" }),
    });
    if (!tok.ok) return null;
    const { access_token } = (await tok.json()) as { access_token?: string };
    if (!access_token) return null;
    const me = await fetch("https://openidconnect.googleapis.com/v1/userinfo", { headers: { authorization: `Bearer ${access_token}` } });
    if (!me.ok) return null;
    const u = (await me.json()) as { sub?: string; email?: string; email_verified?: boolean; name?: string };
    if (!u.sub || !u.email || u.email_verified !== true) return null;
    return { sub: u.sub, email: u.email.toLowerCase(), name: u.name };
  } catch {
    return null;
  }
}
