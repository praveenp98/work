import { createHmac, timingSafeEqual } from "node:crypto";
import { SITE } from "./site";
import { seal, unseal } from "./vault";

/**
 * Rocco in Slack: "Add to Slack" (OAuth v2), morning numbers in the team's channel, and @Rocco mentions / DMs
 * answered by the same brain as iMessage (lib/text/handler). Off until SLACK_CLIENT_ID, SLACK_CLIENT_SECRET and
 * SLACK_SIGNING_SECRET are set (create the app from docs/slack-manifest.yml).
 *
 * Identity mapping reuses the phones table: "slack-team:<team>" → workspace, "slack:<team>:<user>" → a teammate.
 */
export const slackConfigured = () => !!(process.env.SLACK_CLIENT_ID && process.env.SLACK_CLIENT_SECRET && process.env.SLACK_SIGNING_SECRET);
export const REDIRECT = `${SITE.url}/api/slack/oauth`;
export const SCOPES = ["app_mentions:read", "chat:write", "im:history", "im:write", "incoming-webhook"];
export const teamKey = (team: string) => `slack-team:${team}`;
export const userKey = (team: string, user: string) => `slack:${team}:${user}`;
export const isSlackKey = (k: string) => k.startsWith("slack:") || k.startsWith("slack-team:");

export interface SlackLink { teamId: string; teamName?: string; channelId?: string; channelName?: string; botSealed?: string }

/** Where "Add to Slack" sends the browser. State is sealed (workspace id + expiry) so it can't be forged. */
export function installUrl(workspaceId: string): string | null {
  if (!slackConfigured()) return null;
  const state = seal(JSON.stringify({ w: workspaceId, exp: Date.now() + 15 * 60_000 }));
  if (!state) return null;
  const q = new URLSearchParams({ client_id: process.env.SLACK_CLIENT_ID!, scope: SCOPES.join(","), redirect_uri: REDIRECT, state });
  return `https://slack.com/oauth/v2/authorize?${q}`;
}

export function readState(state: string | null): string | null {
  const raw = unseal(state ?? undefined);
  if (!raw) return null;
  try {
    const d = JSON.parse(raw) as { w: string; exp: number };
    return d.exp > Date.now() ? d.w : null;
  } catch { return null; }
}

/** Code → bot token + team + chosen channel. */
export async function exchangeCode(code: string): Promise<SlackLink | null> {
  const body = new URLSearchParams({ client_id: process.env.SLACK_CLIENT_ID ?? "", client_secret: process.env.SLACK_CLIENT_SECRET ?? "", code, redirect_uri: REDIRECT });
  const res = await fetch("https://slack.com/api/oauth.v2.access", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body }).catch(() => null);
  const d = (await res?.json().catch(() => null)) as { ok?: boolean; access_token?: string; team?: { id: string; name?: string }; incoming_webhook?: { channel_id?: string; channel?: string } } | null;
  if (!d?.ok || !d.access_token || !d.team?.id) return null;
  return { teamId: d.team.id, teamName: d.team.name, channelId: d.incoming_webhook?.channel_id, channelName: d.incoming_webhook?.channel, botSealed: seal(d.access_token) };
}

/** Slack request signing: v0=HMAC_SHA256(secret, "v0:<ts>:<body>"), within 5 minutes. */
export function verifySlack(headers: Headers, rawBody: string, now = Date.now()): boolean {
  const secret = process.env.SLACK_SIGNING_SECRET;
  const ts = headers.get("x-slack-request-timestamp");
  const sig = headers.get("x-slack-signature");
  if (!secret || !ts || !sig || Math.abs(now / 1000 - Number(ts)) > 300) return false;
  const mine = "v0=" + createHmac("sha256", secret).update(`v0:${ts}:${rawBody}`).digest("hex");
  return mine.length === sig.length && timingSafeEqual(Buffer.from(mine), Buffer.from(sig));
}

/** Post as Rocco. Returns false when the token is missing or Slack refuses. */
export async function postSlack(link: SlackLink, text: string, opts: { channel?: string; threadTs?: string } = {}): Promise<boolean> {
  const token = unseal(link.botSealed);
  const channel = opts.channel ?? link.channelId;
  if (!token || !channel) return false;
  const res = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({ channel, text: toSlack(text), ...(opts.threadTs ? { thread_ts: opts.threadTs } : {}), unfurl_links: false }),
  }).catch(() => null);
  const d = (await res?.json().catch(() => null)) as { ok?: boolean } | null;
  return !!d?.ok;
}

/** Slack text in → plain words for the handler: drop "<@U123>" mentions, unwrap "<https://x|label>" links. */
export const fromSlack = (t: string) => t.replace(/<@[A-Z0-9]+>/g, "").replace(/<([^|>]+)\|([^>]+)>/g, "$2").replace(/<([^>]+)>/g, "$1").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
/** Rocco's iMessage-style text → Slack (bold codes so "YES N1" stands out). */
export const toSlack = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\b(YES(?: [A-Z]\d{1,3})+)/g, "*$1*");
