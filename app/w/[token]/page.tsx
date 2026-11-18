import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyLink } from "@/components/dash/CopyLink";
import { FixCards, type FixCard } from "@/components/dash/FixCards";
import { TextLink } from "@/components/home/TextLink";
import { RoccoHead } from "@/components/Rocco";
import { StartSteps } from "@/components/start/StartSteps";
import { TrialSheet } from "@/components/dash/TrialSheet";
import { RememberTeam } from "@/components/dash/RememberTeam";
import { accessOf, trialHoursLeft } from "@/lib/access";
import { REPORT_HELP } from "@/lib/analyze";
import { getPriceState } from "@/lib/payments";
import { hireUrl } from "@/lib/paywall";
import { dollars } from "@/lib/pricing";
import type { Proposal } from "@/lib/rules/types";
import { slackConfigured } from "@/lib/slack";
import { getStore } from "@/lib/store";
import type { Snapshot } from "@/lib/store/types";
import { maskPhone } from "@/lib/text/commands";
import { textingConfigured } from "@/lib/text/provider";
import { buildBrief, ensureLinkCode, loadWorkspace, rememberToken } from "@/lib/workspace";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your Rocco", description: "Your team's Rocco: today's numbers, fixes to approve, wins and team.", robots: { index: false, follow: false } };

const $ = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const TITLE: Record<Proposal["kind"], string> = { negative: "Cut a money-burner", harvest: "Promote a winner to exact", bid: "Adjust a bid", budget: "Raise a budget", placement: "Tune a placement", ads_down: "Ease ads, stock is low", structure: "Clean up structure" };
const AI_NAME = { claude: "Claude", chatgpt: "ChatGPT", claude_code: "Claude Code" } as const;

