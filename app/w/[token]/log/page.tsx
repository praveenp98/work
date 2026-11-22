import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HistoryButton } from "@/components/dash/HistoryButton";
import { hasAccess } from "@/lib/access";
import { changeLine } from "@/lib/history";
import { proposalLine } from "@/lib/mcp/format";
import { getStore } from "@/lib/store";
import { loadWorkspace } from "@/lib/workspace";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Change log · Rocco", robots: { index: false, follow: false } };

const STATUS: Record<string, string> = { applied: "⏳ checking in a week", worked: "✅ worked", no_effect: "➖ no effect", worse: "⚠️ worse", not_enough_data: "⏳ more data", reverted: "↩️ reverted" };
const when = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
/** Who made the change, from the note saved with it. */
function source(note?: string): string {
  if (!note) return "Approved";
  const who = note.match(/approved by ([^·(]+?)\s*$/)?.[1];
  if (/by text/.test(note) && /Rocco/.test(note)) return "Rocco · approved by text";
  if (/new exact campaign/.test(note)) return `Rocco · new campaign${who ? ` · approved by ${who}` : ""}`;
  if (/Rocco/.test(note)) return `Rocco · approved${who ? ` by ${who}` : ""} on the dashboard`;
  return "By hand";
}

/**
 * Everything that changed in the account, newest first: Rocco's changes (who approved, the result a week later),
 * campaign tidy-ups, and "Before Rocco" (Amazon's own change history from before Rocco was hired).
 */
export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const store = getStore();
  const ws = store ? await loadWorkspace(store, token) : null;
  if (!store || !ws) notFound();
  const actions = await store.listActions(ws.id, { limit: 500 });
  const accounts = ws.amazon?.accounts ?? [];
  const tidies = accounts.flatMap((a) => { const d = ws.tidy?.[a.id]?.done; return d ? [{ a, d }] : []; });

  return (
    <section className="dash">
      <p className="fine"><Link href={`/w/${token}`}>← Your Rocco</Link></p>
      <h1 className="dash-h1">Change log</h1>
      <p className="muted">Every change in your Amazon: what changed, who approved it, and whether it worked when I checked a week later.</p>

      <h2 className="log-h">Rocco&apos;s changes</h2>
      {actions.length === 0 && !tidies.length ? <p className="muted">Nothing yet. Approve a job on your dashboard and it shows up here.</p> : (
        <ul className="loglist">
          {tidies.map(({ a, d }) => (
            <li key={`tidy-${a.id}`}>
              <div className="log-top"><span className="fix-code">🗂️</span><span className="status applied">Tidy</span><span className="fine">{when(d.at)} · {a.name}</span></div>
              <p className="log-what">Tidied campaigns: {[d.renamed.length && `${d.renamed.length} renamed`, d.portfolios.length && `${d.portfolios.length} portfolio${d.portfolios.length === 1 ? "" : "s"}`, d.paused.length && `${d.paused.length} idle paused`].filter(Boolean).join(", ") || "no changes"}</p>
              <p className="fine">Rocco · approved{d.by ? ` by ${d.by}` : ""} on the dashboard · <Link href={`/w/${token}/tidy`}>undo on the Tidy page</Link></p>
            </li>
          ))}
          {actions.map((a) => (
            <li key={a.id}>
              <div className="log-top"><span className="fix-code">{a.code}</span><span className={`status ${a.status}`}>{STATUS[a.status]}</span><span className="fine">{when(a.appliedAt)} · {a.brand}</span></div>
              <p className="log-what">{proposalLine(a.proposal).replace(/^- \*\*\w+\*\* /, "").replace(/\*\*/g, "")}</p>
              <p className="fine">{source(a.note)} · {a.result?.summary ?? `I check the result after ${when(a.followUpAt)}.`}</p>
            </li>
          ))}
        </ul>
      )}

      <h2 className="log-h">Before Rocco</h2>
      <p className="muted">What was changed in your ads before you hired me, from Amazon&apos;s own change history (Sponsored Products and Brands). I read it once so I know how the account was run.</p>
      {!accounts.length ? <p className="muted">Connect your Amazon and I&apos;ll read it.</p> : accounts.map((a) => {
        const h = ws.history?.[a.id];
        return (
          <div key={a.id} className="log-past">
            {accounts.length > 1 && <p className="log-acc">{a.name}</p>}
            {!h ? (hasAccess(ws) ? <HistoryButton token={token} account={a.id} /> : <p className="muted">Hire Rocco and I&apos;ll read it when you connect.</p>) : (
              <>
                {h.read && <p className="log-read">🧠 {h.read}</p>}
                <ul className="log-notes">{h.summary.notes.map((n) => <li key={n}>{n}</li>)}</ul>
                {h.changes.length > 0 && (
                  <details className="log-more">
                    <summary>See all {h.summary.total} changes</summary>
                    <ul className="loglist">
                      {h.changes.map((c, i) => <li key={i}><div className="log-top"><span className="fine">{when(c.at)}</span></div><p className="log-what">{changeLine(c)}</p></li>)}
                    </ul>
                    {h.summary.total > h.changes.length && <p className="fine">Showing the latest {h.changes.length}.</p>}
                  </details>
                )}
              </>
            )}
          </div>
        );
      })}
    </section>
  );
}
