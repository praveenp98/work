import { NextResponse } from "next/server";
import { LIMIT_MSG, spend } from "@/lib/security";
import { getStore } from "@/lib/store";
import { actor, addMember, displayName, peopleOf, removeMember, resetLink, roleOf, transferOwner, type TeamError } from "@/lib/team";
import { loadWorkspace } from "@/lib/workspace";

/**
 * Team: add a teammate by email, remove them, hand the Rocco over, reset the private link, or leave.
 * Needs both the team's link and a Google sign-in (who is acting). Owner-only except "leave".
 * Removing someone also resets the private link, so their copy of it stops working.
 */
const ERR: Record<TeamError, string> = {
  not_owner: "Only the owner can do that.",
  bad_email: "That email doesn't look right.",
  already: "They're already on this Rocco.",
  full: "This Rocco already has the most people it can have (25).",
  not_member: "They're not on this Rocco.",
  not_joined: "They need to sign in once with Google before you can hand it over.",
  owner_cant_leave: "Hand your Rocco to someone else first, then you can leave.",
};

export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as { t?: string; action?: string; email?: unknown };
  const store = getStore();
  const ws = store && b.t ? await loadWorkspace(store, b.t) : null;
  if (!store || !ws) return NextResponse.json({ ok: false }, { status: 400 });
  const me = await actor();
  if (!me || !roleOf(ws, me.email)) return NextResponse.json({ ok: false, error: "Sign in with Google to manage your team." }, { status: 401 });
  const email = typeof b.email === "string" ? b.email.trim().toLowerCase().slice(0, 254) : "";

  let err: TeamError | null = null;
  let token: string | undefined;
  if (b.action === "add") {
    if (!(await spend(store, ws, "team"))) return NextResponse.json({ ok: false, error: LIMIT_MSG.team }, { status: 429 });
    err = addMember(ws, me.email, email);
  } else if (b.action === "remove" || b.action === "leave") {
    err = removeMember(ws, me.email, b.action === "leave" ? me.email : email);
    if (!err) { await store.saveWorkspace(ws); if (b.action === "remove") token = await resetLink(store, ws); }
  } else if (b.action === "transfer") {
    err = transferOwner(ws, me.email, email);
  } else if (b.action === "reset") {
    if (roleOf(ws, me.email) !== "owner") err = "not_owner";
    else token = await resetLink(store, ws);
  } else return NextResponse.json({ ok: false }, { status: 400 });

  if (err) return NextResponse.json({ ok: false, error: ERR[err] }, { status: 400 });
  if (b.action !== "remove" && b.action !== "leave" && b.action !== "reset") await store.saveWorkspace(ws);
  else if (b.action === "leave") await store.saveWorkspace(ws);
  const fresh = (await store.getWorkspaceById(ws.id)) ?? ws;
  return NextResponse.json({
    ok: true,
    people: peopleOf(fresh),
    me: { email: me.email, role: roleOf(fresh, me.email) },
    // A new private link: the browser moves to it (old copies stop working).
    ...(token && b.action !== "leave" ? { url: `/w/${token}` } : {}),
    ...(b.action === "add" ? { invite: `I added you to our Rocco (AI Amazon manager). Open rocco.works, tap Sign in, and use Google with ${email}. You'll land on our dashboard. ${displayName(fresh, me.email)}` } : {}),
  });
}
