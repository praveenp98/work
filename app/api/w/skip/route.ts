import { NextResponse } from "next/server";
import { addSkips } from "@/lib/memory";
import { getStore } from "@/lib/store";
import type { Skip } from "@/lib/store/types";
import { latestRuns, loadWorkspace } from "@/lib/workspace";

/** "Skip" on a fix card: Rocco remembers it (lib/memory.ts) so this account's fixes get sharper over time. */
export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as { t?: string; brand?: string; codes?: unknown };
  const store = getStore();
  const ws = store && b.t ? await loadWorkspace(store, b.t) : null;
  const codes = Array.isArray(b.codes) ? b.codes.map(String).map((c) => c.toUpperCase()).filter((c) => /^[A-Z]\d{1,3}$/.test(c)).slice(0, 20) : [];
  if (!store || !ws || !codes.length) return NextResponse.json({ ok: false }, { status: 400 });
  const brand = b.brand || Object.keys(ws.brands)[0] || "main";
  const props = new Map((await latestRuns(store, ws, brand)).flatMap((r) => r.proposals.map((p) => [p.code, p] as const)));
  const at = new Date().toISOString();
  const add: Skip[] = codes.flatMap((c) => { const p = props.get(c); return p ? [{ code: c, kind: p.kind, target: p.target.slice(0, 80), value: Math.round(p.valueMonthly), at }] : []; });
  if (add.length) { ws.skips = addSkips(ws.skips, add); await store.saveWorkspace(ws); }
  return NextResponse.json({ ok: true, skipped: add.map((s) => s.code) });
}
