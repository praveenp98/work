import { SeasonCard } from "@/components/dash/SeasonCard";
import { marketOf } from "@/lib/season";
import type { Metadata } from "next";
import Link from "next/link";
import { after } from "next/server";
import { headers } from "next/headers";
import { attachPartner, readPartnerCookie } from "@/lib/partners";
import { AskRocco } from "@/components/dash/AskRocco";
import { RoiCard } from "@/components/dash/RoiCard";
import { ReminderCard } from "@/components/dash/ReminderCard";
import { TeamCard } from "@/components/dash/TeamCard";
import { HeroDashboard } from "@/components/home/HeroDashboard";
import { IdentifyTeam } from "@/components/Analytics";
import { AccountsCard } from "@/components/dash/AccountsCard";
import { GoalsCard } from "@/components/dash/GoalsCard";
import { DataHealth } from "@/components/dash/DataHealth";
import { Greeting } from "@/components/dash/Greeting";
import { Office } from "@/components/dash/Office";
import { buildOffice } from "@/lib/office";
import { Numbers } from "@/components/dash/Numbers";
import { acctLabel } from "@/lib/health";
import { StrategyCard } from "@/components/dash/StrategyCard";
import { strategyLines, strategySet } from "@/lib/strategy";
import { slotState } from "@/lib/accounts";
import { currencyOf, localize, money } from "@/lib/currency";
import { extraAccountUrl } from "@/lib/paywall";
import { googleOn } from "@/lib/google";
import { actor, peopleOf, roleOf } from "@/lib/team";
import { slackConfigured } from "@/lib/slack";
import { notFound } from "next/navigation";
import { JobCards } from "@/components/dash/JobCards";
import { canRestock, sendToAmazonUrl } from "@/lib/restock";
import { visitorPricing } from "@/lib/ppp-server";
import { RememberTeam } from "@/components/dash/RememberTeam";
import { ConnectAmazon, ConnectButton, HireCard } from "@/components/start/ConnectAmazon";
import { ModeSwitch } from "@/components/start/ModeSwitch";
import { ReportSteps } from "@/components/start/ReportSteps";
import { StartSteps } from "@/components/start/StartSteps";
import { accessOf, trialHoursLeft } from "@/lib/access";
import { AuditBanner, AuditStart } from "@/components/dash/Audit";
import { auditOf, canStartAudit } from "@/lib/free-audit";
import { trackServer } from "@/lib/track-server";
import { REPORT_HELP } from "@/lib/analyze";
import { datadoeOn, getAccount, loadStatus } from "@/lib/datadoe";
import { howTo } from "@/lib/howto";
import { allow } from "@/lib/human";
import { inboxAddress } from "@/lib/inbox-address";
import { buildJobs } from "@/lib/jobs";
import { basisOf, refreshManager } from "@/lib/manager";
import { accountMemory, applyTuning, tuning } from "@/lib/memory";
import { brainOn } from "@/lib/brain";
import { amazonNote } from "@/lib/messages";
import { hireUrl } from "@/lib/paywall";
import { monthlyCost, PRICE } from "@/lib/pricing";
import type { Proposal } from "@/lib/rules/types";
import { savedPhrase, savingsOf } from "@/lib/savings";
import { cooldown, tagAll, weekTotal } from "@/lib/job-history";
import { getStore } from "@/lib/store";
import type { Snapshot } from "@/lib/store/types";
import { brandSettings, buildBrief, loadWorkspace, rememberToken } from "@/lib/workspace";

export const dynamic = "force-dynamic";

/** Props for the strategy card of one account (lib/strategy.ts). */
function strategyProps(ws: Awaited<ReturnType<typeof loadWorkspace>> & object, brand: string) {
  const raw = ws.brands[brand] ?? {};
  const s = brandSettings(ws, brand);
  return {
    brand,
    init: { mainGoal: raw.mainGoal, targetAcos: s.targetAcos, breakevenAcos: raw.breakevenAcos, monthlyAdBudget: raw.monthlyAdBudget, protectedCampaigns: raw.protectedCampaigns, protectedTerms: raw.protectedTerms, goals: raw.goals, notes: raw.notes },
    plan: strategySet(raw) ? strategyLines(s, ws.autonomy ?? "approve") : null,
    autonomy: ws.autonomy ?? "approve",
  };
}

