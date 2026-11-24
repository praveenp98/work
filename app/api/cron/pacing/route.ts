import Papa from "papaparse";
import { NextResponse } from "next/server";
import { hasAccess } from "@/lib/access";
import { datadoeOn } from "@/lib/datadoe";
import { exportCsv, findSource, splitBySeller, type Pull } from "@/lib/datadoe-sync";
import { notifyTeam } from "@/lib/notify";
import { pacingAlerts, pacingMessage } from "@/lib/pacing";
import { targetFor } from "@/lib/rules/settings";
import { secretOk } from "@/lib/security";
import { getStore } from "@/lib/store";
import { brandSettings, teamUrl } from "@/lib/workspace";

/**
 * Midday budget pacing (lib/pacing.ts). Vercel Cron, once a day at 18:30 UTC = 1:30 PM US Eastern / 10:30 AM Pacific,
 * after DataDoe's 1pm refresh of Amazon Ads performance. Covers US, CA, MX accounts (Vercel Hobby crons run once a day;
 * other marketplaces need their own midday run: docs/COMPETITOR-DRPPC.md). One export per 10 accounts, one message per
 * account per day, only for teams with reminders on.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const TZ: Record<string, string> = { US: "America/Chicago", CA: "America/Toronto", MX: "America/Mexico_City" };
const PULL: Pull = {
  kind: "sp_campaign", table: "amazon_ads_performance_by_campaign_by_date", query: "campaign", days: 1, shape: "sum_by_campaign",
  cols: { date: "_date", ad_campaign_name: "Campaign Name", ad_campaign_budget_amount: "Budget", ad_spend: "Spend", ad_sales: "7 Day Total Sales" },
};
const num = (v: unknown) => { const n = Number(String(v ?? "").replace(/[$,\s]/g, "")); return Number.isFinite(n) ? n : 0; };

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && !secretOk(req.headers.get("authorization")?.replace(/^Bearer\s+/i, ""), secret)) return NextResponse.json({ ok: false }, { status: 401 });
  if (!secret && process.env.NODE_ENV === "production") return NextResponse.json({ ok: false }, { status: 503 });
  const store = getStore();
  if (!store || !datadoeOn()) return NextResponse.json({ ok: false, error: "not configured" }, { status: 503 });
  const now = new Date();
  const teams = (await store.listAmazonWorkspaces()).filter((ws) => hasAccess(ws) && ws.reminders?.cadence !== "off" && ws.reminders?.channel);
  const jobs = teams.flatMap((ws) => (ws.amazon?.accounts ?? []).filter((a) => TZ[a.country] && ws.pacedOn?.[a.id] !== now.toISOString().slice(0, 10)).map((a) => ({ ws, a })));
  let sent = 0;
  for (let i = 0; i < jobs.length; i += 10) {
    const group = jobs.slice(i, i + 10);
    try {
      const src = await findSource(group[0].a.id, PULL);
      if (!src) continue;
      // "Today" in the marketplace's time zone (US Central covers the 4 US zones well enough at midday).
      const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago" }).format(now);
      const rows = Papa.parse<Record<string, unknown>>(await exportCsv(group.map((g) => g.a.id), src, PULL, now, { from: today, to: today }), { header: true, skipEmptyLines: true }).data;
      const by = splitBySeller(rows, group.map((g) => g.a.id));
      for (const { ws, a } of group) {
        const mine = (by.get(a.id) ?? []).filter((r) => String(r.date ?? "").slice(0, 10) === today);
        const camps = new Map<string, { campaign: string; budget: number; spend: number; sales: number }>();
        for (const r of mine) {
          const k = String(r.ad_campaign_name ?? "");
          const c = camps.get(k) ?? { campaign: k, budget: num(r.ad_campaign_budget_amount), spend: 0, sales: 0 };
          c.spend += num(r.ad_spend); c.sales += num(r.ad_sales); camps.set(k, c);
        }
        const s = brandSettings(ws, a.name);
        const hour = Number(new Intl.DateTimeFormat("en-US", { timeZone: TZ[a.country], hour: "numeric", hourCycle: "h23" }).format(now));
        const alerts = pacingAlerts([...camps.values()], { localHour: hour, targetAcos: s.targetAcos, targetFor: (c) => targetFor({ targetAcos: s.targetAcos, goals: s.goals }, c) });
        if (!alerts.length) continue;
        const fresh = (await store.getWorkspaceById(ws.id)) ?? ws;
        fresh.pacedOn = { ...(fresh.pacedOn ?? {}), [a.id]: now.toISOString().slice(0, 10) };
        await store.saveWorkspace(fresh);
        if (await notifyTeam(store, fresh, [pacingMessage(a.name, alerts, teamUrl(fresh))])) sent++;
      }
    } catch (e) {
      console.warn(`[pacing] group ${i / 10} failed: ${e instanceof Error ? e.message.slice(0, 160) : e}`);
    }
  }
  return NextResponse.json({ ok: true, accounts: jobs.length, sent });
}
