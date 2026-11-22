/**
 * Every error and waiting message a person can hit, in one place, written for a busy seller: what happened, whether
 * anything changed, and the one thing to do next. No raw codes on screen (they go to the logs).
 */
export function amazonNote(code?: string | null): string | undefined {
  if (!code) return undefined;
  const c = decodeURIComponent(code);
  if (c === "connected") return "🔌 Connected. I'm reading your account now: your first fixes usually show up here within a few minutes.";
  if (c === "unknown") return "That Amazon link was already used or opened in another browser. Tap Connect Amazon for a fresh one.";
  if (c === "not_found") return "Amazon connected, but your account isn't showing on my side yet. Give it a minute, then tap Connect Amazon again.";
  if (/PERMISSION|ROLE|NOT_PRIMARY|UNAUTHORIZED/i.test(c)) return "That Amazon login doesn't have full permissions on the account. Sign in as the Seller Central primary user (or a user with all permissions) and try again.";
  if (/CANCEL|DENIED|ABORT/i.test(c)) return "You closed Amazon's sign-in before it finished. Nothing changed. Tap Connect Amazon when you're ready.";
  if (/EXPIRED/i.test(c)) return "That link expired. Tap Connect Amazon for a fresh one.";
  if (/ADS/i.test(c)) return "Seller Central connected, but Amazon Ads didn't. Tap Connect Amazon again and pick your Ads account on the second step.";
  return "Amazon stopped before it finished. Nothing changed. Try again signed in as the account's primary user; if it keeps happening, email hello@rocco.works.";
}

export const SIGNIN: Record<string, string> = {
  expired: "Your sign-in took too long or was opened in another tab. Tap Sign in again.",
  cancelled: "Google sign-in was cancelled. Nothing was created. Tap Sign in when you're ready.",
  failed: "Google didn't confirm your email. Try again, or use another Google account.",
  off: "Sign-in is being set up right now. Please try again in a few minutes.",
};

export const WAIT = {
  firstLoadSlow: "Taking longer than usual: Amazon sends a first-time history in pieces. You can close this page. I'll message you when your first fixes are ready, and they'll be right here.",
  offline: "You seem to be offline. I'll pick up where we left off when you're back.",
  network: "Couldn't reach Rocco. Check your connection and try again.",
};
