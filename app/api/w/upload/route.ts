import { NextResponse } from "next/server";
import { tablesFrom } from "@/lib/inbox";
import { hasAccess } from "@/lib/access";
import { LIMIT_MSG, spend } from "@/lib/security";
import { getStore } from "@/lib/store";
import { DEFAULT_BRAND, loadWorkspace, runAnalysis } from "@/lib/workspace";

/** Drop a report file on the setup page (Seller Central reports that can't be emailed). Same engine as the inbox. */
export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const t = String(form?.get("t") ?? "");
  const file = form?.get("file");
  const store = getStore();
  const ws = store && t ? await loadWorkspace(store, t) : null;
  if (!store || !ws || !(file instanceof File)) return NextResponse.json({ ok: false, error: "No file." }, { status: 400 });
  if (!hasAccess(ws)) return NextResponse.json({ ok: false, error: "Hire Rocco to analyze reports." }, { status: 402 });
  if (!(await spend(store, ws, "sync"))) return NextResponse.json({ ok: false, error: LIMIT_MSG.sync }, { status: 429 });
  if (file.size > 15_000_000) return NextResponse.json({ ok: false, error: "That file is over 15 MB." }, { status: 400 });
  try {
    const tables = await tablesFrom({ name: file.name, type: file.type, data: new Uint8Array(await file.arrayBuffer()) });
    const done: string[] = [];
    for (const table of tables) {
      try {
        const { out } = await runAnalysis(store, ws, Object.keys(ws.brands)[0] ?? DEFAULT_BRAND, table);
        done.push(out.analysis.headline);
      } catch { /* not a report sheet */ }
    }
    if (!done.length) return NextResponse.json({ ok: false, error: "I couldn't recognize a report in that file." }, { status: 400 });
    if (!ws.reportsAt) { const w = (await store.getWorkspaceById(ws.id)) ?? ws; w.reportsAt = new Date().toISOString(); await store.saveWorkspace(w); }
    return NextResponse.json({ ok: true, headlines: done });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "Couldn't read it." }, { status: 400 });
  }
}