/** One team, one Rocco. Before data: the setup steps. After: today, fixes to approve, wins, team. */
export default async function Page({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ brand?: string; slack?: string; welcome?: string }> }) {
  const { token } = await params;
  const sp = await searchParams;
  const store = getStore();
  if (!store) return <section className="prose"><h1>Memory isn&apos;t switched on yet</h1><p>Rocco&apos;s workspace storage isn&apos;t configured on this server.</p></section>;
  const ws = await loadWorkspace(store, token);
  if (!ws) notFound();
  if (!ws.tokenSealed) await rememberToken(store, ws, token).catch(() => {});
  const [brief, actions, price] = await Promise.all([buildBrief(store, ws), store.listActions(ws.id, { limit: 100 }), getPriceState()]);
  const linkCode = await ensureLinkCode(store, ws);
  const phones = (await store.listPhones({ workspaceId: ws.id })).filter((p) => p.phone.startsWith("+"));
  const texting = textingConfigured();
  const access = accessOf(ws);
  const trial = access === "none" ? { url: hireUrl(ws), price: dollars(price.priceCents) } : undefined;
  const hoursLeft = trialHoursLeft(ws);

  const empty = !brief.perBrand.some((b) => b.trends.length) && actions.length === 0;
  if (empty) {
    return (
      <section className="start-page">
        <RememberTeam t={token} />
        <div className="start-head">
          <div className="hello-avatar small"><svg width="56" height="46" viewBox="15 5 170 140" aria-hidden><RoccoHead mood="smirk" id="start" /></svg><span className="online" aria-hidden /></div>
          <h1>Let&apos;s plug in Amazon.</h1>
        </div>
        {sp.welcome && <p className="trial-note">🎉 You&apos;re in. {access === "none" ? "Your plan turns on in a moment (refresh if this page still shows the offer)." : "Rocco is on."} Three steps and I&apos;m working.</p>}
        <StartSteps token={token} trial={sp.welcome ? undefined : trial} />
        <p className="start-extra">
          {texting && <TextLink t={token} className="">💬 Text Rocco from this phone</TextLink>}
          <span>Teammates: share rocco.works/j/{linkCode}</span>
        </p>
        <p className="fine">Private page for your team. Anyone with the link can use it.</p>
      </section>
    );
  }

  const brands = brief.perBrand.filter((b) => b.trends.length || b.open.length);
  const b = brands.find((x) => x.brand === sp.brand) ?? brands[0] ?? brief.perBrand[0];
  const latest = (k: string): Snapshot | undefined => b.trends.find((t) => t.kind === k)?.latest;
  const st = latest("sp_search_term"), biz = latest("business_report"), inv = latest("inventory"), lh = latest("listing_health");
  const lastCheck = b.trends.map((t) => t.latest.createdAt).sort().at(-1);
  const daysOld = lastCheck ? Math.floor((Date.now() - new Date(lastCheck).getTime()) / 86_400_000) : null;
  const chips: { k: string; v: string; alert?: boolean }[] = [];
  if (lh && Number(lh.stats.problems) > 0) chips.push({ k: "Listings", v: `🚨 ${lh.stats.problems} not selling`, alert: true });
  if (biz && Number(biz.stats.buyBoxLow) > 0) chips.push({ k: "Buy Box", v: `⚠️ low on ${biz.stats.buyBoxLow}`, alert: true });
  if (st) chips.push({ k: "Ad spend", v: $(Number(st.stats.spend)) }, { k: "Ad sales", v: $(Number(st.stats.sales)) }, { k: "ACoS", v: `${Math.round(Number(st.stats.acosPct))}% · target ${Math.round(b.settings.targetAcos * 100)}%` }, { k: "Wasted", v: `${$(Number(st.stats.leakMonthly))}/mo` });
  if (biz) chips.push({ k: "Total sales", v: $(Number(biz.stats.sales)) }, { k: "Conversion", v: `${Number(biz.stats.conversionPct).toFixed(1)}%` });
  if (inv && Number(inv.stats.atRisk) > 0) chips.push({ k: "Stock", v: `📦 ${inv.stats.atRisk} running low`, alert: true });

  const fixes: FixCard[] = [...b.open].sort((x, y) => y.valueMonthly - x.valueMonthly).slice(0, 12).map((p) => ({
    code: p.code, title: TITLE[p.kind] ?? "Fix", value: p.valueMonthly,
    target: p.kind === "budget" || p.kind === "placement" ? p.campaign : p.target,
    reason: p.reason,
  }));
  const queued = (ws.pending ?? []).filter((p) => p.type === "apply").flatMap((p) => p.codes);
  const invite = `https://rocco.works/j/${linkCode}`;

  return (
    <section className="dash">
      <RememberTeam t={token} />
      {brands.length > 1 && (
        <nav className="brand-tabs" aria-label="Brands">
          {brands.map((x) => <Link key={x.brand} href={`/w/${token}?brand=${encodeURIComponent(x.brand)}`} className={x.brand === b.brand ? "on" : ""}>{x.brand}</Link>)}
        </nav>
      )}
      {trial && (() => {
        const n = brief.perBrand.reduce((t, x) => t + x.hidden, 0);
        const v = brief.perBrand.reduce((t, x) => t + (x.hiddenValue ?? 0), 0);
        const found = n ? `~${$(v)}/mo across ${n} fixes` : undefined;
        return (
          <>
            <div className="trial-banner">
              <div><b>{found ? `💰 I found ${found}.` : "Turn me on for your team."}</b><span>Hire me to see and approve every fix: {dollars(price.priceCents)}/year for the whole team.</span></div>
              <a className="btn" href={trial.url}>Hire Rocco</a>
            </div>
            <TrialSheet url={trial.url} price={trial.price} open found={found} />
          </>
        );
      })()}
      {hoursLeft !== null && <p className="trial-note">🎉 Free trial: {hoursLeft > 24 ? `${Math.ceil(hoursLeft / 24)} days` : `${hoursLeft} hours`} left. Then {dollars(price.priceCents)}/year. Text CANCEL anytime.</p>}
      <div className="dash-head">
        <span className="eyebrow">{brands.length > 1 ? b.brand : "Today"}{access === "paid" ? " · hired" : access === "trial" ? " · trial" : ""}</span>
        <h1 className="dash-h1">{fixes.length ? `${fixes.length} fix${fixes.length === 1 ? "" : "es"} waiting${b.openValue ? `, ~${$(b.openValue)}/mo` : ""}.` : "All clear today."}</h1>
        <p className="muted">{lastCheck ? `From ${daysOld === 0 ? "today's" : daysOld === 1 ? "yesterday's" : `a ${daysOld}-day-old`} check.` : ""} {daysOld && daysOld > 1 ? <>Say &ldquo;Rocco, morning check&rdquo; in your AI to refresh.</> : null}</p>
      </div>

      <ul className="today">{chips.map((c) => <li key={c.k} className={c.alert ? "alert" : ""}><span>{c.k}</span><b>{c.v}</b></li>)}</ul>

      {fixes.length > 0 && <FixCards token={token} brand={b.brand} fixes={fixes} queued={queued} />}
      {b.hidden > 0 && (
        <div className="locked-row">
          <span>🔒 <b>{b.hidden} fix{b.hidden === 1 ? "" : "es"}</b>{b.hiddenValue ? <> worth ~<b>{$(b.hiddenValue)}/mo</b></> : null} ready for you.</span>
          <a className="btn small" href={hireUrl(ws)}>Hire Rocco · {dollars(price.priceCents)}/year</a>
        </div>
      )}

      <div className="dash-grid">
        <section className="dcard">
          <h3>Wins</h3>
          <p className="big">{brief.saved > 0 ? `${$(brief.saved)}/mo saved` : "Keeping score"}</p>
          <p className="fine">{brief.totals.applied ? `${brief.totals.worked} of ${brief.totals.applied} changes worked. ` : "Approve a fix and I check a week later whether it worked. "}<Link href={`/w/${token}/log`}>Change log →</Link></p>
        </section>

        <section className="dcard">
          <h3>Team</h3>
          <ul className="team">
            <li>{ws.connectedAt ? `✅ ${ws.ai ? AI_NAME[ws.ai] : "Your AI"} connected` : "⏳ AI not connected yet"}</li>
            <li>{phones.length ? `💬 ${phones.map((p) => maskPhone(p.phone) + (p.optedOut ? " (paused)" : "")).join(", ")}` : "💬 No phones yet"}</li>
            <li>{ws.slack ? `# Slack: ${ws.slack.channelName ?? ws.slack.teamName ?? "connected"}` : slackConfigured() ? <a href={`/api/slack/install?t=${token}`}>+ Add to Slack</a> : "# Slack: soon"}</li>
          </ul>
          <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
            <CopyLink value={invite} label="Copy invite link" />
            {texting && <TextLink t={token} className="btn ghost small">💬 Text from this phone</TextLink>}
          </div>
        </section>
      </div>

      <nav className="dash-links" aria-label="More">
        <Link href={`/w/${token}/analytics`}>📈 Analytics</Link>
        <Link href={`/w/${token}/log`}>🧾 Change log</Link>
        <Link href={`/w/${token}/report`}>📄 Client report</Link>
        <a href={`webcal://rocco.works/w/${token}/calendar.ics`}>📅 Calendar</a>
        <details><summary>⚙️ Setup</summary><div style={{ marginTop: 12 }}><StartSteps token={token} compact /></div></details>
      </nav>

      {b.stale.length > 0 && <p className="fine">Not checked in 7+ days: {b.stale.map((k) => REPORT_HELP[k].name).join(", ")}.</p>}
      {brief.season && <p className="fine">📅 {brief.season}</p>}
      <p className="fine">Private page for your team. Anyone with the link can use it.{!store.persistent && " (Demo mode: memory resets when the server restarts.)"}</p>
    </section>
  );
}
