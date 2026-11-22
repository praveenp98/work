import type { Metadata } from "next";
import Link from "next/link";
import { after } from "next/server";
import { AskRocco } from "@/components/dash/AskRocco";
import { notFound } from "next/navigation";
import { FixCards, type FixCard } from "@/components/dash/FixCards";
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
import { basisOf, KIND_TITLE, refreshManager } from "@/lib/manager";
import { accountMemory, applyTuning, tuning } from "@/lib/memory";
import { brainOn } from "@/lib/brain";
import { hireUrl } from "@/lib/paywall";
import { PRICE } from "@/lib/pricing";
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
        {access === "none" ? <HireCard url={hireUrl(ws)} /> : direct ? <ConnectAmazon token={token} accounts={accounts} note={note} lastSync={ws.amazon?.lastSync} /> : (ws.mode === "reports" ? <ReportSteps token={token} address={await inboxAddress(store, ws)} initial={ws.inbox ?? []} /> : <StartSteps token={token} />)}
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
  const alerts: string[] = [];
  if (lh && Number(lh.stats.problems) > 0) alerts.push(`🚨 ${lh.stats.problems} listing${Number(lh.stats.problems) === 1 ? "" : "s"} not selling`);
  if (biz && Number(biz.stats.buyBoxLow) > 0) alerts.push(`⚠️ Buy Box low on ${biz.stats.buyBoxLow} ASIN${Number(biz.stats.buyBoxLow) === 1 ? "" : "s"}`);
  if (inv && Number(inv.stats.atRisk) > 0) alerts.push(`📦 ${inv.stats.atRisk} SKU${Number(inv.stats.atRisk) === 1 ? "" : "s"} could run out within 2 weeks`);

  // What this account taught Rocco (skips, results) decides what's shown; Claude's manager pass decides today's order.
  const tune = tuning(accountMemory(actions, ws.skips), ws.skips);
  const { shown, held } = applyTuning(b.open, tune);
  const byCode = new Map(shown.map((p) => [p.code, p]));
  const plan = ws.manager?.[b.brand];
  const planOk = plan && plan.picks.length > 0 && plan.picks.every((pk) => pk.codes.every((c) => byCode.has(c)));
  if (access !== "none" && brainOn() && shown.length && (!plan || plan.basis !== basisOf(shown)) && allow(`mgr:${ws.id}`, 1, 30 * 60_000)) {
    after(() => refreshManager(store, ws.id).catch(() => 0)); // fresh plan for the next visit
  }
  const targetOf = (p: Proposal) => (p.kind === "budget" || p.kind === "placement" ? p.campaign : `“${p.target}”${p.campaign ? ` · ${p.campaign}` : ""}`);
  const card = (p: Proposal): FixCard => ({ code: p.code, kind: p.kind, title: KIND_TITLE[p.kind] ?? "Fix", value: p.valueMonthly, target: targetOf(p), reason: p.reason, how: howTo(p) });
  const picks: FixCard[] = planOk ? plan!.picks.map((pk) => {
    const ps = pk.codes.map((c) => byCode.get(c)!);
    const camps = [...new Set(ps.map((p) => p.campaign).filter(Boolean))];
    return {
      code: ps[0].code, codes: pk.codes, kind: ps[0].kind, title: pk.title, reason: pk.why, pick: true,
      value: ps.reduce((t, p) => t + p.valueMonthly, 0),
      target: ps.length === 1 ? targetOf(ps[0]) : `${ps.slice(0, 3).map((p) => `“${p.target}”`).join(", ")}${ps.length > 3 ? ` +${ps.length - 3} more` : ""}${camps.length === 1 ? ` · ${camps[0]}` : ""}`,
      how: ps.length === 1 ? howTo(ps[0]) : ps.map((p) => `${p.code}: ${howTo(p)}`).join(" "),
    };
  }) : [];
  const picked = new Set(picks.flatMap((f) => f.codes ?? [f.code]));
  const rest: FixCard[] = [...shown].filter((p) => !picked.has(p.code)).sort((x, y) => y.valueMonthly - x.valueMonthly).slice(0, planOk ? 20 : 12).map(card);
  const fixes = planOk ? picks : rest;
  const fixCount = shown.length;
  const shownValue = shown.reduce((t, p) => t + p.valueMonthly, 0);
  const queued = (ws.pending ?? []).filter((p) => p.type === "apply").flatMap((p) => p.codes);
  const mode = direct && ws.amazon?.accounts?.length ? "direct" : ws.mode === "reports" ? "reports" : "claude";
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
        <h1>{fixCount ? <>{fixCount} fix{fixCount === 1 ? "" : "es"} worth <em>~{$(shownValue)}/mo</em>.</> : "All clear today."}</h1>
        {planOk && plan!.brief && <p className="rd-brief">{plan!.brief}</p>}
        {acos !== null && (
          <div className="rd-acos" aria-label={`ACoS ${acos}%, target ${target}%`}>
            <div className="rd-acos-bar"><i style={{ width: `${Math.min(100, (acos / Math.max(target * 2, 1)) * 100)}%` }} className={acos > target ? "over" : ""} /><span style={{ left: "50%" }} /></div>
            <small>ACoS <b>{acos}%</b> · target {target}%</small>
          </div>
        )}
      </div>

      <ul className="rd-kpis">{kpis.map((x) => <li key={x.k}><span>{x.k}</span><b>{x.v}</b>{x.d && <small className={x.d.good ? "good" : "bad"}>{x.d.text}</small>}</li>)}</ul>
      {alerts.length > 0 && <ul className="rd-alerts">{alerts.map((a) => <li key={a}>{a}</li>)}</ul>}

      <div className="rd-grid">
        <div>
          {fixes.length > 0 ? <FixCards token={token} brand={b.brand} fixes={fixes} queued={queued} mode={mode} heading={planOk ? "Do these today" : "Today's fixes"} /> : <div className="rd-empty"><b>Nothing worth changing today.</b><span>I&apos;ll check again tomorrow morning.</span></div>}
          {planOk && rest.length > 0 && (
            <details className="rd-more">
              <summary>{rest.length} more fix{rest.length === 1 ? "" : "es"} I&apos;d leave for later · ~{$(rest.reduce((t, f) => t + f.value, 0))}/mo</summary>
              <FixCards token={token} brand={b.brand} fixes={rest} queued={queued} mode={mode} heading="Later" approveAll={false} />
            </details>
          )}
          {held > 0 && <p className="fine">I held back {held} fix{held === 1 ? "" : "es"} this account usually skips or that didn&apos;t work here before.</p>}
          {b.hidden > 0 && (
            <div className="rd-locked"><span>🔒 <b>{b.hidden} more fix{b.hidden === 1 ? "" : "es"}</b>{b.hiddenValue ? <> worth ~<b>{$(b.hiddenValue)}/mo</b></> : null}</span><a className="btn small" href={hireUrl(ws)}>Unlock · {PRICE.first}</a></div>
          )}
        </div>

        <aside className="rd-side">
          {access !== "none" && brainOn() && <AskRocco token={token} brand={b.brand} examples={["What should I do first today?", "Why did ad spend change?", "What worked last month?"]} />}
          <section className="rd-card">
            <h3>Results</h3>
            <p className="rd-big">{brief.savedMeasured > 0 ? $(brief.savedMeasured) : brief.saved > 0 ? `~${$(brief.savedEstimated)}` : "—"}</p>
            <p className="fine">{brief.saved > 0 ? savedPhrase({ measured: brief.savedMeasured, estimated: brief.savedEstimated }) : "Approve a fix and I measure what it did a week later."}</p>
            {brief.totals.applied > 0 && <p className="fine">{brief.totals.worked} of {brief.totals.applied} changes worked.</p>}
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

