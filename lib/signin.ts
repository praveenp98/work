import { accessOf } from "./access";
import type { Store, Workspace } from "./store/types";
import { createWorkspace, ensureLinkCode, loadWorkspace, rememberToken, revealToken } from "./workspace";

/**
 * After Google sign-in: which team is this person's Rocco?
 *  1. The team this browser already uses (from a text link, an earlier visit), if it has no owner yet or is theirs.
 *  2. Else a team they own (paid/trial first, then newest).
 *  3. Else a brand-new team with them as the owner.
 * Never takes over a team that belongs to another email.
 */
export async function teamForUser(store: Store, email: string, browserToken?: string | null): Promise<{ ws: Workspace; token: string; created: boolean }> {
  const e = email.toLowerCase();
  if (browserToken) {
    const ws = await loadWorkspace(store, browserToken);
    if (ws && (!ws.ownerEmail || ws.ownerEmail.toLowerCase() === e)) {
      if (ws.ownerEmail !== e) { ws.ownerEmail = e; await store.saveWorkspace(ws); }
      await rememberToken(store, ws, browserToken);
      return { ws, token: browserToken, created: false };
    }
  }
  const owned = (await store.findWorkspacesByOwner(e)).filter((w) => revealToken(w));
  const best = owned.find((w) => accessOf(w) !== "none") ?? owned[0];
  if (best) return { ws: best, token: revealToken(best)!, created: false };

  const c = await createWorkspace(store);
  c.ws.ownerEmail = e;
  await store.saveWorkspace(c.ws);
  await rememberToken(store, c.ws, c.token);
  await ensureLinkCode(store, c.ws);
  return { ws: c.ws, token: c.token, created: true };
}
