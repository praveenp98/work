import { PRICE } from "@/lib/pricing";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BarList, IssueList, LineChart, Stat, type Series } from "@/components/charts/Charts";
import { getPriceState } from "@/lib/payments";
import { hireUrl } from "@/lib/paywall";
import { hasAccess } from "@/lib/access";
import { dollars } from "@/lib/pricing";
import { getStore } from "@/lib/store";
import type { Snapshot } from "@/lib/store/types";
import { brandSettings, buildBrief, loadWorkspace } from "@/lib/workspace";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Rocco analytics", robots: { index: false, follow: false } };

const $ = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const pct = (n: number) => `${Math.round(n)}%`;
const num = (s: Snapshot, k: string) => Number(s.stats[k] ?? 0);

function delta(cur?: Snapshot, prev?: Snapshot | null, k?: string, fmt: (n: number) => string = $, lowerIsGood = false) {
  if (!cur || !prev || !k) return { text: null, good: null };
  const d = num(cur, k) - num(prev, k);
  if (!d) return { text: "no change vs last check", good: null };
  return { text: `${d > 0 ? "▲" : "▼"} ${fmt(Math.abs(d))} vs last check`, good: lowerIsGood ? d < 0 : d > 0 };
}

/** Pro analytics: trends across every check Rocco has run, results of every change, stock and listing health. */
export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const store = getStore();
  if (!store) notFound();
  const ws = await loadWorkspace(store, token);
  if (!ws) notFound();
  const [snaps, actions, brief, price] = await Promise.all([store.listSnapshots(ws.id, { limit: 200 }), store.listActions(ws.id, { limit: 500 }), buildBrief(store, ws), getPriceState()]);
  const brand = brief.perBrand[0]?.brand ?? "main";
  const target = brandSettings(ws, brand).targetAcos * 100;
  const of = (kind: string) => snaps.filter((s) => s.kind === kind && s.brand === brand).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const st = of("sp_search_term"), biz = of("business_report"), inv = of("inventory"), lh = of("listing_health");
  const last = st.at(-1), prev = st.at(-2) ?? null;
  const worked = actions.filter((a) => a.status === "worked" && (a.result?.savedEstimate ?? 0) > 0).sort((a, b) => (b.result!.savedEstimate ?? 0) - (a.result!.savedEstimate ?? 0));
  const pro = hasAccess(ws);

  if (!snaps.length) {
    return (
      <section className="start-page">
        <h1>Analytics fill in after your first check.</h1>
        <p className="hello-lede">Plug in Amazon and say &ldquo;Rocco, morning check&rdquo;. Every check adds a point to these charts.</p>
        <Link className="btn" href={`/w/${token}`}>Plug in Amazon</Link>
      </section>
    );
  }

  const spendSales: Series[] = [
    { name: "Ad spend", color: "var(--series-1)", points: st.map((s) => ({ x: s.createdAt, y: num(s, "spend") })) },
    { name: "Ad sales", color: "var(--series-2)", points: st.map((s) => ({ x: s.createdAt, y: num(s, "sales") })) },
  ];

  const charts = (
    <>
      {st.length > 0 && <LineChart title="Ad spend and ad sales" caption="per check, last 30 days of data each" series={spendSales} format={$} />}
      {st.length > 0 && <LineChart title="ACoS vs your target" series={[{ name: "ACoS", color: "var(--series-1)", points: st.map((s) => ({ x: s.createdAt, y: num(s, "acosPct") })) }]} format={pct} target={{ value: target, label: `target ${Math.round(target)}%` }} />}
      {st.length > 0 && <LineChart title="Wasted ad spend" caption="search terms spending with no sales, per month" series={[{ name: "Waste", color: "var(--series-1)", points: st.map((s) => ({ x: s.createdAt, y: num(s, "leakMonthly") })) }]} format={$} />}
      {biz.length > 0 && <LineChart title="Conversion rate" caption="all sessions, from the Business Report" series={[{ name: "Conversion", color: "var(--series-1)", points: biz.map((s) => ({ x: s.createdAt, y: num(s, "conversionPct") })) }]} format={(n) => `${n.toFixed(1)}%`} />}
      {worked.length > 0 && <BarList title="Money saved by each change" caption="measured a week after applying" rows={worked.slice(0, 10).map((a) => ({ label: `${a.code} · ${a.proposal.target.slice(0, 32)}`, value: a.result!.savedEstimate ?? 0 }))} format={(n) => `${$(n)}/mo`} />}
      {inv.length > 0 && <LineChart title="SKUs at risk of running out" caption="within 2 weeks" series={[{ name: "At risk", color: "var(--series-1)", points: inv.map((s) => ({ x: s.createdAt, y: num(s, "atRisk") })) }]} format={(n) => String(Math.round(n))} integer />}
      {lh.at(-1)?.extra?.findings?.length ? <IssueList title="Listings not selling" caption={`as of ${lh.at(-1)!.createdAt.slice(0, 10)} · fix in Seller Central, pause their ads`} rows={lh.at(-1)!.extra!.findings!.slice(0, 8).map((f) => ({ label: f.title.split(":")[0], note: `${f.title.split(":").slice(1).join(":").trim()} · ${f.detail.split(" Fix it")[0]}` }))} /> : null}
    </>
  );

  return (
    <>
      <div className="ana-head">
        <span className="eyebrow">{brand} · {pro ? "Pro analytics" : "Analytics preview"}</span>
        <h1>How your account is moving.</h1>
        <p className="muted">{snaps.length} checks since {ws.createdAt.slice(0, 10)}. <Link href={`/w/${token}`}>Back to your Rocco page</Link></p>
      </div>
      <div className="kpis">
        {last && <Stat label="Ad spend (30d)" value={$(num(last, "spend"))} {...(({ text, good }) => ({ delta: text, good }))(delta(last, prev, "spend", $, true))} />}
        {last && <Stat label="Ad sales (30d)" value={$(num(last, "sales"))} {...(({ text, good }) => ({ delta: text, good }))(delta(last, prev, "sales"))} />}
        {last && <Stat label={`ACoS · target ${Math.round(target)}%`} value={pct(num(last, "acosPct"))} {...(({ text, good }) => ({ delta: text, good }))(delta(last, prev, "acosPct", pct, true))} />}
        {last && <Stat label="Wasted spend / mo" value={$(num(last, "leakMonthly"))} {...(({ text, good }) => ({ delta: text, good }))(delta(last, prev, "leakMonthly", $, true))} />}
        <Stat label="Saved by Rocco" value={`${$(brief.saved)}/mo`} delta={`${brief.totals.worked}/${brief.totals.applied} changes worked`} />
      </div>
      {pro ? <div className="ana-grid">{charts}</div> : (
        <div className="ana-lock">
          <div className="ana-grid" aria-hidden>{charts}</div>
          <div className="ana-lock-card">
            <h2>Pro analytics</h2>
            <p>Every trend across every check, what each change saved, stock and listing health over time. For every brand you run.</p>
            <a className="btn" href={hireUrl(ws)}>Hire Rocco · {PRICE.first}</a>
            <p className="fine">{PRICE.line} Unlocks the moment you pay.</p>
          </div>
        </div>
      )}
    </>
  );
}
