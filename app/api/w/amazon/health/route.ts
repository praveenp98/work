import { NextResponse } from "next/server";
import { datadoeOn, getAccount, type DoeAccount } from "@/lib/datadoe";
import { accountHealth, REPORTS, type ReportKind } from "@/lib/health";
import { allow } from "@/lib/human";
import { getStore } from "@/lib/store";
import { loadWorkspace } from "@/lib/workspace";

/** Data health for the dashboard (lib/health.ts): live DataDoe status + what Rocco has pulled, per account and report. */
export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as { t?: string };
  const store = getStore();
  const ws = store && b.t ? await loadWorkspace(store, b.t) : null;
  if (!store || !ws) return NextResponse.json({ ok: false }, { status: 400 });
  if (!allow(`health:${ws.id}`, 30, 60 * 60_000)) return NextResponse.json({ ok: false, error: "Checked a lot just now. Try again in a few minutes." }, { status: 429 });
  const accounts = ws.amazon?.accounts ?? [];
  if (!datadoeOn() || !accounts.length) return NextResponse.json({ ok: true, accounts: [] });
  let changed = false;
  const out = await Promise.all(accounts.map(async (a) => {
    const doe: DoeAccount | null = await getAccount(a.id).catch(() => null);
    // Keep Rocco's "Ads connected?" in step with Amazon (accounts attached before this existed have no flag).
    if (doe && a.ads !== !!doe.amazonAdsConnection) { a.ads = !!doe.amazonAdsConnection; changed = true; }
    const latestAt: Partial<Record<ReportKind, string>> = {};
    for (const r of REPORTS) {
      const s = (await store.listSnapshots(ws.id, { brand: a.name, kind: r.kind, limit: 1 }))[0];
      if (s) latestAt[r.kind] = s.createdAt;
    }
    return accountHealth({ account: a, doe, sync: ws.amazon?.syncs?.[a.id] ?? (accounts.length === 1 ? ws.amazon?.lastSync : undefined), latestAt });
  }));
  if (changed) await store.saveWorkspace(ws);
  return NextResponse.json({ ok: true, accounts: out, lastSync: ws.amazon?.lastSync?.at ?? null });
}
