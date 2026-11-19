import { NextResponse } from "next/server";
import { hasAccess } from "@/lib/access";
import { getStore } from "@/lib/store";
import { applyChanges, clearPending, FREE_PROPOSALS, loadWorkspace } from "@/lib/workspace";

/** "I've made these changes" (report-inbox teams make approved changes by hand): log them, follow up next week. */
export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as { t?: string; brand?: string; codes?: unknown };
  const store = getStore();
  const ws = store && b.t ? await loadWorkspace(store, b.t) : null;
  const codes = Array.isArray(b.codes) ? b.codes.map(String).map((c) => c.toUpperCase()).filter((c) => /^[A-Z]\d{1,3}$/.test(c)).slice(0, 50) : [];
  if (!store || !ws || !codes.length) return NextResponse.json({ ok: false }, { status: 400 });
  try {
    const r = await applyChanges(store, ws, codes, { brand: b.brand, note: "made by hand (report inbox)", freeLimit: hasAccess(ws) ? undefined : FREE_PROPOSALS });
    await clearPending(store, ws, "apply", codes);
    return NextResponse.json({ ok: true, logged: r.actions.map((a) => a.code), locked: r.locked });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "failed" }, { status: 400 });
  }
}
