/**
 * Every LoopMessage opt-in link that gets opened can cost a contact on the plan, so Rocco only creates one when a
 * person taps a button: never in page HTML, never in a text. This module is the gate in front of that.
 */
const BOT_UA = /bot|crawl|spider|slurp|preview|facebookexternalhit|facebot|twitterbot|slackbot|discordbot|whatsapp|telegrambot|linkedinbot|embedly|quora|pinterest|vkshare|skypeuripreview|headless|phantom|puppeteer|playwright|lighthouse|python-requests|curl|wget|httpclient|go-http|okhttp|axios|node-fetch|undici|postman/i;

export function looksLikeBot(h: Headers): string | null {
  const ua = h.get("user-agent") ?? "";
  if (!ua) return "no user agent";
  if (BOT_UA.test(ua)) return "bot user agent";
  const purpose = `${h.get("purpose") ?? ""} ${h.get("sec-purpose") ?? ""} ${h.get("x-purpose") ?? ""} ${h.get("x-moz") ?? ""}`;
  if (/prefetch|prerender|preview/i.test(purpose)) return "prefetch";
  return null;
}

/** Same-site request from our own page (browsers send Origin on POST; Sec-Fetch-Site is a second signal). */
export function fromOurSite(h: Headers, siteHost: string): boolean {
  const origin = h.get("origin") ?? h.get("referer") ?? "";
  let host = "";
  try { host = new URL(origin).host; } catch { return false; }
  const ok = host === siteHost || host === `www.${siteHost}` || host.startsWith("localhost") || host.startsWith("127.0.0.1");
  const sfs = h.get("sec-fetch-site");
  return ok && (!sfs || sfs === "same-origin" || sfs === "same-site");
}

/** Sliding-window limits: per visitor and for the whole site (protects the LoopMessage plan from floods). */
const hits = new Map<string, number[]>();
export function allow(key: string, max: number, windowMs: number, now = Date.now()): boolean {
  const list = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (list.length >= max) { hits.set(key, list); return false; }
  list.push(now);
  hits.set(key, list);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k);
  return true;
}

export const clientIp = (h: Headers) => (h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? "unknown").split(",")[0].trim();
