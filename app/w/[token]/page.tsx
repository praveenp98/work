import type { Metadata } from "next";
import Link from "next/link";
import { after } from "next/server";
import { AskRocco } from "@/components/dash/AskRocco";
import { RoiCard } from "@/components/dash/RoiCard";
import { ReminderCard } from "@/components/dash/ReminderCard";
import { TeamCard } from "@/components/dash/TeamCard";
import { HeroDashboard } from "@/components/home/HeroDashboard";
import { IdentifyTeam } from "@/components/Analytics";
import { AccountsCard } from "@/components/dash/AccountsCard";
import { slotState } from "@/lib/accounts";
import { currencyOf, localize, money } from "@/lib/currency";
import { extraAccountUrl } from "@/lib/paywall";
import { googleOn } from "@/lib/google";
import { actor, peopleOf, roleOf } from "@/lib/team";
import { slackConfigured } from "@/lib/slack";
import { notFound } from "next/navigation";
import { JobCards } from "@/components/dash/JobCards";
import { canRestock, sendToAmazonUrl } from "@/lib/restock";
import { RememberTeam } from "@/components/dash/RememberTeam";
import { ConnectAmazon, ConnectButton, HireCard } from "@/components/start/ConnectAmazon";
import { ModeSwitch } from "@/components/start/ModeSwitch";
import { ReportSteps } from "@/components/start/ReportSteps";
import { StartSteps } from "@/components/start/StartSteps";
import { accessOf, trialHoursLeft } from "@/lib/access";
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
import { savedPhrase } from "@/lib/savings";
import { getStore } from "@/lib/store";
import type { Snapshot } from "@/lib/store/types";
import { buildBrief, loadWorkspace, rememberToken } from "@/lib/workspace";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your Rocco", description: "Today's fixes for your Amazon account, approved in one tap.", robots: { index: false, follow: false } };

