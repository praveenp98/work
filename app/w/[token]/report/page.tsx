import { savingsOf } from "@/lib/savings";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { hasAccess } from "@/lib/access";
import { PrintButton } from "@/components/PrintButton";
import { REPORT_HELP, type ReportKind } from "@/lib/analyze";
import { proposalLine } from "@/lib/mcp/format";
import { getStore } from "@/lib/store";
import { buildBrief, DEFAULT_BRAND, loadWorkspace } from "@/lib/workspace";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Amazon account report", robots: { index: false, follow: false } };

const ICON: Record<string, string> = { high: "🔴", medium: "🟠", low: "⚪", win: "🟢" };
const STATUS: Record<string, string> = { applied: "In progress", worked: "Worked", no_effect: "No effect", worse: "Reverted / worse", not_enough_data: "Gathering data", reverted: "Reverted" };

/** White-label client report: /w/<key>/report?brand=Acme&by=Your Agency. Print to PDF from the browser. */
export default async function Page({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ brand?: string; by?: string }> }) {
  const { token } = await params;
  const sp = await searchParams;
  const store = getStore();
  const ws = store ? await loadWorkspace(store, token) : null;
  if (!store || !ws) notFound();
  if (!hasAccess(ws)) redirect(`/w/${token}`); // the report is part of the plan
  // Default to this team's own brand (their Amazon account or first brand), not a placeholder with no data.
  const brand = sp.brand || ws.amazon?.accounts?.[0]?.name || Object.keys(ws.brands ?? {})[0] || DEFAULT_BRAND;
  const by = (sp.by || "").slice(0, 80);
  const [brief, actions, snaps] = await Promise.all([buildBrief(store, ws), store.listActions(ws.id, { brand, limit: 100 }), store.listSnapshots(ws.id, { brand, limit: 50 })]);
  const pb = brief.perBrand.find((b) => b.brand === brand);
  const latest = new Map<string, (typeof snaps)[number]>();
  for (const s of snaps) if (!latest.has(s.kind)) latest.set(s.kind, s);
  const sv = savingsOf(actions);
  const worked = actions.filter((a) => a.status === "worked").length;
  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return (
    <article className="client-report">
      <div className="noprint row" style={{ justifyContent: "space-between", margin: "16px 0" }}>
        <p className="fine" style={{ margin: 0 }}>Add <code className="code">?brand=Name&amp;by=Your Agency</code> to the URL to white-label. Print → Save as PDF.</p>
        <PrintButton />
      </div>
      <header className="cr-head">
        <div>
          <p className="eyebrow" style={{ margin: 0 }}>{by ? `Prepared by ${by}` : "Account report"}</p>
          <h1 style={{ fontSize: 40, margin: "6px 0" }}>{brand === DEFAULT_BRAND ? "Amazon account" : brand}: performance &amp; actions</h1>
          <p className="muted" style={{ margin: 0 }}>{today}</p>
        </div>
      </header>

      <section className="stats" style={{ marginTop: 20 }}>
        <div className="stat"><b>{actions.length}</b><span>changes made</span></div>
        <div className="stat"><b>{worked}</b><span>confirmed working</span></div>
        <div className="stat"><b>${Math.round(sv.measured).toLocaleString("en-US")}</b><span>saved (measured before/after)</span></div>
        {sv.estimated > 0 && <div className="stat"><b>~${Math.round(sv.estimated).toLocaleString("en-US")}</b><span>spend avoided (estimate)</span></div>}
        <div className="stat"><b>{pb?.open.length ?? 0}</b><span>next actions queued</span></div>
      </section>

      <h2>Where the account stands</h2>
      {[...latest.values()].map((s) => (
        <section key={s.kind} className="cr-block">
          <h3>{REPORT_HELP[s.kind as ReportKind]?.name ?? s.kind} <span className="fine">· {s.createdAt.slice(0, 10)}</span></h3>
          <p style={{ fontWeight: 600 }}>{s.headline}</p>
          {s.extra?.findings?.length ? <ul>{s.extra.findings.slice(0, 6).map((f) => <li key={f.title}>{ICON[f.severity]} <b>{f.title}.</b> {f.detail}</li>)}</ul> : null}
        </section>
      ))}
      {latest.size === 0 && <p className="muted">No reports analyzed yet for this brand.</p>}

      <h2>What we changed and what happened</h2>
      {actions.length ? (
        <table className="fixes">
          <thead><tr><th>Date</th><th>Change</th><th>Status</th><th>Result</th></tr></thead>
          <tbody>{actions.map((a) => (
            <tr key={a.id}><td>{a.appliedAt.slice(0, 10)}</td><td>{proposalLine(a.proposal).replace(/^- \*\*\w+\*\* /, "").replace(/\*\*/g, "")}</td><td>{STATUS[a.status]}</td><td className="fine">{a.result?.summary ?? `Check on ${a.followUpAt.slice(0, 10)}`}</td></tr>
          ))}</tbody>
        </table>
      ) : <p className="muted">No changes logged yet.</p>}

      {pb && pb.open.length > 0 && (
        <>
          <h2>Next actions</h2>
          <ul>{[...pb.open].sort((x, y) => y.valueMonthly - x.valueMonthly).slice(0, 10).map((p) => <li key={p.code}>{proposalLine(p).replace(/^- \*\*\w+\*\* /, "").replace(/\*\*/g, "")}</li>)}</ul>
        </>
      )}
      <footer className="fine" style={{ marginTop: 40, borderTop: "1px solid var(--line)", paddingTop: 10 }}>{by ? `${by} · ` : ""}Analysis powered by Rocco (rocco.works). Not affiliated with Amazon.</footer>
    </article>
  );
}