/** Product words from campaign names that follow "SP | Product | Targeting | …" (Tidy's naming): goal suggestions. */
function productWords(names: string[]): string[] {
  const out = new Map<string, number>();
  for (const n of names) { const p = n.split("|").map((x) => x.trim()); if (p.length >= 3 && p[1] && p[1].length <= 40) out.set(p[1], (out.get(p[1]) ?? 0) + 1); }
  return [...out.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k).slice(0, 8);
}
export const metadata: Metadata = { title: "Your Rocco", description: "Today's fixes for your Amazon account, approved in one tap.", robots: { index: false, follow: false } };

const $ = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const AUDIT_NOTE = "Free audit: connect one Amazon account and I read it once, read-only. You see what I'd do; nothing changes in Amazon.";
const when = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

/**
 * Your Rocco. Three states:
 *  1. Amazon not connected → one Connect Amazon screen (DataDoe). Other ways (Claude, report emails) tucked away.
 *  2. Connected, first data loading → progress + Check now.
 *  3. Data in → dashboard: today's numbers, fixes to approve (Rocco makes them in Amazon), results, upcoming checks.
 */
/** DataDoe allows 3 requests/second for the whole organization: don't spend one on every page view. */
const statusCache = new Map<string, { at: number; v: string }>();
async function cachedStatus(id: string): Promise<string> {
  const c = statusCache.get(id);
  if (c && Date.now() - c.at < 10 * 60_000) return c.v;
  const v = await getAccount(id).then(loadStatus).catch(() => "connected");
  if (!/reconnect/.test(v)) statusCache.set(id, { at: Date.now(), v }); // never cache "needs you to reconnect": they fix it and expect it gone
  return v;
}

