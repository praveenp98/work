import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { ADMIN_COOKIE, adminCookieOk } from "@/lib/events";
import { groupLeads, leadsPersistent, listLeads } from "@/lib/leads";
import { accessOf } from "@/lib/access";
import { getStore } from "@/lib/store";

export const metadata: Metadata = { title: "Leads", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** Owner-only: leads by magnet and source, and the newest 50. Sign in at /admin/login?key=<CRON_SECRET>. */
const cell: React.CSSProperties = { padding: "10px 14px", borderTop: "1px solid var(--line)", textAlign: "left", fontSize: 14.5 };
const head: React.CSSProperties = { ...cell, borderTop: 0, fontSize: 12, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--muted)" };
const num: React.CSSProperties = { textAlign: "right", fontVariantNumeric: "tabular-nums" };
const card: React.CSSProperties = { background: "#fff", border: "1px solid var(--line)", borderRadius: 20, overflowX: "auto" };

export default async function Page() {
  if (!adminCookieOk((await cookies()).get(ADMIN_COOKIE)?.value)) notFound();
  const { leads, ok } = await listLeads(2000);
  const store = getStore();
  const signups = store ? await store.listOwnedWorkspaces(300).catch(() => []) : [];
  const PAID: Record<string, string> = { paid: "paid", trial: "trial", none: "not paid" };
  const groups = groupLeads(leads);
  const day = (s?: string) => (s ? new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "");
  return (
    <section style={{ maxWidth: 980, margin: "0 auto", padding: "24px 0 60px", display: "grid", gap: 24 }}>
      <header>
        <span className="h5-kicker">Owner only</span>
        <h1 style={{ margin: "0 0 6px", fontSize: 44 }}>Leads</h1>
        <p className="fine" style={{ margin: 0 }}>{leads.length} lead{leads.length === 1 ? "" : "s"} · stored in {leadsPersistent() ? "Supabase" : "memory (no Supabase configured here)"} · <a href="/admin/funnel">Funnel</a></p>
      </header>

      <div>
        <h2 style={{ margin: "0 0 4px", fontSize: 24 }}>Sign-ups (Google)</h2>
        <p className="fine" style={{ margin: "0 0 10px" }}>Everyone who signed in with Google, newest first: {signups.length} · {signups.filter((w) => accessOf(w) !== "none").length} paying · {signups.filter((w) => w.amazon?.accounts?.length).length} connected Amazon. Not-paid sign-ups are your warmest leads: they reached the checkout step.</p>
        <div style={card}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><th style={head}>Signed up</th><th style={head}>Email</th><th style={head}>Name</th><th style={head}>Plan</th><th style={head}>Amazon</th></tr></thead>
            <tbody>
              {signups.length === 0 && <tr><td colSpan={5} style={{ ...cell, color: "var(--muted)" }}>No sign-ups yet.</td></tr>}
              {signups.map((w) => <tr key={w.id}><td style={cell}>{day(w.createdAt)}</td><td style={cell}><a href={`mailto:${w.ownerEmail}`}>{w.ownerEmail}</a></td><td style={cell}>{w.ownerName ?? ""}</td><td style={cell}>{PAID[accessOf(w)] ?? accessOf(w)}{w.plan ? ` · ${w.plan}` : ""}</td><td style={cell}>{(w.amazon?.accounts ?? []).map((a) => `${a.name} (${a.country})`).join(", ") || "not connected"}</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
      {!ok && <p className="fine">Couldn&apos;t read leads. Has supabase/migrations/005_leads.sql been run?</p>}

      <div style={card}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><th style={head}>Lead magnet</th><th style={head}>Source</th><th style={{ ...head, ...num }}>Leads</th><th style={{ ...head, ...num }}>Said yes to email</th><th style={{ ...head, ...num }}>Unsubscribed</th></tr></thead>
          <tbody>
            {groups.length === 0 && <tr><td colSpan={5} style={{ ...cell, color: "var(--muted)" }}>No leads yet.</td></tr>}
            {groups.map((g) => <tr key={`${g.lead_magnet}|${g.source}`}><td style={{ ...cell, fontWeight: 600 }}>{g.lead_magnet}</td><td style={cell}>{g.source}</td><td style={{ ...cell, ...num }}>{g.leads}</td><td style={{ ...cell, ...num }}>{g.consented}</td><td style={{ ...cell, ...num }}>{g.unsubscribed}</td></tr>)}
          </tbody>
        </table>
      </div>

      <h2 style={{ margin: 0, fontSize: 26 }}>Newest 50</h2>
      <div style={card}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><th style={head}>When</th><th style={head}>Email</th><th style={head}>Magnet</th><th style={head}>Source</th><th style={head}>Marketplace</th><th style={head}>Email ok?</th></tr></thead>
          <tbody>
            {leads.slice(0, 50).map((l) => <tr key={`${l.email}|${l.lead_magnet}`}><td style={cell}>{day(l.created_at)}</td><td style={cell}>{l.email}</td><td style={cell}>{l.lead_magnet}</td><td style={cell}>{l.utm_source || l.referrer || "direct"}{l.utm_campaign ? ` · ${l.utm_campaign}` : ""}</td><td style={cell}>{l.marketplace ?? ""}</td><td style={cell}>{l.unsubscribed_at ? "unsubscribed" : l.consent_marketing ? "yes" : "no"}</td></tr>)}
          </tbody>
        </table>
      </div>
      <p className="fine" style={{ margin: 0 }}>Only email people marked &quot;yes&quot;. &quot;no&quot; means they took the download without ticking the box.</p>
    </section>
  );
}
