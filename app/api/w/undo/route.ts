import { NextResponse } from "next/server";
import { hasAccess } from "@/lib/access";
import { datadoeOn } from "@/lib/datadoe";
import { LIMIT_MSG, spend } from "@/lib/security";
import { getStore } from "@/lib/store";
import { approvedBy } from "@/lib/team";
import { canUndo, undoInAmazon } from "@/lib/undo";
import { loadWorkspace } from "@/lib/workspace";

/** Undo one change Rocco made (bid or budget back to its old value in Amazon), from the change log. */
export const maxDuration = 60;

export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as { t?: string; id?: string };
  const store = getStore();
  const ws = store && b.t ? await loadWorkspace(store, b.t) : null;
  if (!store || !ws || !b.id) return NextResponse.json({ ok: false }, { status: 400 });
  if (!hasAccess(ws)) return NextResponse.json({ ok: false, error: "Hire Rocco to make changes in Amazon." }, { status: 402 });
  if (!datadoeOn()) return NextResponse.json({ ok: false, error: "Connect Amazon first." }, { status: 400 });
  const a = (await store.listActions(ws.id, {})).find((x) => x.id === b.id);
  if (!a) return NextResponse.json({ ok: false, error: "I can't find that change." }, { status: 404 });
  if (!canUndo(a)) return NextResponse.json({ ok: false, error: a.status === "reverted" ? "Already undone." : `Undo this one by hand: ${a.proposal.undo}` }, { status: 409 });
  const acct = ws.amazon?.accounts?.find((x) => x.name === a.brand) ?? (ws.amazon?.accounts?.length === 1 ? ws.amazon.accounts[0] : undefined);
  if (!acct) return NextResponse.json({ ok: false, error: "That Amazon account isn't connected anymore." }, { status: 400 });
  if (!(await spend(store, ws, "writes", 1))) return NextResponse.json({ ok: false, error: LIMIT_MSG.writes }, { status: 429 });
  const u = await undoInAmazon(acct.id, a);
  if (!u.ok) return NextResponse.json({ ok: false, error: u.error });
  a.status = "reverted";
  a.note = `${a.note ? `${a.note} · ` : ""}undone in Amazon (${u.back})${await approvedBy(ws)}`;
  await store.saveAction(a);
  return NextResponse.json({ ok: true });
}
