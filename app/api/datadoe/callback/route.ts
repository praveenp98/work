import { after, NextResponse } from "next/server";
import { hasAccess, isAudit } from "@/lib/access";
import { auditConnectOk, auditPullOk, noteAuditPull } from "@/lib/free-audit";
import { slotState } from "@/lib/accounts";
import { getAccount, getInvitation } from "@/lib/datadoe";
import { pullAndSave } from "@/lib/datadoe-sync";
import { importHistory } from "@/lib/history";
import { refreshManager } from "@/lib/manager";
import { notifyTeam } from "@/lib/notify";
import { SITE } from "@/lib/site";
import { getStore } from "@/lib/store";
import { trackServer } from "@/lib/track-server";

/**
 * DataDoe sends the browser here after the seller connects (or fails to). We only trust it when the invitationId
 * matches the invite we created for this team, and we re-read the account from DataDoe's API before linking it.
 * Then: tell the team, and send the browser to their Rocco page (/me uses the team cookie).
 */
export const dynamic = "force-dynamic";
export const maxDuration = 300; // the first pull runs after the redirect

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const ref = q.get("ref") ?? "";
  const store = getStore();
  const ws = store && /^[A-Za-z0-9-]{6,64}$/.test(ref) ? await store.getWorkspaceById(ref) : null;
  const back = (state: string) => NextResponse.redirect(`${SITE.url}/me?amazon=${state}`);
  if (!store || !ws || !ws.amazon?.invite || ws.amazon.invite.id !== q.get("invitationId")) return back("unknown");
  if (q.get("success") !== "true") {
    // DataDoe links are single use: after a failed attempt this one is dead, so the next tap must create a new one.
    const err = (q.get("error") || "failed").slice(0, 80);
    console.warn(`[amazon] connect failed for team ${ws.id}: ${err}`);
    await store.saveWorkspace({ ...ws, amazon: { ...ws.amazon, invite: undefined } });
    return back(encodeURIComponent(err));
  }

  const id = q.get("sellerOrVendorId") ?? "";
  if (!/^[0-9a-f-]{36}$/i.test(id)) return back("not_found");
  // Only paying teams, or a free audit team (one account, inside its window), can link an account (the invite
  // needed it too; checked again here).
  const audit = !hasAccess(ws) && isAudit(ws);
  if (!hasAccess(ws) && !audit) return back("unpaid");
  if (audit && !auditConnectOk(ws, new Date(), !!ws.amazon.accounts?.some((x) => x.id === id)).ok) return back("audit_limit");
  // Never trust the browser's sellerOrVendorId: ask DataDoe which account this invite actually connected, so a
  // paying user can't swap in someone else's account id from our DataDoe organization.
  const expected = ws.amazon.invite.account; // reconnect links are for one known account
  if (expected && expected !== id) return back("mismatch");
  if (!expected) {
    const inv = await getInvitation(ws.amazon.invite.id).catch(() => null);
    if (!inv) return back("check_failed");
    if (inv.sellerOrVendorId && inv.sellerOrVendorId !== id) return back("mismatch");
  }
  // One Amazon account belongs to one Rocco team.
  const taken = (await store.listAmazonWorkspaces()).some((w) => w.id !== ws.id && w.amazon?.accounts?.some((x) => x.id === id));
  if (taken) return back("taken");
  // A new account needs a free slot (an old invite could still be open after the plan's accounts filled up).
  const isNew = !ws.amazon.accounts?.some((x) => x.id === id);
  if (isNew && !slotState(ws).canAdd) return back("limit");
  try {
    const a = await getAccount(id); // must exist in our DataDoe organization
    const accounts = (ws.amazon.accounts ?? []).filter((x) => x.id !== a.id);
    accounts.push({ id: a.id, name: a.name, country: a.marketplaceCountryCode, connectedAt: new Date().toISOString(), ads: !!a.amazonAdsConnection });
    trackServer(ws.id, "amazon_connected", { country: a.marketplaceCountryCode, ads: !!a.amazonAdsConnection, nth: accounts.length });
    ws.amazon = { ...ws.amazon, accounts, invite: undefined };
    // Free audit: the first pull is the audit's one pull (counted now, so a quick "Check now" can't pull again).
    const auditPull = audit && auditPullOk(ws).ok;
    if (audit) {
      if (!ws.audit!.connectedAt) trackServer(ws.id, "audit_connected", { country: a.marketplaceCountryCode, ads: !!a.amazonAdsConnection });
      ws.audit = { ...ws.audit!, connectedAt: ws.audit!.connectedAt ?? new Date().toISOString() };
      if (auditPull) noteAuditPull(ws);
    }
    await store.saveWorkspace(ws);
    await notifyTeam(store, ws, [`🔌 Amazon connected: ${a.name} (${a.marketplaceCountryCode})${a.amazonAdsConnection ? " + Ads" : ""}. I'm reading your account now. I'll text you the first findings.`]).catch(() => 0);
    // First pull right away (paying teams, and the free audit's one pull): if Amazon's history is already there,
    // fixes show up within a minute or two.
    if (hasAccess(ws) || auditPull) {
      try {
        after(async () => {
          const r = await pullAndSave(store, ws.id, { id: a.id, name: a.name }).catch(() => null);
          // One-time "Before Rocco" read (4 DataDoe tokens + one short Claude call), so memory starts with the past.
          // Paying teams only: a free audit is one export set and no Claude calls.
          if (!audit) await importHistory(store, ws.id, { id: a.id, name: a.name }).catch(() => null);
          if (r?.kinds.length) { trackServer(ws.id, "first_data_ready", { reports: r.kinds.length }); await refreshManager(store, ws.id).catch(() => 0); }
        });
      } catch { /* outside a request (tests): the daily pull picks it up */ }
    }
    return back("connected");
  } catch {
    return back("not_found");
  }
}
