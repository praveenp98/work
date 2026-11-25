import { NextResponse } from "next/server";
import { cleanClientEvent, recordEvent } from "@/lib/events";
import { allow, clientIp, fromOurSite, looksLikeBot } from "@/lib/human";
import { SITE } from "@/lib/site";
import { getStore } from "@/lib/store";
import { unseal } from "@/lib/vault";
import { loadWorkspace } from "@/lib/workspace";
import { readPartnerCookie } from "@/lib/partners";
import { trackServer } from "@/lib/track-server";

/**
 * Where the browser helper (lib/track.ts) sends funnel events. Accepts only the client events, only from our own
 * pages, never from bots. Stores no IP and no user agent (the IP is used for a short rate limit and dropped).
 * "paid" and "call_booked" are refused here: they are written by the server (payment webhook, /admin).
 * Always answers 204 so nothing about the visitor's page depends on it.
 */
export const dynamic = "force-dynamic";
const done = () => new NextResponse(null, { status: 204 });

export async function POST(req: Request) {
  const h = req.headers;
  if (!fromOurSite(h, SITE.domain) || looksLikeBot(h)) return done();
  if (!allow(`ev:${clientIp(h)}`, 60, 60_000)) return done();
  const row = cleanClientEvent(await req.json().catch(() => null));
  if (!row) return done();
  // Partner referral (lib/partners.ts): only ever from our own httpOnly cookie, never from the browser's body.
  const partner = readPartnerCookie(h.get("cookie"));
  if (partner) row.props = { ...(row.props ?? {}), partner };
  if (row.event === "checkout_started") {
    // Tag the checkout with the team (read from this browser's sealed team cookie) so "paid" can find its source.
    try {
      const sealed = h.get("cookie")?.match(/(?:^|;\s*)rocco_team=([^;]+)/)?.[1];
      const token = unseal(sealed ? decodeURIComponent(sealed) : undefined);
      const store = getStore();
      const ws = token && store ? await loadWorkspace(store, token) : null;
      if (ws) row.ref = ws.id;
      const code = ws?.partner ?? partner;
      if (code) { row.props = { ...(row.props ?? {}), partner: code }; trackServer(ws?.id ?? row.anon_id ?? `anon-${code}`, "partner_checkout_started", { code }); }
    } catch { /* the event still counts without it */ }
  }
  await recordEvent(row);
  return done();
}
