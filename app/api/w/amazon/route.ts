import { NextResponse } from "next/server";
import { hasAccess } from "@/lib/access";
import { createInvite, createReconnect, datadoeOn, getInvitation } from "@/lib/datadoe";
import { LIMIT_MSG, spend } from "@/lib/security";
import { getStore } from "@/lib/store";
import { slotState, SWAP_COOLDOWN_DAYS } from "@/lib/accounts";
import { extraAccountUrl } from "@/lib/paywall";
import { actor, roleOf } from "@/lib/team";
import { loadWorkspace } from "@/lib/workspace";

/** "Connect Amazon": a one-time DataDoe invite for this team (reused while still valid). The page then opens it. */
export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as { t?: string; reconnect?: string; remove?: string };
  const store = getStore();
  const ws = store && b.t ? await loadWorkspace(store, b.t) : null;
  if (!store || !ws) return NextResponse.json({ ok: false }, { status: 400 });
  if (!hasAccess(ws)) return NextResponse.json({ ok: false, error: "Hire Rocco first, then connect your Amazon." }, { status: 402 });
  if (!datadoeOn()) return NextResponse.json({ ok: false, error: "Connecting Amazon is being switched on right now. Please try again in a few minutes." }, { status: 503 });
  // Remove an account (owner only). Its data and change log stay; Rocco stops reading it. The slot frees right away
  // if it was connected in the last 24 hours (wrong account), otherwise after 30 days (lib/accounts.ts).
  if (b.remove) {
    const me = await actor();
    if (!me || roleOf(ws, me.email) !== "owner") return NextResponse.json({ ok: false, error: "Only the owner can remove an Amazon account. Sign in with Google as the owner." }, { status: 403 });
    const acc = ws.amazon?.accounts?.find((a) => a.id === b.remove);
    if (!acc) return NextResponse.json({ ok: false, error: "That account isn't connected." }, { status: 404 });
    ws.amazon = { ...ws.amazon!, accounts: ws.amazon!.accounts.filter((a) => a.id !== acc.id) };
    ws.removedAccounts = [...(ws.removedAccounts ?? []), { id: acc.id, name: acc.name, country: acc.country, connectedAt: acc.connectedAt, removedAt: new Date().toISOString(), by: me.email }].slice(-50);
    await store.saveWorkspace(ws);
    // DataDoe has no API to disconnect: delete it in DataDoe → Accounts so its rows stop costing (docs/SUPPORT.md).
    console.warn(`[amazon] account removed by team: ${acc.name} (${acc.country}) ${acc.id} → delete in DataDoe`);
    const st = slotState(ws);
    return NextResponse.json({ ok: true, removed: acc.name, slots: st, note: st.held ? `Removed. Its slot frees up in ${SWAP_COOLDOWN_DAYS} days.` : "Removed. The slot is free." });
  }
  // A new account needs a free slot: 3 included, more at $49/mo each.
  if (!b.reconnect) {
    const st = slotState(ws);
    if (!st.canAdd) {
      const url = extraAccountUrl(ws);
      return NextResponse.json({ ok: false, limit: true, slots: st, extraUrl: url, error: url ? `Your plan includes ${st.limit} Amazon accounts and they're all in use. Add one more for $49/month.` : `Your plan includes ${st.limit} Amazon accounts and they're all in use. Email hello@rocco.works to add more.` }, { status: 402 });
    }
  }
  // Reuse an open link only if DataDoe says it's still unused (links are single use, even after a failed attempt).
  const open0 = ws.amazon?.invite;
  const fresh0 = !!open0 && !open0.account && new Date(open0.expiresAt).getTime() > Date.now() + 3_600_000 && (await getInvitation(open0.id).then((i) => /PENDING/i.test(i.status ?? "") && !i.sellerOrVendorId).catch(() => false));
  if (open0 && !fresh0 && ws.amazon) ws.amazon = { ...ws.amazon, invite: undefined };
  const reuse = !b.reconnect && fresh0;
  if (!reuse && !(await spend(store, ws, "invite"))) return NextResponse.json({ ok: false, error: LIMIT_MSG.invite }, { status: 429 });
  if (b.reconnect) {
    if (!ws.amazon?.accounts?.some((a) => a.id === b.reconnect)) return NextResponse.json({ ok: false }, { status: 404 });
    try {
      const inv = await createReconnect(ws.id, b.reconnect);
      ws.amazon = { ...ws.amazon, invite: { id: inv.id, url: inv.invitationUrl, expiresAt: inv.expiresAt, account: b.reconnect } };
      await store.saveWorkspace(ws);
      return NextResponse.json({ ok: true, url: inv.invitationUrl });
    } catch (e) {
      console.error("[amazon] reconnect invite failed", e);
      return NextResponse.json({ ok: false, error: "I couldn't create your reconnect link just now. Try again in a minute." }, { status: 502 });
    }
  }
  const open = ws.amazon?.invite;
  if (reuse && open) return NextResponse.json({ ok: true, url: open.url });
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
