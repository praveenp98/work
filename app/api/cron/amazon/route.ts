import { after, NextResponse } from "next/server";
import { datadoeOn } from "@/lib/datadoe";
import { syncAccount, tellTeam } from "@/lib/datadoe-sync";
import { getStore } from "@/lib/store";

/**
 * Daily pull for teams connected to Amazon directly (DataDoe). Vercel Cron calls this after DataDoe's 2am-local
 * fetch has landed (see vercel.json). Each account is pulled in the background after the response.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ ok: false }, { status: 401 });
  if (!secret && process.env.NODE_ENV === "production") return NextResponse.json({ ok: false, error: "CRON_SECRET not set" }, { status: 503 });
  const store = getStore();
  if (!store || !datadoeOn()) return NextResponse.json({ ok: false, error: "not configured" }, { status: 503 });
  const teams = await store.listAmazonWorkspaces();
  after(async () => {
    for (const ws of teams) {
      for (const a of ws.amazon?.accounts ?? []) {
        const r = await syncAccount(store, ws, a);
        const fresh = (await store.getWorkspaceById(ws.id)) ?? ws;
        fresh.amazon = { ...(fresh.amazon ?? { accounts: [] }), lastSync: { at: new Date().toISOString(), kinds: r.kinds, errors: r.errors } };
        await store.saveWorkspace(fresh);
        await tellTeam(store, fresh, r);
      }
    }
  });
  return NextResponse.json({ ok: true, teams: teams.length });
}
