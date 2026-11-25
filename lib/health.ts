import type { DoeAccount } from "./datadoe";

/**
 * Data health: for each connected Amazon account, which of the 4 reports Rocco reads have arrived, when, and if not,
 * exactly why (with the fix). Shown on the dashboard so nobody stares at "on the way" for two days.
 * Inputs: DataDoe's live account status (connections + first-load stage), Rocco's last pull per account
 * (ws.amazon.syncs: kinds that came in, errors per kind), and the latest saved snapshot per report.
 */
/** "Habit Nest US · US" → "Habit Nest US": add the country only when the name doesn't already end with it. */
export const acctLabel = (a: { name: string; country: string }) => (new RegExp(`\\b${a.country}$`, "i").test(a.name.trim()) ? a.name : `${a.name} · ${a.country}`);

export type ReportKind = "business_report" | "inventory" | "sp_search_term" | "sp_campaign";
export const REPORTS: { kind: ReportKind; name: string; needs: "sc" | "ads"; powers: string }[] = [
  { kind: "business_report", name: "Sales & traffic", needs: "sc", powers: "sales, conversion, Buy Box" },
  { kind: "inventory", name: "FBA stock", needs: "sc", powers: "restock, low-stock ads" },
  { kind: "sp_search_term", name: "Ad search terms", needs: "ads", powers: "wasted searches, bids, new exact campaigns" },
  { kind: "sp_campaign", name: "Ad campaigns", needs: "ads", powers: "budgets" },
];

export type State = "ok" | "loading" | "missing" | "off" | "error";
export interface ReportHealth { kind: ReportKind; name: string; powers: string; state: State; at?: string; why?: string; fix?: string }
export interface ConnHealth { state: "ok" | "loading" | "off" | "reauth"; stage?: string }
export interface AccountHealth { id: string; name: string; country: string; sc: ConnHealth; ads: ConnHealth; reports: ReportHealth[]; lastPull?: string; summary: string; allOk: boolean }

const conn = (c: DoeAccount["sellerCentralConnection"] | undefined | null, known: boolean): ConnHealth =>
  !known ? { state: "loading" } : !c ? { state: "off" } : c.needsReauthorization ? { state: "reauth" } : c.initialLoadComplete ? { state: "ok" } : { state: "loading", stage: c.initialLoadStage };

export function accountHealth(o: {
  account: { id: string; name: string; country: string; ads?: boolean };
  doe: DoeAccount | null; // live status (null = DataDoe didn't answer)
  sync?: { at: string; kinds: string[]; errors: string[] };
  latestAt: Partial<Record<ReportKind, string>>; // newest saved snapshot per report
}): AccountHealth {
  const known = !!o.doe;
  const sc = conn(o.doe?.sellerCentralConnection, known);
  const ads = known ? conn(o.doe?.amazonAdsConnection, true) : o.account.ads === false ? { state: "off" as const } : { state: "loading" as const };
  const reports = REPORTS.map((r): ReportHealth => {
    const at = o.latestAt[r.kind];
    const c = r.needs === "ads" ? ads : sc;
    const err = o.sync?.errors.find((e) => e.startsWith(`${r.kind}:`))?.slice(r.kind.length + 1).trim();
    const base = { kind: r.kind, name: r.name, powers: r.powers };
    if (at && (!err || o.sync?.kinds.includes(r.kind))) return { ...base, state: "ok", at };
    if (c.state === "reauth") return { ...base, state: "error", at, why: "Amazon stopped sharing this data.", fix: "Tap Reconnect Amazon. Your history and settings stay." };
    if (c.state === "off") return r.needs === "ads"
      ? { ...base, state: "off", at, why: "Amazon Ads isn't connected for this account.", fix: "Connect Amazon Ads (one sign-in). Ad jobs need it." }
      : { ...base, state: "off", at, why: "Seller Central isn't connected.", fix: "Reconnect Amazon." };
    if (c.state === "loading") return { ...base, state: "loading", at, why: `Amazon is still sending the first ${r.needs === "ads" ? "Ads" : "Seller Central"} history${c.stage ? ` (${c.stage.toLowerCase().replace(/_/g, " ")})` : ""}.`, fix: "Usually ready within 48 hours of connecting; DataDoe emails when it's done. Nothing to do." };
    // Connection says loaded, but no data reached Rocco: say why.
    if (!o.sync) return { ...base, state: "missing", at, why: "Not pulled yet.", fix: "Tap Check connection now." };
    if (/Amazon Ads not connected|requires an Amazon Ads connection/i.test(err ?? "")) return { ...base, state: "missing", at, why: "The last pull tripped over another account on your team that has no Amazon Ads connection. Fixed: I now pull each account's ads on its own.", fix: "Tap Check connection now to pull again." };
    if (/not available/i.test(err ?? "")) return { ...base, state: "missing", at, why: "This table isn't switched on for the account.", fix: `Owner: DataDoe → Settings → Data → turn on the ${r.needs === "ads" ? "Amazon Ads" : "Seller Central"} tables Rocco reads (docs/FOUNDER-TEST.md), then Check connection now.` };
    if (/Export source is disabled|table in DataDoe settings/i.test(err ?? "")) {
      const table = err?.match(/disabled the "([^"]+)" table/)?.[1] ?? (r.needs === "ads" ? "Amazon Ads" : "Seller Central");
      return { ...base, state: "error", at, why: `The "${table}" data feed is switched off on Rocco's side, so this report can't come in.`, fix: `Nothing for you to do if you're a customer: Rocco's team switches it back on. (Admin: DataDoe → Settings → Data tables → turn on "${table}", then Check connection now.)` };
    }
    const pct = err?.match(/(\d+)% loaded/)?.[1];
    if (pct) return { ...base, state: "loading", at, why: `History ${pct}% loaded.`, fix: "It fills in by itself. Check again later today." };
    if (/no rows/i.test(err ?? "")) return { ...base, state: "missing", at, why: r.needs === "ads" ? "Amazon Ads is connected but sent no rows for this account (no Sponsored Products in 30 days, the ads tables are off in DataDoe, or Ads is linked to a different Amazon account)." : "Amazon sent no rows for this report.", fix: r.needs === "ads" ? "Check DataDoe → this account → Amazon Ads shows the right advertiser, and the ads tables are on. Then Check connection now." : "Check connection now. If it stays empty, email human@rocco.works." };
    if (err) return { ...base, state: "error", at, why: "The last pull from Amazon failed.", fix: "Tap Check connection now. If it keeps failing, email human@rocco.works and I'll look at it." };
    return { ...base, state: "missing", at, why: "Not in the last pull.", fix: "Check connection now." };
  });
  const missing = reports.filter((r) => r.state !== "ok");
  const allOk = !missing.length;
  const summary = allOk ? "All 4 reports flowing"
    : missing.every((r) => r.state === "loading") ? `${4 - missing.length} of 4 reports in, the rest still loading`
    : `${4 - missing.length} of 4 reports in · ${missing.length} need${missing.length === 1 ? "s" : ""} attention`;
  return { id: o.account.id, name: o.account.name, country: o.account.country, sc, ads, reports, lastPull: o.sync?.at, summary, allOk };
}
