import Papa from "papaparse";
import { NextResponse } from "next/server";
import { hasAccess } from "@/lib/access";
import { currencyOf } from "@/lib/currency";
import { datadoeOn } from "@/lib/datadoe";
import { exportCsv, findSource, splitBySeller, type Pull } from "@/lib/datadoe-sync";
import { notifyTeam } from "@/lib/notify";
import { pacingAlerts, pacingMessage } from "@/lib/pacing";
import { targetFor } from "@/lib/rules/settings";
import { secretOk } from "@/lib/security";
import { getStore } from "@/lib/store";
import { brandSettings, teamUrl } from "@/lib/workspace";

/**
 * Midday budget pacing (lib/pacing.ts). Vercel Cron every hour (Pro plan); each run handles the accounts whose
 * marketplace is at 1 PM local, right after DataDoe's 1pm refresh of Amazon Ads performance. Every marketplace.
 * One export per 10 accounts in the same time zone, one message per account per day, only for teams with reminders on.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const TZ: Record<string, string> = {
  US: "America/Chicago", CA: "America/Toronto", MX: "America/Mexico_City", BR: "America/Sao_Paulo",
  UK: "Europe/London", GB: "Europe/London", IE: "Europe/Dublin", DE: "Europe/Berlin", FR: "Europe/Paris", IT: "Europe/Rome", ES: "Europe/Madrid",
  NL: "Europe/Amsterdam", BE: "Europe/Brussels", SE: "Europe/Stockholm", PL: "Europe/Warsaw", TR: "Europe/Istanbul",
  IN: "Asia/Kolkata", AE: "Asia/Dubai", SA: "Asia/Riyadh", EG: "Africa/Cairo", ZA: "Africa/Johannesburg",
  JP: "Asia/Tokyo", SG: "Asia/Singapore", AU: "Australia/Sydney",
};
const localHour = (tz: string, d: Date) => Number(new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", hourCycle: "h23" }).format(d));
const localDay = (tz: string, d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(d);
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
  // Accounts at 1 PM local right now (?force=1 runs every account: for testing).
  const force = new URL(req.url).searchParams.get("force") === "1";
  const all = teams.flatMap((ws) => (ws.amazon?.accounts ?? []).filter((a) => TZ[a.country] && (force || localHour(TZ[a.country], now) === 13) && ws.pacedOn?.[a.id] !== localDay(TZ[a.country], now)).map((a) => ({ ws, a, tz: TZ[a.country] })));
  const byTz = new Map<string, typeof all>();
  for (const j of all) byTz.set(j.tz, [...(byTz.get(j.tz) ?? []), j]);
  const groups = [...byTz.values()].flatMap((g) => Array.from({ length: Math.ceil(g.length / 10) }, (_, k) => g.slice(k * 10, k * 10 + 10)));
  const jobs = all;
  let sent = 0;
  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    try {
      const src = await findSource(group[0].a.id, PULL);
      if (!src) continue;
      const today = localDay(group[0].tz, now); // "today" in the marketplace's time zone
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
        const hour = localHour(TZ[a.country], now);
        const alerts = pacingAlerts([...camps.values()], { localHour: hour, targetAcos: s.targetAcos, targetFor: (c) => targetFor({ targetAcos: s.targetAcos, goals: s.goals }, c) });
        if (!alerts.length) continue;
        const fresh = (await store.getWorkspaceById(ws.id)) ?? ws;
        fresh.pacedOn = { ...(fresh.pacedOn ?? {}), [a.id]: today };
        await store.saveWorkspace(fresh);
        if (await notifyTeam(store, fresh, [pacingMessage(a.name, alerts, teamUrl(fresh), currencyOf(a.country).symbol)])) sent++;
      }
    } catch (e) {
      console.warn(`[pacing] group ${i} failed: ${e instanceof Error ? e.message.slice(0, 160) : e}`);
    }
  }
  return NextResponse.json({ ok: true, accounts: jobs.length, sent });
}