export default async function Page({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ brand?: string; welcome?: string; amazon?: string }> }) {
  const { token } = await params;
  const sp = await searchParams;
  const store = getStore();
  if (!store) return <section className="prose"><h1>Memory isn&apos;t switched on yet</h1><p>Rocco&apos;s storage isn&apos;t configured on this server.</p></section>;
  const ws = await loadWorkspace(store, token);
  if (!ws) notFound();
  if (!ws.tokenSealed) await rememberToken(store, ws, token).catch(() => {});
  // Sent by a partner (rocco_partner cookie, set only for approved codes): tag the team before checkout so the code
  // rides along in Dodo's metadata (hireUrl).
  if (attachPartner(ws, readPartnerCookie((await headers()).get("cookie")))) await store.saveWorkspace(ws).catch(() => {});
  const [brief, actions] = await Promise.all([buildBrief(store, ws), store.listActions(ws.id, { limit: 100 })]);
  const access = accessOf(ws);
  // paid = may make changes and run Claude. audit = free read-only audit (lib/free-audit.ts): real jobs, no writes.
  const paid = access === "paid" || access === "trial";
  const audit = auditOf(ws);
  const who = await actor();
  const team = <TeamCard token={token} me={who ? { email: who.email, role: roleOf(ws, who.email) } : null} people={peopleOf(ws)} google={googleOn()} />;
  const hoursLeft = trialHoursLeft(ws);
  const direct = datadoeOn();
  const accounts = direct ? await Promise.all((ws.amazon?.accounts ?? []).map(async (a) => ({ id: a.id, name: a.name, country: a.country, status: await cachedStatus(a.id), ads: a.ads }))) : [];
  // Someone will actually get a message (a linked phone or Slack): only then does the page promise one.
  const pinged = (await store.listPhones({ workspaceId: ws.id, optedIn: true })).length > 0 || !!ws.slack;
  const needsReconnect = accounts.filter((a) => a.status === "needs you to reconnect");
  const note = sp.welcome ? "You're in 🎉 One step left: connect your Amazon." : amazonNote(sp.amazon);
  const empty = !brief.perBrand.some((b) => b.trends.length) && actions.length === 0;

  const otherWays = (
    <details className="rd-other">
      <summary>Other ways to use Rocco</summary>
      <div>
        {ws.mode === "reports" ? <ReportSteps token={token} address={await inboxAddress(store, ws)} initial={ws.inbox ?? []} /> : <StartSteps token={token} compact />}
        <ModeSwitch token={token} mode={ws.mode === "reports" ? "reports" : "claude"} />
      </div>
    </details>
  );

  if (empty) {
    return (
      <section className="rc-page">
        <RememberTeam t={token} />
        <IdentifyTeam team={ws.id} paid={paid} accounts={accounts.length} />
        {access === "none" || (audit && !audit.active && !accounts.length) ? <>
          <HireCard url={hireUrl(ws)} monthlyUrl={hireUrl(ws, "monthly")} where={await visitorPricing()} />
          {direct && canStartAudit(ws) && <AuditStart token={token} />}
        </> : direct ? <ConnectAmazon token={token} accounts={accounts} note={note ?? (audit ? AUDIT_NOTE : undefined)} lastSync={ws.amazon?.lastSync} pinged={pinged} /> : (ws.mode === "reports" ? <ReportSteps token={token} address={await inboxAddress(store, ws)} initial={ws.inbox ?? []} /> : <StartSteps token={token} />)}
        {paid && direct && accounts.length > 0 && <StrategyCard token={token} {...strategyProps(ws, accounts[0].name)} />}
        {(paid || !!audit) && direct && (
          <section className="rc-example" aria-label="Example of your mornings">
            <p className="rc-ex-k">{accounts.length ? "While Amazon sends your data: here's what your mornings will look like" : "Here's what your mornings will look like"}</p>
            <HeroDashboard />
            <p className="fine">Example account. Your real jobs, from your own numbers, show up right here.</p>
          </section>
        )}
        {paid && direct && accounts.length > 0 && <div className="rc-team"><ReminderCard token={token} initial={ws.reminders ?? null} seen={!!ws.seenJobsAt} slackOn={slackConfigured()} title="Ping me when my first jobs are ready" /></div>}
        {paid && <div className="rc-team">{team}</div>}
        <form action="/api/auth/signout" method="post" className="rc-out"><button className="linkbtn muted">Sign out</button></form>
      </section>
    );
  }

  // ---------- Dashboard ----------
  const brands = brief.perBrand.filter((b) => b.trends.length || b.open.length);
  const b = brands.find((x) => x.brand === sp.brand) ?? brands[0] ?? brief.perBrand[0];
  // Money in this account's marketplace currency; Rocco's own price stays USD.
  const cur = currencyOf(ws.amazon?.accounts?.find((a) => a.name === b.brand)?.country ?? ws.amazon?.accounts?.[0]?.country);
  const m = (n: number) => money(n, cur);
  const latest = (k: string): Snapshot | undefined => b.trends.find((t) => t.kind === k)?.latest;
  const prevOf = (k: string): Snapshot | undefined => b.trends.find((t) => t.kind === k)?.previous ?? undefined;
  const st = latest("sp_search_term"), biz = latest("business_report"), inv = latest("inventory"), lh = latest("listing_health");
  const lastCheck = b.trends.map((t) => t.latest.createdAt).sort().at(-1);
  const daysOld = lastCheck ? Math.floor((Date.now() - new Date(lastCheck).getTime()) / 86_400_000) : null;
  const delta = (k: string, f: string, down = false) => {
    const L = latest(k), P = prevOf(k);
    if (!L || !P || new Date(L.createdAt).getTime() - new Date(P.createdAt).getTime() < 20 * 3_600_000) return null; // same-day re-checks aren't a trend
    const a = Number(L.stats[f]), p = Number(P.stats[f]);
    if (!isFinite(a) || !isFinite(p) || !p) return null;
    const d = (a - p) / Math.abs(p);
    if (Math.abs(d) < 0.01) return null;
    return { text: `${d >= 0 ? "▲" : "▼"} ${Math.abs(Math.round(d * 100))}%`, good: down ? d <= 0 : d >= 0 };
  };
  const target = Math.round(b.settings.targetAcos * 100);
  const acos = st ? Math.round(Number(st.stats.acosPct)) : null;
  const tacos = st && biz && Number(biz.stats.sales) > 0 ? Math.round((Number(st.stats.spend) / Number(biz.stats.sales)) * 1000) / 10 : null;
  const kpis = [
    biz && { k: "Total sales · 30d", v: m(Number(biz.stats.sales)), d: delta("business_report", "sales") },
    biz && Number(biz.stats.sessions) > 0 && { k: "Sessions · 30d", v: Number(biz.stats.sessions).toLocaleString("en-US"), d: delta("business_report", "sessions") },
    biz && Number(biz.stats.conversionPct) > 0 && { k: "Conversion", v: `${Number(biz.stats.conversionPct).toFixed(1)}%`, d: delta("business_report", "conversionPct") },
    st && { k: "Ad spend · 30d", v: m(Number(st.stats.spend)), d: delta("sp_search_term", "spend", true) },
    st && { k: "Ad sales · 30d", v: m(Number(st.stats.sales)), d: delta("sp_search_term", "sales") },
    st && acos !== null && { k: `ACoS (SP searches) · target ${target}%`, v: `${acos}%`, d: delta("sp_search_term", "acosPct", true) },
    tacos !== null && { k: "TACoS", v: `${tacos}%`, d: null },
    st && { k: "Wasted / mo", v: m(Number(st.stats.leakMonthly)), d: delta("sp_search_term", "leakMonthly", true) },
  ].filter(Boolean) as { k: string; v: string; d: { text: string; good: boolean } | null }[];

  // What this account taught Rocco (skips, results) decides what's shown; Claude's manager pass decides today's order.
  const tune = tuning(accountMemory(actions, ws.skips), ws.skips);
  const tuned = applyTuning(b.open, tune);
  // Day to day (lib/job-history.ts): nothing changed in the last 7 days comes back; each item says new / repeat / follow-up.
  const allRuns = (await store.listRuns(ws.id, { limit: 60 })).filter((r) => r.brand === b.brand);
  const latestIds = new Set<string>(); const kindsSeen = new Set<string>();
  for (const r of allRuns) if (!kindsSeen.has(r.kind)) { kindsSeen.add(r.kind); latestIds.add(r.id); }
  const brandActions = actions.filter((a) => a.brand === b.brand);
  const { kept: shown, cooling } = cooldown(tuned.shown, brandActions);
  const held = tuned.held;
  const tags = tagAll(shown, allRuns.filter((r) => !latestIds.has(r.id)), brandActions);
  const week = weekTotal(allRuns, brandActions);
  const byCode = new Map(shown.map((p) => [p.code, p]));
  const plan = ws.manager?.[b.brand];
  const planOk = plan && plan.picks.length > 0 && plan.picks.every((pk) => pk.codes.every((c) => byCode.has(c)));
  if (paid && brainOn() && shown.length && (!plan || plan.basis !== basisOf(shown)) && allow(`mgr:${ws.id}`, 1, 30 * 60_000)) {
    after(() => refreshManager(store, ws.id).catch(() => 0)); // fresh plan for the next visit
  }
  // Today's work as jobs (lib/jobs.ts): grouped the way a manager works, ordered by Claude's picks, then risks, then money.
  const jobs = buildJobs(shown, { plan: planOk ? plan : null, inv, biz, lh })
    .map((j) => (j.mode === "manual" && !j.steps && j.codes[0] && byCode.get(j.codes[0]) ? { ...j, steps: howTo(byCode.get(j.codes[0])!) } : j))
    .map((j) => ({ ...j, items: j.items.map((it) => (tags[it.code] ? { ...it, tag: tags[it.code] } : it)) }));
  const fixCount = shown.length;
  // The plan this account actually pays for; unknown counts as monthly (the higher monthly price, so ROI is never flattered).
  const billingPlan = ws.plan ?? "monthly";
  // Value measured in the last 30 days (results checked in that window), the ROI card's headline.
  const last30 = savingsOf(actions.filter((a) => a.brand === b.brand && a.result && Date.now() - new Date(a.result.checkedAt).getTime() < 30 * 86_400_000));
  const months = ws.hiredAt ? Math.max(1, Math.ceil((Date.now() - new Date(ws.hiredAt).getTime()) / (30 * 86_400_000))) : 1;
  const shownValue = shown.reduce((t, p) => t + p.valueMonthly, 0);
  // Approve-by-text unlocks once they've looked at today's work here (not before).
  // Free audit: the first time its real jobs are shown (funnel: audit_ready).
  if (audit && jobs.length && !ws.audit?.readyAt) { const at = new Date().toISOString(); after(async () => { const f = await store.getWorkspaceById(ws.id); if (f?.audit && !f.audit.readyAt) { f.audit = { ...f.audit, readyAt: at }; await store.saveWorkspace(f); trackServer(ws.id, "audit_ready", { jobs: jobs.length }); } }); }
  if (paid && jobs.length && !ws.seenJobsAt) { const seen = new Date().toISOString(); after(async () => { const f = await store.getWorkspaceById(ws.id); if (f && !f.seenJobsAt) { f.seenJobsAt = seen; await store.saveWorkspace(f); } }); }
  const isDirect = direct && !!ws.amazon?.accounts?.length; // Rocco makes the changes in Amazon (DataDoe); else exact steps
  const coming = actions.filter((a) => a.status === "applied" || a.status === "not_enough_data").sort((x, y) => x.followUpAt.localeCompare(y.followUpAt)).slice(0, 4);
  const recent = actions.filter((a) => a.result).slice(0, 4);
  const account = ws.amazon?.accounts?.find((a) => a.name === b.brand) ?? ws.amazon?.accounts?.[0];
  const dailyNums = account ? ws.amazon?.daily?.[account.id] : undefined;
  // Search terms table: biggest spenders with Rocco's action on each (like a manager's console).
  const actFor = new Map<string, { act: string; tone: string }>();
  for (const p of shown) {
    const k = p.target.toLowerCase();
    if (p.kind === "negative") actFor.set(k, { act: "Block", tone: "bad" });
    else if (p.kind === "harvest") actFor.set(k, { act: "Harvest to exact", tone: "win" });
    else if (p.kind === "bid" && typeof p.proposed === "number" && typeof p.current === "number") actFor.set(k, { act: `Bid ${p.proposed < p.current ? "↓" : "↑"} $${p.proposed.toFixed(2)}`, tone: "warn" });
  }
  const termRows = ((st?.extra?.terms ?? []) as { t: string; s: number; sa: number; o: number; c: number }[]).slice().sort((x, y) => y.s - x.s).slice(0, 12);
  const terms = termRows.map((r) => ({ ...r, ...(actFor.get(r.t.toLowerCase()) ?? (r.sa > 0 && r.s / r.sa <= b.settings.targetAcos ? { act: "On goal · keep", tone: "ok" } : r.o === 0 ? { act: "Watching (needs more clicks)", tone: "ok" } : { act: "Above target · watching", tone: "warn" })) }));
  // Ad jobs need the two Amazon Ads reports. Say so plainly when they're missing, instead of a page of steps-only jobs.
  const hasAds = b.trends.some((t) => t.kind === "sp_search_term" || t.kind === "sp_campaign");
  const adsState: "off" | "loading" | null = !isDirect || !account || hasAds ? null : account.ads === false ? "off" : "loading";
  const adsErr = (account && ws.amazon?.syncs?.[account.id]?.errors.find((e) => /^sp_/.test(e) && /% loaded/.test(e))) ?? "";
  const adsProgress = Number(adsErr.match(/(\d+)% loaded/)?.[1] ?? 0) || null;
  const hidden = brief.perBrand.reduce((t, x) => t + x.hidden, 0);
  const hiddenValue = brief.perBrand.reduce((t, x) => t + (x.hiddenValue ?? 0), 0);

  // Rocco's office: only real events (pulls, analyses, jobs, changes, results) for this account.
  const nextRun = new Date(); nextRun.setUTCHours(13, 0, 0, 0); if (nextRun.getTime() < Date.now()) nextRun.setUTCDate(nextRun.getUTCDate() + 1);
  const office = buildOffice({
    syncs: [account && ws.amazon?.syncs?.[account.id]].filter((x): x is { at: string; kinds: string[]; errors: string[] } => !!x),
    snaps: b.trends.map((t) => t.latest),
    open: { count: jobs.length, valueMonthly: shownValue, fmt: m },
    actions: actions.filter((a) => a.brand === b.brand).map((a) => ({ code: a.code, appliedAt: a.appliedAt, followUpAt: a.followUpAt, status: a.status, target: a.proposal?.target, result: a.result })),
    nextRunAt: nextRun.toISOString(),
  });
  return (
    <section className="rd">
      <RememberTeam t={token} />
      <header className="rd-bar">
        <div className="rd-acct">
          <span className="rd-dot" aria-hidden />
          <b>{account ? acctLabel(account) : b.brand === "main" ? "Your Amazon" : b.brand}</b>
          <small>{lastCheck ? `checked ${daysOld === 0 ? "today" : daysOld === 1 ? "yesterday" : `${daysOld} days ago`}` : "not checked yet"}</small>
        </div>
        {brands.length > 1 && <nav className="rd-tabs" aria-label="Accounts">{brands.map((x) => <Link key={x.brand} href={`/w/${token}?brand=${encodeURIComponent(x.brand)}`} className={x.brand === b.brand ? "on" : ""}>{x.brand}</Link>)}</nav>}
      </header>

      {paid && <Office events={office.events} state={office.state} />}
      {isDirect && <DataHealth token={token} brand={b.brand} />}
      {paid && !strategySet(ws.brands[b.brand]) && <StrategyCard token={token} {...strategyProps(ws, b.brand)} suggestions={productWords(b.open.map((p) => p.campaign))} startOpen />}

      {needsReconnect.map((a) => (
        <div key={a.id} className="rd-offer warn">
          <div><b>Amazon stopped sharing {a.name}&apos;s data.</b><span>This happens every few months. Reconnect in one tap: your history and settings stay.</span></div>
          <ConnectButton token={token} reconnect={a.id} label="Reconnect Amazon" className="btn" />
        </div>
      ))}
      {audit && <AuditBanner url={hireUrl(ws)} active={audit.active} daysLeft={audit.daysLeft} />}
      {access === "none" && (
        <div className="rd-offer">
          <div><b>{hidden ? `Your plan has ended. ${hidden} fix${hidden === 1 ? "" : "es"} worth ~${m(hiddenValue)}/mo are waiting.` : "Your plan has ended."}</b><span>Rehire me to keep the daily checks and approvals: {PRICE.short}, {PRICE.then}.</span></div>
          <a className="btn" href={hireUrl(ws)}>Rehire Rocco</a>
        </div>
      )}
      {hoursLeft !== null && <p className="rd-note">Free trial: {hoursLeft > 24 ? `${Math.ceil(hoursLeft / 24)} days` : `${hoursLeft} hours`} left.</p>}

      <div className="rd-hero">
        <Greeting className="rd-kicker" />
        <h1>{jobs.length ? (shownValue >= 1 ? <>{jobs.length} job{jobs.length === 1 ? "" : "s"} today, worth <em>~{m(shownValue)}/mo</em>.</> : <>{jobs.length} job{jobs.length === 1 ? "" : "s"} today to <em>protect your sales</em>.</>) : "All clear today."}</h1>
        {planOk && plan!.brief && <p className="rd-brief">{localize(plan!.brief, cur)}</p>}
        {acos !== null && (
          <div className="rd-acos" aria-label={`ACoS ${acos}%, target ${target}%`}>
            <div className="rd-acos-bar"><i style={{ width: `${Math.min(100, (acos / Math.max(target * 2, 1)) * 100)}%` }} className={acos > target ? "over" : ""} /><span style={{ left: "50%" }} /></div>
            <small>ACoS <b>{acos}%</b> · target {target}% · Sponsored Products searches, last 30 days</small>
          </div>
        )}
      </div>

      {paid && <RoiCard cur={cur} realized={last30.total} realizedMeasured={last30.measured} found={shownValue} plan={billingPlan} costMonthly={monthlyCost(billingPlan)} acos={acos} target={target} adSpend={st ? Number(st.stats.spend) : null} />}

      {dailyNums && Object.keys(dailyNums).length >= 3 ? <Numbers daily={dailyNums} sym={cur.symbol.trim()} target={brandSettings(ws, b.brand).targetAcos} costs={{ href: `/w/${token}/products${account ? `?account=${account.id}` : ""}`, missing: (account ? ws.amazon?.products?.[account.id]?.items ?? [] : []).filter((x) => x.cogsMissing).map((x) => x.title.slice(0, 40)) }} /> : <ul className="rd-kpis">{kpis.map((x) => <li key={x.k}><span>{x.k}</span><b>{x.v}</b>{x.d && <small className={x.d.good ? "good" : "bad"}>{x.d.text}</small>}</li>)}</ul>}


      {access !== "none" && <SeasonCard market={marketOf(account?.country)} token={token} jobKinds={jobs.map((j) => j.kind)} />}

      <div className="rd-grid">
        <div>
          {jobs.length > 0 ? <JobCards locked={audit ? { url: hireUrl(ws), price: PRICE.from, found: shownValue >= 1 ? `~${m(shownValue)}/mo` : undefined } : undefined} following={(() => { const bs = brandSettings(ws, b.brand); const g = bs.mainGoal ?? "balance"; return `${g[0].toUpperCase()}${g.slice(1)} · ${Math.round((bs.targetAcos ?? 0.3) * 100)}% target ACoS${bs.monthlyAdBudget ? ` · ad budget cap ${m(bs.monthlyAdBudget)}/mo` : ""}${strategySet(ws.brands[b.brand]) ? "" : " (my defaults: set your strategy above)"}`; })()} week={{ ...week, cooling }} token={token} brand={b.brand} jobs={JSON.parse(localize(JSON.stringify(jobs), cur))} direct={isDirect} cur={cur} restock={isDirect && account && canRestock(account.country) ? { token, account: account.id, country: account.country, from: ws.shipFrom?.[account.id], sendUrl: sendToAmazonUrl(account.country), recent: (ws.restocks ?? []).filter((r) => r.account === account.id && Date.now() - new Date(r.at).getTime() < 7 * 86_400_000).map(({ id, at, status, items, name, by }) => ({ id, at, status, items, name, by })) } : undefined} /> : <div className="rd-empty"><b>Nothing worth changing today.</b><span>I&apos;ll check again tomorrow morning.</span></div>}
          {isDirect && (
            <Link className="rd-tidy" href={`/w/${token}/tidy`}>
              <span aria-hidden>🗂️</span>
              <span><b>Tidy your campaigns</b><small>One naming system, one portfolio per product. Read 200 campaigns at a glance.</small></span>
              <span className="go">→</span>
            </Link>
          )}
          {held > 0 && <p className="fine">I held back {held} fix{held === 1 ? "" : "es"} this account usually skips or that didn&apos;t work here before.</p>}
          {b.hidden > 0 && (
            <div className="rd-locked"><span>🔒 <b>{b.hidden} more fix{b.hidden === 1 ? "" : "es"}</b>{b.hiddenValue ? <> worth ~<b>{m(b.hiddenValue)}/mo</b></> : null}</span><a className="btn small" href={hireUrl(ws)}>Unlock · {PRICE.from}</a></div>
          )}
          {terms.length > 0 && (
            <section className="rd-card rd-terms">
              <h3>Search terms · last 30 days</h3>
              <p className="fine">The {terms.length} biggest spenders, and what I&apos;m doing about each.</p>
              <div className="dm-tw"><table className="dm-t"><thead><tr><th>Search term</th><th>Clicks</th><th>Spend</th><th>Orders</th><th>ACoS</th><th>Rocco</th></tr></thead>
                <tbody>{terms.map((r) => <tr key={r.t}><td>{r.t}</td><td>{r.c.toLocaleString("en-US")}</td><td>{m(r.s)}</td><td>{r.o}</td><td>{r.sa > 0 ? `${Math.round((r.s / r.sa) * 100)}%` : "—"}</td><td><span className={`dm-tag t-${r.tone}`}>{r.act}</span></td></tr>)}</tbody></table></div>
              <p className="fine"><Link href={`/w/${token}/analytics`}>All terms and trends →</Link></p>
            </section>
          )}
        </div>

        <aside className="rd-side">
          {paid && strategySet(ws.brands[b.brand]) && <StrategyCard token={token} {...strategyProps(ws, b.brand)} suggestions={productWords(b.open.map((p) => p.campaign))} />}
          {paid && brainOn() && <AskRocco token={token} brand={b.brand} examples={["What should I do first today?", "Why did ad spend change?", "What worked last month?"]} />}
          <section className="rd-card">
            <h3>What worked</h3>
            {brief.totals.applied > 0 ? <p className="fine">{brief.totals.worked} of {brief.totals.applied} changes worked{brief.saved > 0 ? ` · ${savedPhrase({ measured: brief.savedMeasured, estimated: brief.savedEstimated })}` : ""}.</p> : <p className="fine">Approve a fix and I measure what it did a week later.</p>}
            {recent.map((a) => <p key={a.id} className={`rd-res s-${a.status}`}><b>{a.code}</b> {a.result!.summary.slice(0, 90)}</p>)}
          </section>
          <section className="rd-card">
            <h3>Coming up</h3>
            {coming.length ? <ul className="rd-coming">{coming.map((a) => <li key={a.id}><span>{when(a.followUpAt)}</span>Check {a.code}: {a.proposal.target.slice(0, 40)}</li>)}</ul> : <p className="fine">Results checks show up here after you approve fixes.</p>}
            {brief.season && <p className="fine">📅 {brief.season}</p>}
          </section>
          {paid && (
            <details className="rd-set" id="settings">
              <summary><span>⚙️ Settings</span><small>Team · goals &amp; autonomy · Amazon accounts · messages</small></summary>
          {team}
          {<GoalsCard token={token} brand={b.brand} target={brandSettings(ws, b.brand).targetAcos} initial={ws.brands[b.brand]?.goals ?? []} suggestions={productWords(b.open.map((p) => p.campaign))} autoUndo={!!ws.autoUndo} autonomy={ws.autonomy ?? "approve"} />}
          {direct && <AccountsCard token={token} accounts={accounts.map((a) => ({ id: a.id, name: a.name, country: a.country }))} slots={slotState(ws)} owner={!!who && roleOf(ws, who.email) === "owner"} extraUrl={extraAccountUrl(ws)} />}
          {<ReminderCard token={token} initial={ws.reminders ?? null} seen={!!ws.seenJobsAt || jobs.length > 0} slackOn={slackConfigured()} sample={{ value: shownValue >= 1 ? m(shownValue) : "", jobs: jobs.map((j) => ({ title: localize(j.title, cur), codes: j.mode === "manual" ? [] : j.codes })) }} />}
            </details>
          )}
        </aside>
      </div>

      {!direct && b.stale.length > 0 && <p className="fine">Not refreshed in 7+ days: {b.stale.map((k) => REPORT_HELP[k].name).join(", ")}.</p>}
      <footer className="rd-foot">
        <form action="/api/auth/signout" method="post"><button className="linkbtn muted">Sign out</button></form>
      </footer>
    </section>
  );
}

