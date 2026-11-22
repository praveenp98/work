import { accessOf } from "./access";
import { markJoined, roleOf } from "./team";
import type { Store, Workspace } from "./store/types";
import { createWorkspace, ensureLinkCode, loadWorkspace, rememberToken, revealToken } from "./workspace";

/**
 * After Google sign-in: which team is this person's Rocco?
 *  1. The team this browser already uses (from a text link, an earlier visit), if it has no owner yet or is theirs.
 *  2. Else a team they own (paid/trial first, then newest).
 *  3. Else a brand-new team with them as the owner.
 * Never takes over a team that belongs to another email.
 */
export async function teamForUser(store: Store, email: string, browserToken?: string | null, name?: string): Promise<{ ws: Workspace; token: string; created: boolean }> {
  const e = email.toLowerCase();
  if (browserToken) {
    const ws = await loadWorkspace(store, browserToken);
    // This browser's own team: claim it if nobody verified owns it yet (an unverified email on it means nothing).
    if (ws && (!ws.ownerVerified || ws.ownerEmail?.toLowerCase() === e)) {
      if (ws.ownerEmail !== e || !ws.ownerVerified || (name && ws.ownerName !== name)) { ws.ownerEmail = e; ws.ownerVerified = true; if (name) ws.ownerName = name; await store.saveWorkspace(ws); }
      await rememberToken(store, ws, browserToken);
      return { ws, token: browserToken, created: false };
    }
    // Or a team this person was added to.
    if (ws && roleOf(ws, e) === "member") {
      if (markJoined(ws, e, name)) await store.saveWorkspace(ws);
      return { ws, token: browserToken, created: false };
    }
  }
  // Only teams whose owner was verified by Google: someone typing your email elsewhere can't plant a team for you.
  // Then teams they were added to as a member (invites only work for this exact Google-verified email).
  const owned = (await store.findWorkspacesByOwner(e)).filter((w) => w.ownerVerified && revealToken(w));
  const joined = (await store.findWorkspacesByMember(e)).filter((w) => roleOf(w, e) === "member" && revealToken(w));
  const best = owned.find((w) => accessOf(w) !== "none") ?? joined.find((w) => accessOf(w) !== "none") ?? owned[0] ?? joined[0];
  if (best) {
    if (roleOf(best, e) === "member" ? markJoined(best, e, name) : !!name && best.ownerName !== name && !!(best.ownerName = name)) await store.saveWorkspace(best);
    return { ws: best, token: revealToken(best)!, created: false };
  }

  const c = await createWorkspace(store);
  c.ws.ownerEmail = e;
  c.ws.ownerVerified = true;
  if (name) c.ws.ownerName = name;
  await store.saveWorkspace(c.ws);
  await rememberToken(store, c.ws, c.token);
  await ensureLinkCode(store, c.ws);
  return { ws: c.ws, token: c.token, created: true };
}
