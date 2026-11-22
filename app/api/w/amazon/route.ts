import { NextResponse } from "next/server";
import { hasAccess } from "@/lib/access";
import { createInvite, createReconnect, datadoeOn } from "@/lib/datadoe";
import { getStore } from "@/lib/store";
import { loadWorkspace } from "@/lib/workspace";

/** "Connect Amazon": a one-time DataDoe invite for this team (reused while still valid). The page then opens it. */
export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as { t?: string; reconnect?: string };
  const store = getStore();
  const ws = store && b.t ? await loadWorkspace(store, b.t) : null;
  if (!store || !ws) return NextResponse.json({ ok: false }, { status: 400 });
  if (!hasAccess(ws)) return NextResponse.json({ ok: false, error: "Hire Rocco first, then connect your Amazon." }, { status: 402 });
  if (!datadoeOn()) return NextResponse.json({ ok: false, error: "Connecting Amazon is being switched on right now. Please try again in a few minutes." }, { status: 503 });
  if (b.reconnect) {
    if (!ws.amazon?.accounts?.some((a) => a.id === b.reconnect)) return NextResponse.json({ ok: false }, { status: 404 });
    try {
      const inv = await createReconnect(ws.id, b.reconnect);
      ws.amazon = { ...ws.amazon, invite: { id: inv.id, url: inv.invitationUrl, expiresAt: inv.expiresAt } };
      await store.saveWorkspace(ws);
      return NextResponse.json({ ok: true, url: inv.invitationUrl });
    } catch (e) {
      console.error("[amazon] reconnect invite failed", e);
      return NextResponse.json({ ok: false, error: "I couldn't create your reconnect link just now. Try again in a minute." }, { status: 502 });
    }
  }
  const open = ws.amazon?.invite;
  if (open && new Date(open.expiresAt).getTime() > Date.now() + 3_600_000) return NextResponse.json({ ok: true, url: open.url });
  try {
    const inv = await createInvite(ws.id, { name: ws.ownerEmail ? `Rocco · ${ws.ownerEmail}` : undefined });
    ws.amazon = { ...(ws.amazon ?? {}), accounts: ws.amazon?.accounts ?? [], invite: { id: inv.id, url: inv.invitationUrl, expiresAt: inv.expiresAt } };
    await store.saveWorkspace(ws);
    return NextResponse.json({ ok: true, url: inv.invitationUrl });
  } catch (e) {
    console.error("[amazon] invite failed", e);
    return NextResponse.json({ ok: false, error: "I couldn't open Amazon's sign-in just now (my data partner didn't answer). Try again in a minute." }, { status: 502 });
  }
}
