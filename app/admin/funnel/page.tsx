import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { ADMIN_COOKIE, adminCookieOk, eventsPersistent, funnel, type FunnelRow } from "@/lib/events";
import { getPriceState } from "@/lib/payments";
import { HACKATHON, hackathonDay } from "@/marketing/config/offer";

export const metadata: Metadata = { title: "Funnel", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/**
 * Owner-only funnel: the last 7 and 30 days by source, and paid sellers against the goal.
 * Sign in at /admin/login?key=<CRON_SECRET> (sets a 12-hour cookie). Anyone else gets a 404.
 */
const COLS: { key: keyof Omit<FunnelRow, "source">; label: string }[] = [
  { key: "visits", label: "Visits" }, { key: "leads", label: "Leads" }, { key: "call_clicks", label: "Call clicks" },
  { key: "calls_booked", label: "Calls booked" }, { key: "checkouts", label: "Checkouts" }, { key: "paid", label: "Paid" },
];
const cell: React.CSSProperties = { padding: "10px 14px", borderTop: "1px solid var(--line)", textAlign: "right", fontVariantNumeric: "tabular-nums" };
const head: React.CSSProperties = { ...cell, borderTop: 0, fontSize: 12, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--muted)" };

function Table({ title, rows, ok }: { title: string; rows: FunnelRow[]; ok: boolean }) {
  const total = COLS.map((c) => rows.reduce((n, r) => n + r[c.key], 0));
  return (
    <section style={{ display: "grid", gap: 10 }}>
      <h2 style={{ margin: 0, fontSize: 26 }}>{title}</h2>
      {!ok ? <p className="fine">Couldn&apos;t read events. Has supabase/migrations/004_events.sql been run?</p> : (
        <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 20, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 15 }}>
            <thead><tr><th style={{ ...head, textAlign: "left" }}>Source</th>{COLS.map((c) => <th key={c.key} style={head}>{c.label}</th>)}</tr></thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={COLS.length + 1} style={{ ...cell, textAlign: "left", color: "var(--muted)" }}>No events yet.</td></tr>}
              {rows.map((r) => <tr key={r.source}><td style={{ ...cell, textAlign: "left", fontWeight: 600 }}>{r.source}</td>{COLS.map((c) => <td key={c.key} style={cell}>{r[c.key]}</td>)}</tr>)}
              {rows.length > 1 && <tr><td style={{ ...cell, textAlign: "left", fontWeight: 700 }}>All sources</td>{total.map((n, i) => <td key={COLS[i].key} style={{ ...cell, fontWeight: 700 }}>{n}</td>)}</tr>}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default async function Page({ searchParams }: { searchParams: Promise<{ logged?: string }> }) {
  if (!adminCookieOk((await cookies()).get(ADMIN_COOKIE)?.value)) notFound();
  const [week, month, price, sp] = await Promise.all([funnel(7), funnel(30), getPriceState().catch(() => null), searchParams]);
  const paidEvents = month.rows.reduce((n, r) => n + r.paid, 0);
  // Dodo is the source of truth for who paid. The event count is only a fallback when Dodo can't be reached.
  const paid = price?.live ? price.sold : paidEvents;
  const goal = HACKATHON.goalPayingSellers;
  const day = hackathonDay();
  const pct = Math.min(100, Math.round((paid / goal) * 100));
  return (
    <section style={{ maxWidth: 980, margin: "0 auto", padding: "24px 0 60px", display: "grid", gap: 28 }}>
      <header>
        <span className="h5-kicker">Owner only</span>
        <h1 style={{ margin: "0 0 6px", fontSize: 44 }}>Funnel</h1>
        <p className="fine" style={{ margin: 0 }}>Hackathon day {day} · {HACKATHON.start} to {HACKATHON.end} · events stored in {eventsPersistent() ? "Supabase" : "memory (no Supabase configured here)"}</p>
      </header>

      <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 24, padding: 22, display: "grid", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
          <b style={{ fontFamily: "var(--display)", fontWeight: 500, fontSize: 56, lineHeight: 1 }} data-testid="paid-count">{paid}</b>
          <span style={{ fontSize: 18, color: "var(--muted)" }}>of {goal} paying sellers</span>
          <span style={{ marginLeft: "auto", fontWeight: 600 }}>{goal - paid > 0 ? `${goal - paid} to go` : "Goal reached"}</span>
        </div>
        <div style={{ height: 12, borderRadius: 99, background: "var(--bg2)", overflow: "hidden" }}><div style={{ width: `${pct}%`, height: "100%", background: "#1f9d63", borderRadius: 99 }} /></div>
        <p className="fine" style={{ margin: 0 }}>{price?.live ? "Counted from Dodo payments (the same count the price rise uses)." : `Dodo couldn't be reached from here, so this is the number of "paid" events in the last 30 days.`}</p>
      </div>

      <Table title="Last 7 days" rows={week.rows} ok={week.ok} />
      <Table title="Last 30 days" rows={month.rows} ok={month.ok} />

      <div style={{ display: "grid", gap: 8 }}>
        <p className="fine" style={{ margin: 0 }}>Source is the visit&apos;s first utm_source, else the site it came from, else &quot;direct&quot;. Visits and checkouts count people; leads, call clicks, calls booked and paid count events. A payment takes the source of the checkout that led to it.</p>
        <form method="post" action="/admin/funnel/booked" style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <label htmlFor="src" className="fine">Log a booked call from source</label>
          <input id="src" name="source" placeholder="x, linkedin, reddit…" style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid var(--line)", font: "inherit", fontSize: 14 }} />
          <button className="btn small ghost" type="submit">Log call booked</button>
          {sp.logged && <span className="fine">Logged.</span>}
        </form>
        <p className="fine" style={{ margin: 0 }}>Newest raw events: <a href="/api/admin/events?limit=100">/api/admin/events</a></p>
      </div>
    </section>
  );
}
