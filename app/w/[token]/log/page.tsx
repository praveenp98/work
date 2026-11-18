import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { proposalLine } from "@/lib/mcp/format";
import { getStore } from "@/lib/store";
import { loadWorkspace } from "@/lib/workspace";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Change log · Rocco", robots: { index: false, follow: false } };

const STATUS: Record<string, string> = { applied: "⏳ waiting", worked: "✅ worked", no_effect: "➖ no effect", worse: "⚠️ worse", not_enough_data: "⏳ more data", reverted: "↩️ reverted" };

/** Every change Rocco proposed and the team applied, with the measured result. */
export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const store = getStore();
  const ws = store ? await loadWorkspace(store, token) : null;
  if (!store || !ws) notFound();
  const actions = await store.listActions(ws.id, { limit: 500 });
  return (
    <section className="dash">
      <p className="fine"><Link href={`/w/${token}`}>← Your Rocco</Link></p>
      <h1 className="dash-h1">Change log</h1>
      <p className="muted">Every change, when, why, and whether it worked. Undo anything by texting Rocco &ldquo;undo B3&rdquo;.</p>
      {actions.length === 0 ? <p className="muted">Nothing logged yet. Approve a fix and it shows up here.</p> : (
        <ul className="loglist">
          {actions.map((a) => (
            <li key={a.id}>
              <div className="log-top"><span className="fix-code">{a.code}</span><span className={`status ${a.status}`}>{STATUS[a.status]}</span><span className="fine">{a.appliedAt.slice(0, 10)} · {a.brand}</span></div>
              <p className="log-what">{proposalLine(a.proposal).replace(/^- \*\*\w+\*\* /, "").replace(/\*\*/g, "")}</p>
              <p className="fine">{a.result?.summary ?? `Rocco checks after ${a.followUpAt.slice(0, 10)}.`}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
