import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { ADMIN_COOKIE, adminCookieOk } from "@/lib/events";
import { listPartners, listReferrals, partnersPersistent, suggestedPayout, type Partner, type Referral } from "@/lib/partner-db";
import { PARTNER_SHARE, payoutDue, sharePct } from "@/lib/partners";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Partners", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/**
 * Owner-only partner program admin (same sign-in as /admin/funnel: /admin/login?key=<CRON_SECRET>).
 * Approve or pause partners (approving creates the code), see referrals, and record payouts once they are due.
 */
const cell: React.CSSProperties = { padding: "10px 12px", borderTop: "1px solid var(--line)", textAlign: "left", fontSize: 14, verticalAlign: "top" };
const head: React.CSSProperties = { ...cell, borderTop: 0, fontSize: 12, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--muted)" };
const card: React.CSSProperties = { background: "#fff", border: "1px solid var(--line)", borderRadius: 20, overflowX: "auto" };
const input: React.CSSProperties = { padding: "7px 10px", borderRadius: 10, border: "1px solid var(--line)", font: "inherit", fontSize: 14, width: 120 };
const $ = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
const day = (s?: string | null) => (s ? new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "");

const MSG: Record<string, string> = {
  approved: "Approved. The code is live: send them their link.",
  paused: "Paused. Their link stops setting new referrals (existing ones still count).",
  paid: "Payout recorded. Now log it as a marketing cost in docs/PROGRESS.md (hard rule 4).",
  error: "That didn't work. Check the amount and date, and that the payout is due.",
};

function Status({ r, now }: { r: Referral; now: Date }) {
  if (r.payout_status === "paid") return <span>Paid {r.payout_amount != null ? $(r.payout_amount) : ""} on {day(r.payout_paid_at)}{r.refunded ? " (seller refunded later)" : ""}</span>;
  if (r.refunded || r.payout_status === "void") return <span style={{ color: "var(--muted)" }}>Void (refunded)</span>;
  if (payoutDue(r, now)) return <b style={{ color: "#1f7a4f" }}>Due now</b>;
  return <span>Waiting for the guarantee (ends {day(r.guarantee_ends_at)})</span>;
}

