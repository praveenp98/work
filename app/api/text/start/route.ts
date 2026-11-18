import { NextResponse } from "next/server";
import { allow, clientIp, fromOurSite, looksLikeBot } from "@/lib/human";
import { SITE } from "@/lib/site";
import { getStore } from "@/lib/store";
import { optInLinks } from "@/lib/text/provider";
import { ensureLinkCode, loadWorkspace } from "@/lib/workspace";

/**
 * The only place a LoopMessage opt-in link is created, and only for a person who tapped a button on rocco.works:
 * POST from our own page, with the tap header our button sends, not a bot or prefetch, within rate limits.
 * Body: { q?: question to prefill, t?: workspace key (their phone joins that team), join?: team code from an invite }.
 */
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const h = req.headers;
  const why = h.get("x-rocco-tap") !== "1" ? "no tap" : !fromOurSite(h, SITE.domain) ? "not from rocco.works" : looksLikeBot(h);
  if (why) return NextResponse.json({ ok: false, error: why }, { status: 403 });
  const ip = clientIp(h);
  if (!allow(`ip:${ip}`, 4, 10 * 60_000) || !allow("site", 150, 60 * 60_000)) return NextResponse.json({ ok: false, error: "Too many tries. Give it a minute." }, { status: 429 });

  const b = (await req.json().catch(() => ({}))) as { q?: unknown; t?: unknown; join?: unknown };
  const q = String(b.q ?? "").replace(/[\[\]<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 90);
  let link: string | undefined;
  const store = getStore();
  if (typeof b.t === "string" && store) {
    const ws = await loadWorkspace(store, b.t);
    if (ws) link = await ensureLinkCode(store, ws);
  } else if (typeof b.join === "string" && /^[A-Za-z0-9]{6}$/.test(b.join) && store && (await store.findWorkspaceByLinkCode(b.join))) {
    link = b.join.toUpperCase();
  }
  const body = link
    ? `Hi Rocco 👋 ${b.join ? "I'm joining my team" : "it's me"} [opt-in-code]`
    : q ? `Hey Rocco 👋 Help me with ${q} [opt-in-code]` : "Hey Rocco 👋 Show me what you can do [opt-in-code]";
  const l = await optInLinks({ body, ...(link ? { link } : {}) }).catch(() => null);
  const url = l?.url || l?.imessage || (link ? null : process.env.ROCCO_OPTIN_URL) || null;
  return NextResponse.json({ ok: !!url, url }, { headers: { "cache-control": "no-store" } });
}
