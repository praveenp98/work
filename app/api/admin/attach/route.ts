import { after, NextResponse } from "next/server";
import { syncAccount } from "@/lib/datadoe-sync";
import { getAccount } from "@/lib/datadoe";
import { getStore } from "@/lib/store";

/**
 * Admin: attach an Amazon account that's already connected in our DataDoe organization (e.g. one connected through
 * a manual invite) to a Rocco account, found by its Google sign-in email. Protected by CRON_SECRET.
 *   GET /api/admin/attach?key=CRON_SECRET&email=you@gmail.com&account=<sellerOrVendorId>
 * Then the owner opens rocco.works/me.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const secret = process.env.CRON_SECRET;
  if (!secret || q.get("key") !== secret) return NextResponse.json({ ok: false }, { status: 401 });
  const store = getStore();
  const email = (q.get("email") ?? "").trim().toLowerCase();
  const id = q.get("account") ?? "";
  if (!store || !email || !/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ ok: false, error: "email and account (UUID) required" }, { status: 400 });
  const teams = await store.findWorkspacesByOwner(email);
  const ws = teams[0];
  if (!ws) return NextResponse.json({ ok: false, error: "No Rocco account for that email yet: sign in with Google on rocco.works first." }, { status: 404 });
  try {
    const a = await getAccount(id);
    const accounts = (ws.amazon?.accounts ?? []).filter((x) => x.id !== a.id);
    accounts.push({ id: a.id, name: a.name, country: a.marketplaceCountryCode, connectedAt: new Date().toISOString(), ads: !!a.amazonAdsConnection });
    ws.amazon = { ...(ws.amazon ?? {}), accounts };
    await store.saveWorkspace(ws);
    // First pull right away, so the dashboard has real fixes when the owner opens it.
    after(async () => {
      const r = await syncAccount(store, ws, { id: a.id, name: a.name });
      const fresh = (await store.getWorkspaceById(ws.id)) ?? ws;
      fresh.amazon = { ...(fresh.amazon ?? { accounts }), lastSync: { at: new Date().toISOString(), kinds: r.kinds, errors: r.errors } };
      await store.saveWorkspace(fresh);
    });
    return NextResponse.json({ ok: true, attached: a.name, open: "https://rocco.works/me", note: "First pull running (1-2 minutes)." });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message.slice(0, 200) : "DataDoe lookup failed" }, { status: 502 });
  }
}