export default async function Page({ searchParams }: { searchParams: Promise<{ done?: string }> }) {
  if (!adminCookieOk((await cookies()).get(ADMIN_COOKIE)?.value)) notFound();
  const [{ partners, ok }, { referrals, ok: rok }, sp] = await Promise.all([listPartners(), listReferrals(), searchParams]);
  const now = new Date();
  const due = referrals.filter((r) => payoutDue(r, now));
  const dueTotal = due.reduce((n, r) => n + suggestedPayout(r, partners), 0);
  const paidTotal = referrals.filter((r) => r.payout_status === "paid").reduce((n, r) => n + (r.payout_amount ?? 0), 0);
  const sorted = [...partners].sort((a, b) => (a.status === "pending" ? -1 : 0) - (b.status === "pending" ? -1 : 0));
  const nameOf = (code: string) => partners.find((p) => p.code === code)?.name ?? code;
  return (
    <section style={{ maxWidth: 1080, margin: "0 auto", padding: "24px 0 60px", display: "grid", gap: 24 }}>
      <header>
        <span className="h5-kicker">Owner only</span>
        <h1 style={{ margin: "0 0 6px", fontSize: 44 }}>Partners</h1>
        <p className="fine" style={{ margin: 0 }}>{partners.length} partner{partners.length === 1 ? "" : "s"} · {referrals.length} referral{referrals.length === 1 ? "" : "s"} · default share {sharePct(PARTNER_SHARE)} · stored in {partnersPersistent() ? "Supabase" : "memory (no Supabase configured here)"} · <a href="/admin/funnel">Funnel</a> · <a href="/admin/leads">Leads</a></p>
      </header>
      {sp.done && MSG[sp.done] && <p role="status" style={{ margin: 0, padding: "10px 14px", background: "#eef8f1", borderRadius: 12 }}>{MSG[sp.done]}</p>}

      <div style={{ ...card, padding: 18, display: "grid", gap: 6, background: "#fffaf0" }}>
        <b>Every payout is a marketing cost.</b>
        <span className="fine" style={{ fontSize: 14 }}>Pay by Wise or PayPal only after the guarantee has passed (the &quot;Due now&quot; rows), then record it here and log it in docs/PROGRESS.md and marketing_costs (CLAUDE.md hard rule 4). Approve a partner only after they&apos;ve agreed to have their name on their /p/ page.</span>
        <span style={{ fontSize: 15 }}>Due now: <b>{$(Math.round(dueTotal * 100) / 100)}</b> across {due.length} · Paid so far: <b>{$(paidTotal)}</b></span>
      </div>

      <div>
        <h2 style={{ margin: "0 0 10px", fontSize: 24 }}>Payouts due</h2>
        {!rok ? <p className="fine">Couldn&apos;t read referrals. Has supabase/migrations/006_partners.sql been run?</p> : due.length === 0 ? <p className="fine">Nothing due right now.</p> : (
          <div style={card}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr><th style={head}>Partner</th><th style={head}>Plan</th><th style={head}>Seller paid</th><th style={head}>Guarantee ended</th><th style={head}>Record payout</th></tr></thead>
              <tbody>{due.map((r) => (
                <tr key={r.id}>
                  <td style={cell}><b>{nameOf(r.partner_code)}</b><br /><span className="fine">{r.partner_code}</span></td>
                  <td style={cell}>{r.plan}</td>
                  <td style={cell}>{$(r.amount)}</td>
                  <td style={cell}>{day(r.guarantee_ends_at)}</td>
                  <td style={cell}>
                    <form method="post" action="/admin/partners/action" style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                      <input type="hidden" name="op" value="paid" /><input type="hidden" name="id" value={r.id} />
                      <label className="fine" htmlFor={`amt-${r.id}`}>$</label>
                      <input id={`amt-${r.id}`} name="amount" type="number" step="0.01" min="0.01" required defaultValue={suggestedPayout(r, partners)} style={input} />
                      <input name="date" type="date" required defaultValue={now.toISOString().slice(0, 10)} style={{ ...input, width: 150 }} aria-label="Paid on" />
                      <button className="btn small" type="submit">Mark paid</button>
                    </form>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <h2 style={{ margin: "0 0 10px", fontSize: 24 }}>Partners</h2>
        {!ok ? <p className="fine">Couldn&apos;t read partners. Has supabase/migrations/006_partners.sql been run? Applications are still in <a href="/admin/leads">Leads</a> (partner-apply).</p> : (
          <div style={card}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr><th style={head}>Applied</th><th style={head}>Partner</th><th style={head}>Reach / how</th><th style={head}>Status</th><th style={head}>Link</th><th style={head}></th></tr></thead>
              <tbody>
                {sorted.length === 0 && <tr><td colSpan={6} style={{ ...cell, color: "var(--muted)" }}>No applications yet. The form is on /partners.</td></tr>}
                {sorted.map((p: Partner) => (
                  <tr key={p.id}>
                    <td style={cell}>{day(p.created_at)}</td>
                    <td style={cell}><b>{p.name}</b> <span className="fine">({p.type})</span><br /><a href={`mailto:${p.email}`}>{p.email}</a>{p.website && <><br /><a href={p.website} rel="noopener noreferrer" target="_blank">{p.website.replace(/^https?:\/\//, "")}</a></>}</td>
                    <td style={cell}>{p.reach}<br /><span className="fine">{p.how}</span></td>
                    <td style={cell}>{p.status}{p.share !== PARTNER_SHARE ? ` · ${sharePct(p.share)}` : ""}</td>
                    <td style={cell}>{p.code ? <><code>{SITE.domain}/p/{p.code}</code><br /><span className="fine">or any page + ?partner={p.code}</span></> : <span className="fine">Code on approval</span>}</td>
                    <td style={cell}>
                      <form method="post" action="/admin/partners/action">
                        <input type="hidden" name="id" value={p.id} />
                        {p.status === "approved"
                          ? <button className="btn small ghost" name="op" value="pause" type="submit">Pause</button>
                          : <button className="btn small" name="op" value="approve" type="submit">{p.status === "paused" ? "Resume" : "Approve"}</button>}
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <h2 style={{ margin: "0 0 10px", fontSize: 24 }}>All referrals</h2>
        {rok && (
          <div style={card}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr><th style={head}>Paid</th><th style={head}>Partner</th><th style={head}>Team</th><th style={head}>Plan</th><th style={head}>Amount</th><th style={head}>Payout</th></tr></thead>
              <tbody>
                {referrals.length === 0 && <tr><td colSpan={6} style={{ ...cell, color: "var(--muted)" }}>No referred sales yet.</td></tr>}
                {referrals.map((r) => (
                  <tr key={r.id}>
                    <td style={cell}>{day(r.paid_at)}</td>
                    <td style={cell}>{nameOf(r.partner_code)}</td>
                    <td style={cell}><code style={{ fontSize: 12 }}>{r.workspace_id.slice(0, 8)}</code></td>
                    <td style={cell}>{r.plan}</td>
                    <td style={cell}>{$(r.amount)}{r.currency && r.currency !== "USD" ? <span className="fine"> (charged in {r.currency})</span> : null}</td>
                    <td style={cell}><Status r={r} now={now} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
