import { NextResponse } from "next/server";
import { createInvite, datadoeOn } from "@/lib/datadoe";
import { getStore } from "@/lib/store";
import { loadWorkspace } from "@/lib/workspace";

/** "Connect Amazon": a one-time DataDoe invite for this team (reused while still valid). The page then opens it. */
export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as { t?: string };
  const store = getStore();
  const ws = store && b.t ? await loadWorkspace(store, b.t) : null;
  if (!store || !ws) return NextResponse.json({ ok: false }, { status: 400 });
  if (!datadoeOn()) return NextResponse.json({ ok: false, error: "Direct Amazon connection isn't switched on yet." }, { status: 503 });
  const open = ws.amazon?.invite;
  if (open && new Date(open.expiresAt).getTime() > Date.now() + 3_600_000) return NextResponse.json({ ok: true, url: open.url });
  try {
    const inv = await createInvite(ws.id, { name: ws.ownerEmail ? `Rocco · ${ws.ownerEmail}` : undefined });
    ws.amazon = { accounts: ws.amazon?.accounts ?? [], invite: { id: inv.id, url: inv.invitationUrl, expiresAt: inv.expiresAt } };
    await store.saveWorkspace(ws);
    return NextResponse.json({ ok: true, url: inv.invitationUrl });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message.slice(0, 200) : "Couldn't create the link." }, { status: 502 });
  }
}
