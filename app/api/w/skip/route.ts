import { NextResponse } from "next/server";
import { addSkips } from "@/lib/memory";
import { getStore } from "@/lib/store";
import type { Skip, SkipReason } from "@/lib/store/types";
import { latestRuns, loadWorkspace } from "@/lib/workspace";

/** "Skip" (with an optional one-tap reason): Rocco remembers it (lib/memory.ts) so this account's fixes match how they work. */
export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as { t?: string; brand?: string; codes?: unknown; reason?: unknown; note?: unknown };
  const store = getStore();
  const ws = store && b.t ? await loadWorkspace(store, b.t) : null;
  const codes = Array.isArray(b.codes) ? b.codes.map(String).map((c) => c.toUpperCase()).filter((c) => /^[A-Z]\d{1,3}$/.test(c)).slice(0, 20) : [];
  if (!store || !ws || !codes.length) return NextResponse.json({ ok: false }, { status: 400 });
  const brand = b.brand || Object.keys(ws.brands)[0] || "main";
  const props = new Map((await latestRuns(store, ws, brand)).flatMap((r) => r.proposals.map((p) => [p.code, p] as const)));
  const at = new Date().toISOString();
  const reason = (["done", "strategy", "risky", "numbers", "later"] as const).find((r) => r === b.reason) as SkipReason | undefined;
  const note = typeof b.note === "string" ? b.note.replace(/\s+/g, " ").trim().slice(0, 200) || undefined : undefined;
  const add: Skip[] = codes.flatMap((c) => { const p = props.get(c); return p ? [{ code: c, kind: p.kind, target: p.target.slice(0, 80), value: Math.round(p.valueMonthly), at, reason, note }] : []; });
  // "Numbers look off" is a signal about Rocco's math, not the seller's taste: log it for review (Vercel logs).
  if (reason === "numbers") console.warn(`[rocco] numbers flagged by ${ws.id}: ${add.map((x) => `${x.code} ${x.kind} \"${x.target}\" ~$${x.value}`).join("; ")}${note ? ` · ${note}` : ""}`);
  if (add.length) { ws.skips = addSkips(ws.skips, add); await store.saveWorkspace(ws); }
  return NextResponse.json({ ok: true, skipped: add.map((s) => s.code) });
}
