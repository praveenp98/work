import { NextResponse } from "next/server";
import { getAccount } from "@/lib/datadoe";
import { notifyTeam } from "@/lib/notify";
import { SITE } from "@/lib/site";
import { getStore } from "@/lib/store";

/**
 * DataDoe sends the browser here after the seller connects (or fails to). We only trust it when the invitationId
 * matches the invite we created for this team, and we re-read the account from DataDoe's API before linking it.
 * Then: tell the team, and send the browser to their Rocco page (/me uses the team cookie).
 */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const ref = q.get("ref") ?? "";
  const store = getStore();
  const ws = store && /^[A-Za-z0-9-]{6,64}$/.test(ref) ? await store.getWorkspaceById(ref) : null;
  const back = (state: string) => NextResponse.redirect(`${SITE.url}/me?amazon=${state}`);
  if (!store || !ws || !ws.amazon?.invite || ws.amazon.invite.id !== q.get("invitationId")) return back("unknown");
  if (q.get("success") !== "true") return back(encodeURIComponent((q.get("error") || "failed").slice(0, 60)));

  const id = q.get("sellerOrVendorId") ?? "";
  try {
    const a = await getAccount(id); // must exist in our DataDoe organization
    const accounts = (ws.amazon.accounts ?? []).filter((x) => x.id !== a.id);
    accounts.push({ id: a.id, name: a.name, country: a.marketplaceCountryCode, connectedAt: new Date().toISOString(), ads: !!a.amazonAdsConnection });
    ws.amazon = { ...ws.amazon, accounts, invite: undefined };
    await store.saveWorkspace(ws);
    await notifyTeam(store, ws, [`🔌 Amazon connected: ${a.name} (${a.marketplaceCountryCode})${a.amazonAdsConnection ? " + Ads" : ""}. Amazon is sending me your first data now, it takes a few hours. I'll text you the first findings.`]).catch(() => 0);
    return back("connected");
  } catch {
    return back("not_found");
  }
}
