import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Raccoon } from "@/components/Raccoon";
import { WinsCard } from "@/components/WinsCard";
import { RoccoHead } from "@/components/Rocco";
import { StartSteps } from "@/components/start/StartSteps";
import { REPORT_HELP } from "@/lib/analyze";
import { proposalLine } from "@/lib/mcp/format";
import { getStore } from "@/lib/store";
import { maskPhone } from "@/lib/text/commands";
import { textingConfigured } from "@/lib/text/provider";
import { TextLink } from "@/components/home/TextLink";
import { buildBrief, ensureLinkCode, loadWorkspace, rememberToken } from "@/lib/workspace";
import { hireUrl } from "@/lib/paywall";
import { slackConfigured } from "@/lib/slack";
import { getPriceState } from "@/lib/payments";
import { dollars } from "@/lib/pricing";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your Rocco", description: "Plug in Amazon, then just ask. Your team's private Rocco page.", robots: { index: false, follow: false } };

const KIND: Record<string, string> = { listing_health: "Listings", sp_search_term: "Search terms", sp_campaign: "Budgets", business_report: "Business Report", inventory: "Inventory", bulk: "Structure" };
const STATUS: Record<string, string> = { applied: "⏳ waiting", worked: "✅ worked", no_effect: "➖ no effect", worse: "⚠️ worse", not_enough_data: "⏳ more data", reverted: "↩️ reverted" };

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const store = getStore();
  if (!store) return <section className="prose"><h1>Memory isn&apos;t switched on yet</h1><p>Rocco&apos;s workspace storage isn&apos;t configured on this server.</p></section>;
  const ws = await loadWorkspace(store, token);
  if (!ws) notFound();
  if (!ws.tokenSealed) await rememberToken(store, ws, token).catch(() => {});
  const [brief, actions] = await Promise.all([buildBrief(store, ws), store.listActions(ws.id, { limit: 100 })]);
  const linkCode = await ensureLinkCode(store, ws);
  const price = await getPriceState();
  const team = (await store.listPhones({ workspaceId: ws.id })).filter((p) => p.phone.startsWith("+"));
  const textHref = textingConfigured();
  const $ = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
  const connector = `https://rocco.works/mcp/${token}`;

  const empty = !brief.perBrand.some((b) => b.trends.length) && actions.length === 0;
  if (empty) {
    // Nothing plugged in yet: one job on this page. Plug in Amazon, one step at a time.
    return (
      <section className="start-page">
        <div className="start-head">
          <div className="hello-avatar small"><svg width="56" height="46" viewBox="15 5 170 140" aria-hidden><RoccoHead mood="smirk" id="start" /></svg><span className="online" aria-hidden /></div>
          <h1>Let&apos;s plug in Amazon.</h1>
        </div>
        <StartSteps token={token} />
        <p className="start-extra">
          {textHref && <TextLink t={token} className="">💬 Text Rocco from this phone</TextLink>}
          <span>Teammates: text Rocco &ldquo;invite&rdquo; to get a one-tap join link</span>
        </p>
        <p className="fine">Private page for your team. Anyone with the link can use it.</p>
      </section>
    );
  }

  return (
    <>
      <div className="split" style={{ alignItems: "center", marginTop: 20 }}>
        <div>
          <span className="eyebrow">Your Rocco workspace{ws.licensed ? " · licensed" : " · free"}</span>
          <h1 style={{ fontSize: "clamp(32px,5vw,48px)" }}>Here&apos;s what Rocco knows.</h1>
          <p className="muted">Connector: <code className="code">{connector}</code></p>
          <p className="row" style={{ gap: 8, margin: "10px 0" }}>
            <a className="btn small" href={`webcal://rocco.works/w/${token}/calendar.ics`}>📅 Add reminders to my calendar</a>
            <Link className="btn ghost small" href={`/w/${token}/report`}>📄 Client report (PDF)</Link>
            <Link className="btn small" href={`/w/${token}/analytics`}>📈 Analytics{ws.licensed ? "" : " (Pro)"}</Link>
          </p>
          <p className="fine">Private link. Anyone with it can see and use this workspace.{!store.persistent && " (Demo mode: memory resets when the server restarts.)"}</p>
        </div>
        <div className="stats" style={{ margin: 0 }}>
          <div className="stat"><b>{brief.totals.applied}</b><span>changes logged</span></div>
          <div className="stat"><b>{brief.totals.worked}</b><span>confirmed working</span></div>
          <div className="stat"><b style={{ color: "var(--accent)" }}>{$(brief.saved)}</b><span>saved (measured)</span></div>
        </div>
      </div>

      {(brief.saved > 0 || brief.totals.worked > 0) && <div style={{ marginTop: 14 }}><WinsCard saved={brief.saved} worked={brief.totals.worked} applied={brief.totals.applied} since={ws.createdAt} /></div>}
      <section className="card" style={{ marginTop: 18 }}>
        <h3 style={{ marginTop: 0 }}>💬 Text Rocco from your phone (whole team)</h3>
        <p style={{ margin: "0 0 8px" }}>{textHref ? "Tap the button on your iPhone and send the message: your phone joins this workspace automatically. Share this page with teammates so they can do the same." : <>Teammates text Rocco &ldquo;join {linkCode}&rdquo;.</>} Morning numbers, answers, and approvals with a reply.</p>
        {textHref && <TextLink t={token} className="btn small imsg-btn">💬 Text Rocco from this phone</TextLink>}
        {textHref && <p className="fine" style={{ margin: "6px 0 0" }}>Or text Rocco &ldquo;invite&rdquo; and forward the link he sends.</p>}
        <p className="fine" style={{ margin: "8px 0 0" }}>{team.length ? `On this line: ${team.map((t) => maskPhone(t.phone) + (t.optedOut ? " (paused)" : "")).join(", ")}` : "No phones linked yet."}{ws.pending?.length ? ` · Waiting for your AI to apply: ${ws.pending.flatMap((p) => p.codes).join(", ")}` : ""}</p>
      </section>
      <details className="card" style={{ marginTop: 18 }}><summary><b>Setup steps</b> (add Rocco or Amazon to another app)</summary><div style={{ marginTop: 14 }}><StartSteps token={token} compact /></div></details>
      <section className="card slack-card" style={{ marginTop: 14 }}>
        <h3 style={{ marginTop: 0 }}>Rocco in Slack</h3>
        {ws.slack
          ? <p style={{ margin: 0 }}>Connected to <b>{ws.slack.teamName ?? "your Slack"}</b>{ws.slack.channelName ? <> · posting in <b>{ws.slack.channelName}</b></> : null}. Mention <b>@Rocco</b> or DM him: &ldquo;yes N1 N2&rdquo;, &ldquo;how&apos;s stock?&rdquo;.</p>
          : <p style={{ margin: 0 }}>Morning numbers in your team channel, approvals with <b>@Rocco yes N1</b>. {slackConfigured() ? <a className="btn small" style={{ marginLeft: 6 }} href={`/api/slack/install?t=${token}`}>Add to Slack</a> : <span className="fine">(Slack opens soon.)</span>}</p>}
      </section>
      {brief.season && <p className="pill" style={{ marginTop: 18 }}>📅 {brief.season}</p>}

      {brief.perBrand.map((b) => (
        <section key={b.brand} style={{ marginTop: 40 }}>
          <h2 style={{ marginTop: 0 }}>{b.brand} <span className="fine">target ACoS {Math.round(b.settings.targetAcos * 100)}% · breakeven {Math.round(b.settings.breakevenAcos * 100)}%{b.settings.protectedTerms?.length ? ` · protected: ${b.settings.protectedTerms.join(", ")}` : ""}</span></h2>
          {b.trends.length ? (
            <div className="grid">
              {b.trends.map((t) => (
                <div className="card" key={t.kind}>
                  <span className="tag">{KIND[t.kind] ?? t.kind} · {t.latest.createdAt.slice(0, 10)}</span>
                  <p style={{ margin: 0, fontWeight: 600 }}>{t.latest.headline}</p>
                  {t.previous && <p className="fine" style={{ margin: "6px 0 0" }}>Before: {t.previous.headline}</p>}
                </div>
              ))}
            </div>
          ) : <p className="muted">No data yet. In Claude or ChatGPT, say &ldquo;Rocco, morning check&rdquo;.</p>}
          {b.open.length > 0 && (
            <>
              <h3 style={{ marginTop: 22 }}>Proposed, not applied yet ({b.open.length}{b.openValue ? ` · ~${$(b.openValue)}/mo at stake` : ""})</h3>
              <ul className="md">{[...b.open].sort((x, y) => y.valueMonthly - x.valueMonthly).slice(0, 12).map((p) => <li key={p.code}>{proposalLine(p).replace(/^- /, "").replace(/\*\*/g, "")}</li>)}</ul>
            </>
          )}
          {b.hidden > 0 && (
            <div className="locked-row">
              <span>🔒 <b>{b.hidden} more fix{b.hidden === 1 ? "" : "es"}</b>{b.hiddenValue ? <> worth ~<b>{$(b.hiddenValue)}/mo</b></> : null} are waiting.</span>
              <a className="btn small" href={hireUrl(ws)}>Hire Rocco · {dollars(price.priceCents)} once</a>
            </div>
          )}
          {b.stale.length > 0 && <p className="fine">Not checked in 7+ days: {b.stale.map((k) => REPORT_HELP[k].name).join(", ")}. Say &ldquo;morning check&rdquo; to refresh.</p>}
        </section>
      ))}

      <section style={{ marginTop: 48 }}>
        <h2 style={{ marginTop: 0 }}>Change log</h2>
        {actions.length === 0 ? <p className="muted">Nothing logged yet. Approve codes in chat (&ldquo;approve N1–N3&rdquo;) and Rocco records them here.</p> : (
          <div className="tablewrap">
            <table className="fixes dash-table">
              <thead><tr><th>Applied</th><th>Code</th><th>Change</th><th>Result</th></tr></thead>
              <tbody>
                {actions.map((a) => (
                  <tr key={a.id}>
                    <td>{a.appliedAt.slice(0, 10)}<div className="fine">{a.brand}</div></td>
                    <td><b>{a.code}</b><div className="fine">{a.id.slice(0, 8)}</div></td>
                    <td>{proposalLine(a.proposal).replace(/^- \*\*\w+\*\* /, "").replace(/\*\*/g, "")}</td>
                    <td><span className={`status ${a.status}`}>{STATUS[a.status]}</span><div className="fine">{a.result?.summary ?? `check after ${a.followUpAt.slice(0, 10)}`}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {!ws.licensed && (
        <section className="band">
          <Raccoon size={90} mood="judging" />
          <div>
            <h2>Unlock every fix and full tracking</h2>
            <p>Free workspaces get the top 3 fixes per report. Hiring Rocco unlocks all of them, bulk files and full tracking for your whole team. It unlocks this workspace automatically after you pay.</p>
            <a className="btn" href={hireUrl(ws)}>Hire Rocco · {dollars(price.priceCents)} once →</a>
          </div>
        </section>
      )}
    </>
  );
}
