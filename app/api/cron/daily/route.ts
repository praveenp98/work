import { NextResponse } from "next/server";
import { benchmark } from "@/lib/rules/benchmarks";
import { getStore } from "@/lib/store";
import { dailyNumbers } from "@/lib/text/daily";
import { sendText } from "@/lib/text/provider";
import { buildBrief } from "@/lib/workspace";

/** Morning numbers to every linked, opted-in teammate. Vercel Cron calls this (see vercel.json). */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ ok: false }, { status: 401 });
  if (!secret && process.env.NODE_ENV === "production") return NextResponse.json({ ok: false, error: "CRON_SECRET not set" }, { status: 503 });
  const store = getStore();
  if (!store) return NextResponse.json({ ok: false, error: "memory not configured" }, { status: 503 });
  const phones = await store.listPhones({ optedIn: true });
  const byWs = new Map<string, string[]>();
  for (const p of phones) byWs.set(p.workspaceId, [...(byWs.get(p.workspaceId) ?? []), p.phone]);
  let sent = 0, failed = 0;
  for (const [wsId, list] of byWs) {
    const ws = await store.getWorkspaceById(wsId);
    if (!ws) continue;
    const b = await buildBrief(store, ws);
    const snap = b.perBrand[0]?.trends.find((t) => t.kind === "sp_search_term")?.latest;
    const bench = snap ? benchmark("sp_search_term", snap.stats, await store.peerStats("sp_search_term", ws.id)).lines : undefined;
    const msg = dailyNumbers(b, { bench, pending: ws.pending });
    for (const to of list) (await sendText(to, msg)).ok ? sent++ : failed++;
  }
  return NextResponse.json({ ok: true, workspaces: byWs.size, sent, failed });
}
