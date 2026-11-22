import type { Metadata } from "next";
import Link from "next/link";
import { after } from "next/server";
import { AskRocco } from "@/components/dash/AskRocco";
import { RoiCard } from "@/components/dash/RoiCard";
import { notFound } from "next/navigation";
import { JobCards } from "@/components/dash/JobCards";
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
  const hoursLeft = trialHoursLeft(ws);
  const direct = datadoeOn();
  const accounts = direct ? await Promise.all((ws.amazon?.accounts ?? []).map(async (a) => ({ id: a.id, name: a.name, country: a.country, status: await getAccount(a.id).then(loadStatus).catch(() => "connected") }))) : [];
  const needsReconnect = accounts.filter((a) => a.status === "needs you to reconnect");
  const note = sp.welcome ? "You're in 🎉 One step left: connect your Amazon." : sp.amazon === "connected" ? "🔌 Connected. Amazon is sending me your data now." : sp.amazon ? `That didn't finish (${decodeURIComponent(sp.amazon).replace(/_/g, " ").toLowerCase()}). Try again, signed in as the account owner.` : undefined;
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
        {access === "none" ? <HireCard url={hireUrl(ws)} monthlyUrl={hireUrl(ws, "monthly")} /> : direct ? <ConnectAmazon token={token} accounts={accounts} note={note} lastSync={ws.amazon?.lastSync} /> : (ws.mode === "reports" ? <ReportSteps token={token} address={await inboxAddress(store, ws)} initial={ws.inbox ?? []} /> : <StartSteps token={token} />)}
        {access !== "none" && direct && !accounts.length && otherWays}
        <form action="/api/auth/signout" method="post" className="rc-out"><button className="linkbtn muted">Sign out</button></form>
      </section>
    );
  }

  // ---------- Dashboard ----------
  const brands = brief.perBrand.filter((b) => b.trends.length || b.open.length);
  const b = brands.find((x) => x.brand === sp.brand) ?? brands[0] ?? brief.perBrand[0];
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
    st && { k: "Ad spend", v: $(Number(st.stats.spend)), d: delta("sp_search_term", "spend", true) },
    st && { k: "Ad sales", v: $(Number(st.stats.sales)), d: delta("sp_search_term", "sales") },
    biz && { k: "Total sales", v: $(Number(biz.stats.sales)), d: delta("business_report", "sales") },
    st && { k: "Wasted / mo", v: $(Number(st.stats.leakMonthly)), d: delta("sp_search_term", "leakMonthly", true) },
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
  const isDirect = direct && !!ws.amazon?.accounts?.length; // Rocco makes the changes in Amazon (DataDoe); else exact steps
  const coming = actions.filter((a) => a.status === "applied" || a.status === "not_enough_data").sort((x, y) => x.followUpAt.localeCompare(y.followUpAt)).slice(0, 4);
  const recent = actions.filter((a) => a.result).slice(0, 4);
  const account = ws.amazon?.accounts?.find((a) => a.name === b.brand) ?? ws.amazon?.accounts?.[0];
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
          <div><b>{hidden ? `Your plan has ended. ${hidden} fix${hidden === 1 ? "" : "es"} worth ~${$(hiddenValue)}/mo are waiting.` : "Your plan has ended."}</b><span>Rehire me to keep the daily checks and approvals: {PRICE.short}, {PRICE.then}.</span></div>
          <a className="btn" href={hireUrl(ws)}>Rehire Rocco</a>
        </div>
      )}
      {hoursLeft !== null && <p className="rd-note">Free trial: {hoursLeft > 24 ? `${Math.ceil(hoursLeft / 24)} days` : `${hoursLeft} hours`} left.</p>}

      <div className="rd-hero">
        <span className="rd-kicker">Good {new Date().getHours() < 12 ? "morning" : "day"}</span>
        <h1>{jobs.length ? <>{jobs.length} job{jobs.length === 1 ? "" : "s"} today, worth <em>~{$(shownValue)}/mo</em>.</> : "All clear today."}</h1>
        {planOk && plan!.brief && <p className="rd-brief">{plan!.brief}</p>}
        {acos !== null && (
          <div className="rd-acos" aria-label={`ACoS ${acos}%, target ${target}%`}>
            <div className="rd-acos-bar"><i style={{ width: `${Math.min(100, (acos / Math.max(target * 2, 1)) * 100)}%` }} className={acos > target ? "over" : ""} /><span style={{ left: "50%" }} /></div>
            <small>ACoS <b>{acos}%</b> · target {target}%</small>
          </div>
        )}
      </div>

      {access !== "none" && <RoiCard saved={brief.saved} measured={brief.savedMeasured} found={shownValue} plan={billingPlan} costMonthly={monthlyCost(billingPlan)} costSoFar={months * monthlyCost(billingPlan)} />}

      <ul className="rd-kpis">{kpis.map((x) => <li key={x.k}><span>{x.k}</span><b>{x.v}</b>{x.d && <small className={x.d.good ? "good" : "bad"}>{x.d.text}</small>}</li>)}</ul>

      <div className="rd-grid">
        <div>
          {jobs.length > 0 ? <JobCards token={token} brand={b.brand} jobs={jobs} direct={isDirect} /> : <div className="rd-empty"><b>Nothing worth changing today.</b><span>I&apos;ll check again tomorrow morning.</span></div>}
          {held > 0 && <p className="fine">I held back {held} fix{held === 1 ? "" : "es"} this account usually skips or that didn&apos;t work here before.</p>}
          {b.hidden > 0 && (
            <div className="rd-locked"><span>🔒 <b>{b.hidden} more fix{b.hidden === 1 ? "" : "es"}</b>{b.hiddenValue ? <> worth ~<b>{$(b.hiddenValue)}/mo</b></> : null}</span><a className="btn small" href={hireUrl(ws)}>Unlock · {PRICE.from}</a></div>
          )}
        </div>

        <aside className="rd-side">
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
            <Link href={`/w/${token}/report`}>📄 Report</Link>
          </nav>
        </aside>
      </div>

      {b.stale.length > 0 && <p className="fine">Not refreshed in 7+ days: {b.stale.map((k) => REPORT_HELP[k].name).join(", ")}.</p>}
      <footer className="rd-foot">
        {direct && <ConnectButton token={token} />}
        <Link href="/setup">Also ask me in Claude</Link>
        <form action="/api/auth/signout" method="post"><button className="linkbtn muted">Sign out</button></form>
      </footer>
    </section>
  );
}

