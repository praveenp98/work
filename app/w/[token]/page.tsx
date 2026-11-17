import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Raccoon } from "@/components/Raccoon";
import { WinsCard } from "@/components/WinsCard";
import { REPORT_HELP } from "@/lib/analyze";
import { proposalLine } from "@/lib/mcp/format";
import { getStore } from "@/lib/store";
import { maskPhone } from "@/lib/text/commands";
import { buildBrief, ensureLinkCode, loadWorkspace } from "@/lib/workspace";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your Rocco workspace", robots: { index: false, follow: false } };

const KIND: Record<string, string> = { sp_search_term: "Search terms", sp_campaign: "Budgets", business_report: "Business Report", inventory: "Inventory", bulk: "Structure" };
const STATUS: Record<string, string> = { applied: "⏳ waiting", worked: "✅ worked", no_effect: "➖ no effect", worse: "⚠️ worse", not_enough_data: "⏳ more data", reverted: "↩️ reverted" };

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const store = getStore();
  if (!store) return <section className="prose"><h1>Memory isn&apos;t switched on yet</h1><p>Rocco&apos;s workspace storage isn&apos;t configured on this server.</p></section>;
  const ws = await loadWorkspace(store, token);
  if (!ws) notFound();
  const [brief, actions] = await Promise.all([buildBrief(store, ws), store.listActions(ws.id, { limit: 100 })]);
  const linkCode = await ensureLinkCode(store, ws);
  const team = await store.listPhones({ workspaceId: ws.id });
  const roccoNumber = process.env.NEXT_PUBLIC_ROCCO_IMESSAGE;
  const $ = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
  const connector = `https://rocco.works/mcp/${token}`;

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
        <p style={{ margin: "0 0 8px" }}>Each teammate texts <b className="code">link {linkCode}</b> to Rocco{roccoNumber ? <> at <b>{roccoNumber}</b></> : " (iMessage line opening this week)"}. Morning numbers, answers, and approvals with a reply.</p>
        {roccoNumber && <a className="btn small imsg-btn" style={{ fontSize: 15, padding: "9px 16px" }} href={`sms:${roccoNumber}&body=${encodeURIComponent(`Hi Rocco, link ${linkCode}`)}`}>💬 Text Rocco now</a>}
        <p className="fine" style={{ margin: "8px 0 0" }}>{team.length ? `On this line: ${team.map((t) => maskPhone(t.phone) + (t.optedOut ? " (paused)" : "")).join(", ")}` : "No phones linked yet."}{ws.pending?.length ? ` · Waiting for your AI to apply: ${ws.pending.flatMap((p) => p.codes).join(", ")}` : ""}</p>
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
          {b.hidden > 0 && <p className="fine">+{b.hidden} more fixes are locked on the free plan. <Link href="/pricing?utm_source=dashboard">Unlock them</Link>.</p>}
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
            <p>Free workspaces get the top 3 fixes per report. A one-time license unlocks all of them plus bulk files. Then tell Rocco: &ldquo;activate my license&rdquo;.</p>
            <Link className="btn" href="/pricing?utm_source=dashboard">Hire Rocco →</Link>
          </div>
        </section>
      )}
    </>
  );
}
