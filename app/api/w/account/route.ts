import { NextResponse } from "next/server";
import { closeBlocker, closeWorkspace } from "@/lib/account";
import { allow } from "@/lib/human";
import { getStore } from "@/lib/store";
import { actor, resetLink, roleOf } from "@/lib/team";
import { trackServer } from "@/lib/track-server";
import { loadWorkspace } from "@/lib/workspace";

/**
 * Account actions from the Account page.
 *  { t, op: "delete", confirm: "DELETE" }   owner closes this Rocco (lib/account.ts). Blocked while a plan is active.
 */
export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as { t?: string; op?: string; confirm?: string };
  const store = getStore();
  const ws = store && b.t ? await loadWorkspace(store, b.t) : null;
  if (!store || !ws) return NextResponse.json({ ok: false }, { status: 400 });
  if (!allow(`account:${ws.id}`, 10, 10 * 60_000)) return NextResponse.json({ ok: false, error: "Give it a minute and try again." }, { status: 429 });
  if (b.op !== "delete") return NextResponse.json({ ok: false, error: "Unknown request." }, { status: 400 });
  const me = await actor();
  if (!me || roleOf(ws, me.email) !== "owner") return NextResponse.json({ ok: false, error: "Only the owner can delete this Rocco. Sign in with Google as the owner." }, { status: 403 });
  if (String(b.confirm ?? "").trim().toUpperCase() !== "DELETE") return NextResponse.json({ ok: false, error: "Type DELETE to confirm." }, { status: 400 });
  const blocked = closeBlocker(ws);
  if (blocked) return NextResponse.json({ ok: false, error: blocked }, { status: 409 });
  const accounts = (ws.amazon?.accounts ?? []).map((a) => `${a.name} (${a.country}) ${a.id}`);
  closeWorkspace(ws, me.email);
  await store.saveWorkspace(ws);
  await resetLink(store, ws); // old links and cookies stop opening it
  console.warn(`[account] Rocco ${ws.id} deleted by owner ${me.email}. Erase stored data within 30 days; delete in DataDoe: ${accounts.join("; ") || "no accounts"}`);
  trackServer(ws.id, "rocco_deleted", {});
  return NextResponse.json({ ok: true });
}
