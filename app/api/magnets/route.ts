import { NextResponse } from "next/server";
import { clientIp, fromOurSite, looksLikeBot } from "@/lib/human";
import { allowShared } from "@/lib/limits";
import { extractAdvice, parseAdviceRules, roastText } from "@/lib/magnets-ai";
import { SITE } from "@/lib/site";

/**
 * AI help for the free tools (/free/<slug>). Reports stay in the browser: this only sees summary facts (roast) or
 * the advice text a visitor pasted. Rate-limited per visitor and site-wide; falls back to rules when the AI is off.
 *   POST { op: "roast", facts }   → { lines, fix } | { lines: [] }
 *   POST { op: "advice", text }   → { items: Advice[], ai: boolean }
 */
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const h = req.headers;
  if (!fromOurSite(h, SITE.domain) || looksLikeBot(h)) return NextResponse.json({ error: "Please use the tool on rocco.works." }, { status: 403 });
  const b = (await req.json().catch(() => null)) as { op?: string; facts?: string; text?: string } | null;
  const ip = clientIp(h);
  const ok = (await allowShared(`mag:${ip}`, 8, 10 * 60_000)) && (await allowShared("mag:all", 400, 3600_000));
  if (b?.op === "advice") {
    const text = String(b.text ?? "").slice(0, 8000);
    if (!text.trim()) return NextResponse.json({ items: [], ai: false });
    const items = ok ? await extractAdvice(text) : null;
    return NextResponse.json({ items: items ?? parseAdviceRules(text), ai: !!items });
  }
  if (b?.op === "roast") {
    const facts = String(b.facts ?? "").slice(0, 4000);
    if (!ok || !facts.trim()) return NextResponse.json({ lines: [] });
    return NextResponse.json((await roastText(facts)) ?? { lines: [] });
  }
  return NextResponse.json({ error: "Unknown op." }, { status: 400 });
}
