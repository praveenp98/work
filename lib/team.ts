import { currentUser } from "./session";
import { hashToken, newToken } from "./store";
import type { Store, Workspace } from "./store/types";
import { rememberToken } from "./workspace";

/**
 * Teams: one Rocco, many people.
 *  - Owner: the Google email that owns the Rocco (ws.ownerEmail, verified). Billing, people, handover, link reset.
 *  - Member: added by email. They sign in with Google using that email and land on the same Rocco: see and approve
 *    today's jobs, Ask Rocco, Tidy, change log. They can leave anytime.
 * An invite only works for the exact Google-verified email, so nobody can join by guessing.
 * Removing someone also resets the private link, so a copy of the old link stops working.
 */
export type Role = "owner" | "member";
export interface Member { email: string; role: "member"; addedAt: string; addedBy: string; joinedAt?: string; name?: string }
export interface Person { email: string; role: Role; name?: string; joined: boolean }

export const MAX_MEMBERS = 25;
const norm = (e: string) => e.trim().toLowerCase();
export const validEmail = (e: string) => /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/.test(e.trim());

export function peopleOf(ws: Workspace): Person[] {
  const L: Person[] = [];
  if (ws.ownerEmail && ws.ownerVerified) L.push({ email: ws.ownerEmail, role: "owner", name: ws.ownerName, joined: true });
  for (const m of ws.members ?? []) L.push({ email: m.email, role: "member", name: m.name, joined: !!m.joinedAt });
  return L;
}

export function roleOf(ws: Workspace, email?: string | null): Role | null {
  if (!email) return null;
  const e = norm(email);
  if (ws.ownerVerified && ws.ownerEmail?.toLowerCase() === e) return "owner";
  return (ws.members ?? []).some((m) => m.email === e) ? "member" : null;
}

/** "Sam" from a joined name, else the part before @. */
export function displayName(ws: Workspace, email: string): string {
  const e = norm(email);
  const name = ws.ownerEmail?.toLowerCase() === e ? ws.ownerName : ws.members?.find((m) => m.email === e)?.name;
  return (name?.split(/\s+/)[0] || e.split("@")[0]).slice(0, 40);
}

export type TeamError = "not_owner" | "bad_email" | "already" | "full" | "not_member" | "not_joined" | "owner_cant_leave";

export function addMember(ws: Workspace, by: string, email: string, now = new Date()): TeamError | null {
  if (roleOf(ws, by) !== "owner") return "not_owner";
  if (!validEmail(email)) return "bad_email";
  const e = norm(email);
  if (roleOf(ws, e)) return "already";
  if ((ws.members ?? []).length >= MAX_MEMBERS) return "full";
  ws.members = [...(ws.members ?? []), { email: e, role: "member", addedAt: now.toISOString(), addedBy: norm(by) }];
  return null;
}

export function removeMember(ws: Workspace, by: string, email: string): TeamError | null {
  const e = norm(email);
  const self = norm(by) === e;
  if (!self && roleOf(ws, by) !== "owner") return "not_owner";
  if (roleOf(ws, e) === "owner") return "owner_cant_leave";
  if (roleOf(ws, e) !== "member") return "not_member";
  ws.members = (ws.members ?? []).filter((m) => m.email !== e);
  return null;
}

/** Hand the Rocco to a member who has signed in at least once. The old owner stays on as a member. */
export function transferOwner(ws: Workspace, by: string, email: string, now = new Date()): TeamError | null {
  if (roleOf(ws, by) !== "owner") return "not_owner";
  const e = norm(email);
  const m = ws.members?.find((x) => x.email === e);
  if (!m) return "not_member";
  if (!m.joinedAt) return "not_joined";
  const old = { email: norm(ws.ownerEmail!), name: ws.ownerName };
  ws.ownerEmail = e;
  ws.ownerName = m.name;
  ws.ownerVerified = true;
  ws.members = [...(ws.members ?? []).filter((x) => x.email !== e), { email: old.email, role: "member", addedAt: now.toISOString(), addedBy: e, joinedAt: now.toISOString(), name: old.name }];
  return null;
}

/** A member signed in with Google: mark them joined and keep their name for the change log. */
export function markJoined(ws: Workspace, email: string, name?: string, now = new Date()): boolean {
  const m = ws.members?.find((x) => x.email === norm(email));
  if (!m || (m.joinedAt && m.name === (name || m.name))) return false;
  m.joinedAt ??= now.toISOString();
  if (name) m.name = name.slice(0, 80);
  return true;
}

/** New private link: old copies (forwarded, bookmarked, in a removed person's browser) stop working. */
export async function resetLink(store: Store, ws: Workspace): Promise<string> {
  const token = newToken();
  await store.rotateToken(ws.id, hashToken(token));
  ws.tokenSealed = undefined;
  await rememberToken(store, ws, token);
  return token;
}

/** Who is acting in this request (Google sign-in), if anyone. Safe outside a request (tests). */
export async function actor(): Promise<{ email: string; name?: string } | null> {
  try { const u = await currentUser(); return u ? { email: norm(u.email), name: u.name } : null; } catch { return null; }
}

/** "approved by Sam" for the change log, when we know who tapped. */
export async function approvedBy(ws: Workspace): Promise<string> {
  const a = await actor();
  return a && roleOf(ws, a.email) ? ` · approved by ${displayName(ws, a.email)}` : "";
}