const $ = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
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
  const [brief, actions] = await Promise.all([buildBrief(store, ws), store.listActions(ws.id, { limit: 100 })]);
  const access = accessOf(ws);
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
        <IdentifyTeam team={ws.id} paid={access !== "none"} accounts={accounts.length} />
        {access === "none" ? <HireCard url={hireUrl(ws)} monthlyUrl={hireUrl(ws, "monthly")} /> : direct ? <ConnectAmazon token={token} accounts={accounts} note={note} lastSync={ws.amazon?.lastSync} pinged={pinged} /> : (ws.mode === "reports" ? <ReportSteps token={token} address={await inboxAddress(store, ws)} initial={ws.inbox ?? []} /> : <StartSteps token={token} />)}
        {access !== "none" && direct && (
          <section className="rc-example" aria-label="Example of your mornings">
            <p className="rc-ex-k">{accounts.length ? "While Amazon sends your data: here's what your mornings will look like" : "Here's what your mornings will look like"}</p>
            <HeroDashboard />
            <p className="fine">Example account. Your real jobs, from your own numbers, show up right here.</p>
          </section>
        )}
        {access !== "none" && direct && accounts.length > 0 && <div className="rc-team"><ReminderCard token={token} initial={ws.reminders ?? null} seen={!!ws.seenJobsAt} slackOn={slackConfigured()} title="Ping me when my first jobs are ready" /></div>}
        {access !== "none" && <div className="rc-team">{team}</div>}
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
    const a = Number(latest(k)?.stats[f]), p = Number(prevOf(k)?.stats[f]);
    if (!isFinite(a) || !isFinite(p) || !p) return null;
    const d = (a - p) / Math.abs(p);
    return { text: `${d >= 0 ? "▲" : "▼"} ${Math.abs(Math.round(d * 100))}%`, good: down ? d <= 0 : d >= 0 };
  };
  const target = Math.round(b.settings.targetAcos * 100);
  const acos = st ? Math.round(Number(st.stats.acosPct)) : null;
  const kpis = [
    st && { k: "Ad spend · 30 days", v: m(Number(st.stats.spend)), d: delta("sp_search_term", "spend", true) },
    st && { k: "Ad sales · 30 days", v: m(Number(st.stats.sales)), d: delta("sp_search_term", "sales") },
    biz && { k: "Total sales · 30 days", v: m(Number(biz.stats.sales)), d: delta("business_report", "sales") },
    st && { k: "Wasted / mo", v: m(Number(st.stats.leakMonthly)), d: delta("sp_search_term", "leakMonthly", true) },
  ].filter(Boolean) as { k: string; v: string; d: { text: string; good: boolean } | null }[];

  // What this account taught Rocco (skips, results) decides what's shown; Claude's manager pass decides today's order.
  const tune = tuning(accountMemory(actions, ws.skips), ws.skips);
  const { shown, held } = applyTuning(b.open, tune);
  const byCode = new Map(shown.map((p) => [p.code, p]));
  const plan = ws.manager?.[b.brand];
  const planOk = plan && plan.picks.length > 0 && plan.picks.every((pk) => pk.codes.every((c) => byCode.has(c)));
  if (access !== "none" && brainOn() && shown.length && (!plan || plan.basis !== basisOf(shown)) && allow(`mgr:${ws.id}`, 1, 30 * 60_000)) {
    after(() => refreshManager(store, ws.id).catch(() => 0)); // fresh plan for the next visit
  }
  // Today's work as jobs (lib/jobs.ts): grouped the way a manager works, ordered by Claude's picks, then risks, then money.
  const jobs = buildJobs(shown, { plan: planOk ? plan : null, inv, biz, lh }).map((j) => (j.mode === "manual" && !j.steps && j.codes[0] && byCode.get(j.codes[0]) ? { ...j, steps: howTo(byCode.get(j.codes[0])!) } : j));
  const fixCount = shown.length;
  const billingPlan = ws.plan ?? "annual";
  const months = ws.hiredAt ? Math.max(1, Math.ceil((Date.now() - new Date(ws.hiredAt).getTime()) / (30 * 86_400_000))) : 1;
  const shownValue = shown.reduce((t, p) => t + p.valueMonthly, 0);
  // Approve-by-text unlocks once they've looked at today's work here (not before).
  if (access !== "none" && jobs.length && !ws.seenJobsAt) { const seen = new Date().toISOString(); after(async () => { const f = await store.getWorkspaceById(ws.id); if (f && !f.seenJobsAt) { f.seenJobsAt = seen; await store.saveWorkspace(f); } }); }
  const isDirect = direct && !!ws.amazon?.accounts?.length; // Rocco makes the changes in Amazon (DataDoe); else exact steps
  const coming = actions.filter((a) => a.status === "applied" || a.status === "not_enough_data").sort((x, y) => x.followUpAt.localeCompare(y.followUpAt)).slice(0, 4);
  const recent = actions.filter((a) => a.result).slice(0, 4);
  const account = ws.amazon?.accounts?.find((a) => a.name === b.brand) ?? ws.amazon?.accounts?.[0];
  // Ad jobs need the two Amazon Ads reports. Say so plainly when they're missing, instead of a page of steps-only jobs.
  const hasAds = b.trends.some((t) => t.kind === "sp_search_term" || t.kind === "sp_campaign");
  const adsState: "off" | "loading" | null = !isDirect || !account || hasAds ? null : account.ads === false ? "off" : "loading";
  const adsErr = (account && ws.amazon?.syncs?.[account.id]?.errors.find((e) => /^sp_/.test(e) && /% loaded/.test(e))) ?? "";
  const adsProgress = Number(adsErr.match(/(\d+)% loaded/)?.[1] ?? 0) || null;
  const hidden = brief.perBrand.reduce((t, x) => t + x.hidden, 0);
  const hiddenValue = brief.perBrand.reduce((t, x) => t + (x.hiddenValue ?? 0), 0);

  return (
    <section className="rd">
      <RememberTeam t={token} />
      <header className="rd-bar">
        <div className="rd-acct">
          <span className="rd-dot" aria-hidden />
          <b>{account ? `${account.name} · ${account.country}` : b.brand === "main" ? "Your Amazon" : b.brand}</b>
          <small>{lastCheck ? `checked ${daysOld === 0 ? "today" : daysOld === 1 ? "yesterday" : `${daysOld} days ago`}` : "not checked yet"}</small>
        </div>
        {brands.length > 1 && <nav className="rd-tabs" aria-label="Accounts">{brands.map((x) => <Link key={x.brand} href={`/w/${token}?brand=${encodeURIComponent(x.brand)}`} className={x.brand === b.brand ? "on" : ""}>{x.brand}</Link>)}</nav>}
      </header>

      {needsReconnect.map((a) => (
        <div key={a.id} className="rd-offer warn">
          <div><b>Amazon stopped sharing {a.name}&apos;s data.</b><span>This happens every few months. Reconnect in one tap: your history and settings stay.</span></div>
          <ConnectButton token={token} reconnect={a.id} label="Reconnect Amazon" className="btn" />
        </div>
      ))}
      {access === "none" && (
        <div className="rd-offer">
          <div><b>{hidden ? `Your plan has ended. ${hidden} fix${hidden === 1 ? "" : "es"} worth ~${m(hiddenValue)}/mo are waiting.` : "Your plan has ended."}</b><span>Rehire me to keep the daily checks and approvals: {PRICE.short}, {PRICE.then}.</span></div>
          <a className="btn" href={hireUrl(ws)}>Rehire Rocco</a>
        </div>
      )}
      {hoursLeft !== null && <p className="rd-note">Free trial: {hoursLeft > 24 ? `${Math.ceil(hoursLeft / 24)} days` : `${hoursLeft} hours`} left.</p>}

      <div className="rd-hero">
        <span className="rd-kicker">Good {new Date().getHours() < 12 ? "morning" : "day"}</span>
        <h1>{jobs.length ? (shownValue >= 1 ? <>{jobs.length} job{jobs.length === 1 ? "" : "s"} today, worth <em>~{m(shownValue)}/mo</em>.</> : <>{jobs.length} job{jobs.length === 1 ? "" : "s"} today to <em>protect your sales</em>.</>) : "All clear today."}</h1>
        {planOk && plan!.brief && <p className="rd-brief">{localize(plan!.brief, cur)}</p>}
        {acos !== null && (
          <div className="rd-acos" aria-label={`ACoS ${acos}%, target ${target}%`}>
            <div className="rd-acos-bar"><i style={{ width: `${Math.min(100, (acos / Math.max(target * 2, 1)) * 100)}%` }} className={acos > target ? "over" : ""} /><span style={{ left: "50%" }} /></div>
            <small>ACoS <b>{acos}%</b> · target {target}%</small>
          </div>
        )}
      </div>

      {access !== "none" && <RoiCard cur={cur} saved={brief.saved} measured={brief.savedMeasured} found={shownValue} plan={billingPlan} costMonthly={monthlyCost(billingPlan)} costSoFar={months * monthlyCost(billingPlan)} />}

      <ul className="rd-kpis">{kpis.map((x) => <li key={x.k}><span>{x.k}</span><b>{x.v}</b>{x.d && <small className={x.d.good ? "good" : "bad"}>{x.d.text}</small>}</li>)}</ul>

      {adsState && (
        <div className={`rd-offer${adsState === "off" ? " warn" : ""}`} role="status">
          {adsState === "off" ? (
            <><div><b>Amazon Ads isn&apos;t connected for {account?.name ?? "this account"}.</b><span>Ad jobs (wasted searches, bids, budgets, new exact campaigns) are the ones I make for you in one tap. Today you only see stock and sales jobs.</span></div>
            {account && <ConnectButton token={token} reconnect={account.id} label="Connect Amazon Ads" className="btn" />}</>
          ) : (
            <div><b>Your ad jobs are on the way.</b><span>Amazon Ads is connected, but Amazon is still sending me its history{adsProgress ? ` (${adsProgress}% loaded)` : ""}. A first load can take up to a day. Until then you see stock and sales jobs; the one-tap ad jobs (wasted searches, bids, budgets) show up here by themselves{ws.reminders?.channel && ws.reminders.cadence !== "off" ? ", and I'll message you" : ""}.</span></div>
          )}
        </div>
      )}

      <div className="rd-grid">
        <div>
          {jobs.length > 0 ? <JobCards token={token} brand={b.brand} jobs={JSON.parse(localize(JSON.stringify(jobs), cur))} direct={isDirect} cur={cur} restock={isDirect && account && canRestock(account.country) ? { token, account: account.id, country: account.country, from: ws.shipFrom?.[account.id], sendUrl: sendToAmazonUrl(account.country), recent: (ws.restocks ?? []).filter((r) => r.account === account.id && Date.now() - new Date(r.at).getTime() < 7 * 86_400_000).map(({ id, at, status, items, name, by }) => ({ id, at, status, items, name, by })) } : undefined} /> : <div className="rd-empty"><b>Nothing worth changing today.</b><span>I&apos;ll check again tomorrow morning.</span></div>}
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
        </div>

        <aside className="rd-side">
          {access !== "none" && team}
          {access !== "none" && direct && <AccountsCard token={token} accounts={accounts.map((a) => ({ id: a.id, name: a.name, country: a.country }))} slots={slotState(ws)} owner={!!who && roleOf(ws, who.email) === "owner"} extraUrl={extraAccountUrl(ws)} />}
          {access !== "none" && <ReminderCard token={token} initial={ws.reminders ?? null} seen={!!ws.seenJobsAt || jobs.length > 0} slackOn={slackConfigured()} sample={{ value: shownValue >= 1 ? m(shownValue) : "", jobs: jobs.map((j) => ({ title: localize(j.title, cur), codes: j.mode === "manual" ? [] : j.codes })) }} />}
          {access !== "none" && brainOn() && <AskRocco token={token} brand={b.brand} examples={["What should I do first today?", "Why did ad spend change?", "What worked last month?"]} />}
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
          <nav className="rd-links" aria-label="More">
            <Link href={`/w/${token}/analytics`}>📈 Analytics</Link>
            <Link href={`/w/${token}/log`}>🧾 Change log</Link>
            <Link href={`/w/${token}/tidy`}>🗂️ Tidy campaigns</Link>
            <Link href={`/w/${token}/report`}>📄 Report</Link>
            <Link href="/help">❓ Help</Link>
          </nav>
        </aside>
      </div>

      {!direct && b.stale.length > 0 && <p className="fine">Not refreshed in 7+ days: {b.stale.map((k) => REPORT_HELP[k].name).join(", ")}.</p>}
      <footer className="rd-foot">
        <form action="/api/auth/signout" method="post"><button className="linkbtn muted">Sign out</button></form>
      </footer>
    </section>
  );
}

