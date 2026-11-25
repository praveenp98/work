"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getLicense, setLicense, validateLicense } from "@/lib/license";
import { parseBulk, isBulkSheet, type BulkIndex } from "@/lib/parsers/bulk";
import { detectReport, parseSearchTermReport, type ParsedReport } from "@/lib/parsers/searchTerm";
import { download, readTables } from "@/lib/readTable";
import { bulkSheetCsv, fixListCsv } from "@/lib/rules/export";
import { paybackDays, roast } from "@/lib/rules/roast";
import { CountUp } from "./CountUp";
import { Raccoon } from "./Raccoon";
import { Rocco } from "./Rocco";
import { usePrice } from "./usePrice";
import { ShareCard } from "./ShareCard";

const money = (c: string, n: number) => `${c}${Math.round(n).toLocaleString("en-US")}`;
const pct = (n: number) => (n < 0 ? "–" : `${Math.round(n * 100)}%`);

export function AdRoastTool() {
  const price = usePrice();
  const [report, setReport] = useState<ParsedReport | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const [targetAcos, setTargetAcos] = useState(30);
  const [minClicks, setMinClicks] = useState(10);
  const [unlocked, setUnlocked] = useState(false);
  const [bulk, setBulk] = useState<BulkIndex | null>(null);

  useEffect(() => { if (getLicense()) setUnlocked(true); }, []);

  const result = useMemo(
    () => (report ? roast(report, { targetAcos: targetAcos / 100, minClicksNegative: minClicks }) : null),
    [report, targetAcos, minClicks],
  );

  async function handle(file: File | Blob, name = (file as File).name) {
    setError(""); setBusy(true);
    try {
      const f = file instanceof File ? file : new File([file], name);
      const tables = await readTables(f);
      const t = tables.find((x) => detectReport(x));
      if (!t) {
        if (tables.some((x) => x.slice(0, 5).some((r) => isBulkSheet(r ?? [])))) throw new Error("That's a bulk file. Upload the search term report first, then add the bulk file below.");
        throw new Error("This doesn't look like a Sponsored Products search term report. In Amazon Ads: Reports → Create report → Sponsored Products → Search term → Summary or Daily → download as .xlsx or .csv.");
      }
      setReport(parseSearchTermReport(t));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't read that file.");
    } finally { setBusy(false); }
  }

  async function handleBulk(file: File) {
    setError("");
    try {
      const tables = await readTables(file);
      const t = tables.find((x) => x.slice(0, 5).some((r) => isBulkSheet(r ?? [])));
      if (!t) throw new Error("No Sponsored Products sheet found in that bulk file.");
      setBulk(parseBulk(t));
    } catch (e) { setError(e instanceof Error ? e.message : "Couldn't read the bulk file."); }
  }

  if (!result) {
    return (
      <div className="tool">
        <label
          className={`drop${over ? " over" : ""}${busy ? " busy" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setOver(true); }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => { e.preventDefault(); setOver(false); const f = e.dataTransfer.files[0]; if (f) handle(f); }}
        >
          <Rocco pose="hero" size={110} />
          <p style={{ fontWeight: 650, fontSize: 18, margin: "8px 0 4px" }}>{busy ? "Rocco is digging…" : "Drop your search term report here"}</p>
          <p className="muted" style={{ margin: 0 }}>.xlsx or .csv · Sponsored Products · last 30–60 days works best</p>
          <input type="file" accept=".csv,.tsv,.txt,.xlsx" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) handle(f); }} />
        </label>
        {error && <p className="err" style={{ marginTop: 12 }}>{error}</p>}
        <p className="fine" style={{ marginTop: 12 }}>
          Your file is read inside your browser. It is never uploaded to our servers. No login.{" "}
          <button className="linkish" style={{ background: "none", border: 0, color: "var(--accent)", cursor: "pointer", font: "inherit", padding: "10px 0", fontWeight: 600 }}
            onClick={async () => { const r = await fetch("/sample-search-term-report.csv"); handle(await r.blob(), "sample.csv"); }}>
            No report handy? Try a sample.
          </button>
        </p>
      </div>
    );
  }

  const r = result;
  const payback = paybackDays(price, r.leakMonthly);
  const scale = 100 / Math.max(60, r.totals.acos * 100 + 10); // bar scale so "now" never overflows
  const counts = { n: r.fixes.negatives.length, h: r.fixes.harvest.length, b: r.fixes.bids.length };

  return (
    <div className="tool">
      <div className="verdict">
        <div className={`grade g-${r.grade}`}>{r.grade}</div>
        <div>
          <span className="eyebrow">Leak Score</span>
          <div className="verdict-head">{r.headline}</div>
        </div>
        <div className="verdict-rocco"><Rocco pose={r.grade <= "B" ? "party" : "judge"} size={110} /></div>
      </div>

      {r.leakTotal > 0 && (
        <div className="aha">
          <div className="aha-yearly">
            <span className="eyebrow">If nothing changes, that&apos;s</span>
            <div className="big"><CountUp value={r.leakYearly} prefix={r.currency} /><span style={{ fontSize: 20, color: "inherit", opacity: 0.7 }}> /year</span></div>
            <p>
              {payback !== null && <>Rocco (${price}, once) pays for itself in <b style={{ color: "var(--gold)" }}>{payback} day{payback === 1 ? "" : "s"}</b>. </>}
              That&apos;s {money(r.currency, r.leakMonthly / 30)} a day to shoppers who never buy.
            </p>
          </div>
          {r.totals.acos > 0 && r.projectedAcos >= 0 && (
            <div className="aha-acos">
              <span className="eyebrow">Your ACoS after the fixes</span>
              <div className="bars">
                <div className="bar"><span>Now</span><div className="track"><div className="fill now" style={{ width: `${Math.min(100, r.totals.acos * 100 * scale)}%` }} /></div><b>{pct(r.totals.acos)}</b></div>
                <div className="bar"><span>After</span><div className="track"><div className="fill after" style={{ width: `${Math.min(100, r.projectedAcos * 100 * scale)}%` }} /></div><b style={{ color: "var(--accent)" }}>{pct(r.projectedAcos)}</b></div>
              </div>
              <p className="fine" style={{ marginTop: 10 }}>Same ad sales, minus the leaked spend. Estimate: cut terms had no sales, so cutting them shouldn&apos;t cost you orders.</p>
            </div>
          )}
        </div>
      )}

      {r.eaten.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <b>Rocco ate these for you:</b>
          <div className="eaten">
            {r.eaten.map((e, i) => (
              <span className="chip" key={e.term} style={{ animationDelay: `${i * 90}ms` }}>
                <s>{e.term}</s> <b>{money(r.currency, e.spend)}</b>
              </span>
            ))}
          </div>
        </div>
      )}
      <div className="stats">
        <div className="stat"><b>{money(r.currency, r.totals.spend)}</b><span>ad spend ({r.days} days)</span></div>
        <div className="stat"><b>{money(r.currency, r.totals.sales)}</b><span>ad sales</span></div>
        <div className="stat"><b>{pct(r.totals.acos)}</b><span>ACoS</span></div>
        <div className="stat"><b className="warn">{money(r.currency, r.leakTotal)}</b><span>leaked in this report</span></div>
      </div>
      {r.warnings.map((w) => <p key={w} className="fine">⚠ {w}</p>)}

      <div className="row" style={{ marginBottom: 6 }}>
        <label className="f">Target ACoS (%)<input type="number" min={5} max={100} value={targetAcos} onChange={(e) => setTargetAcos(Number(e.target.value) || 30)} /></label>
        <label className="f">Clicks before a term is a leak<input type="number" min={3} max={100} value={minClicks} onChange={(e) => setMinClicks(Number(e.target.value) || 10)} /></label>
      </div>

      <h2 style={{ marginTop: 18 }}>Top leaks</h2>
      {r.leaks.length === 0 && <p>Nothing to roast. Your account is clean at these settings.</p>}
      {r.leaks.slice(0, 3).map((l) => (
        <div className="leak" key={l.kind}>
          <div><b>{l.title}</b> · {l.count} term{l.count === 1 ? "" : "s"}{l.wasted > 0 && <> · <span className="amt">{money(r.currency, l.monthly)}/month</span></>}</div>
          <p className="said">Rocco: {l.line}</p>
        </div>
      ))}
      {r.win && <p style={{ marginTop: 12 }}>🏆 Best term: <b>&ldquo;{r.win.term}&rdquo;</b>, {money(r.currency, r.win.sales)} at {pct(r.win.acos)} ACoS. Rocco approves.</p>}
      <ShareCard r={r} />

      <h2>The fixes</h2>
      <p className="muted">{counts.n} negatives to add, {counts.h} search terms to harvest, {counts.b} bid changes (each capped at ±{Math.round(r.settings.bidCap * 100)}%).</p>

      {unlocked ? (
        <FixTables r={r} bulk={bulk} onBulk={handleBulk} />
      ) : (
        <div className="locked">
          <div className="blur" aria-hidden><FixTables r={{ ...r, fixes: { negatives: r.fixes.negatives.slice(0, 3), harvest: r.fixes.harvest.slice(0, 2), bids: r.fixes.bids.slice(0, 3) } }} bulk={null} onBulk={() => {}} /></div>
          <Unlock onUnlocked={() => setUnlocked(true)} />
        </div>
      )}
      <p style={{ marginTop: 18 }}><button className="btn ghost small" onClick={() => { setReport(null); setBulk(null); }}>Roast another report</button></p>
      {error && <p className="err">{error}</p>}
    </div>
  );
}

function Unlock({ onUnlocked }: { onUnlocked: () => void }) {
  const [key, setKey] = useState("");
  const [msg, setMsg] = useState("");
  return (
    <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", padding: 16 }}>
      <div className="card" style={{ maxWidth: 440, textAlign: "center", boxShadow: "0 10px 40px rgba(0,0,0,.12)" }}>
        <Raccoon size={44} mood="judging" />
        <h3 style={{ marginTop: 6 }}>Get every fix + a ready-to-upload bulk file</h3>
        <p className="muted">Rocco finds these every morning and makes them in Amazon after you approve. $2,790 a year or $279 a month, 7-day money-back guarantee.</p>
        <Link href="/pricing?utm_source=tool&utm_medium=paywall&utm_campaign=ad_roast" className="btn">Hire Rocco: fixes made for you</Link>
        <form style={{ marginTop: 14 }} className="row" onSubmit={async (e) => {
          e.preventDefault(); setMsg("Checking…");
          const v = await validateLicense(key.trim());
          if (v.ok) { setLicense(key.trim()); onUnlocked(); } else setMsg(v.error || "That key didn't work.");
        }}>
          <input aria-label="License key" placeholder="Have an old license key? Paste it" value={key} onChange={(e) => setKey(e.target.value)}
            style={{ flex: "1 1 200px", padding: "9px 12px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--bg)", color: "var(--ink)" }} />
          <button className="btn small" type="submit">Unlock</button>
        </form>
        {msg && <p className="fine" style={{ marginTop: 8 }}>{msg}</p>}
      </div>
    </div>
  );
}

function FixTables({ r, bulk, onBulk }: { r: ReturnType<typeof roast>; bulk: BulkIndex | null; onBulk: (f: File) => void }) {
  const bulkOut = bulk ? bulkSheetCsv(r, bulk) : null;
  return (
    <div>
      <div className="row" style={{ marginBottom: 12 }}>
        <button className="btn small" onClick={() => download("rocco-fix-list.csv", fixListCsv(r))}>Download fix list (.csv)</button>
        {bulkOut ? (
          <button className="btn small" onClick={() => download("rocco-bulk-upload.csv", bulkOut.csv)}>Download bulk file ({bulkOut.matched} rows)</button>
        ) : (
          <label className="btn ghost small" style={{ cursor: "pointer" }}>
            Add your bulk file to get an upload-ready sheet
            <input type="file" accept=".xlsx,.csv" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) onBulk(f); }} />
          </label>
        )}
      </div>
      {bulkOut && bulkOut.skipped > 0 && <p className="fine">{bulkOut.skipped} fixes couldn&apos;t be matched to IDs in your bulk file (renamed or archived campaigns). They&apos;re still in the fix list.</p>}
      <p className="fine">Review before uploading. Rocco never touches your account: you upload the file in Amazon Ads → Bulk operations, and you can undo any change there.</p>

      <h3 style={{ marginTop: 16 }}>Add these negatives</h3>
      <div className="tablewrap"><table className="fixes"><thead><tr><th>Search term</th><th>Campaign / ad group</th><th>Spent</th><th>Why</th></tr></thead>
        <tbody>{r.fixes.negatives.map((n) => <tr key={n.campaign + n.adGroup + n.keyword}><td>{n.keyword}</td><td>{n.campaign} / {n.adGroup}</td><td>{r.currency}{n.spend.toFixed(2)}</td><td>{n.reason}</td></tr>)}</tbody></table></div>

      <h3 style={{ marginTop: 16 }}>Harvest these winners as exact keywords</h3>
      <div className="tablewrap"><table className="fixes"><thead><tr><th>Search term</th><th>From</th><th>Sales</th><th>ACoS</th><th>Start bid</th></tr></thead>
        <tbody>{r.fixes.harvest.map((h) => <tr key={h.keyword}><td>{h.keyword}</td><td>{h.sourceCampaign}</td><td>{r.currency}{h.sales.toFixed(0)}</td><td>{pct(h.acos)}</td><td>{r.currency}{h.suggestedBid.toFixed(2)}</td></tr>)}</tbody></table></div>

      <h3 style={{ marginTop: 16 }}>Change these bids</h3>
      <div className="tablewrap"><table className="fixes"><thead><tr><th>Target</th><th>Campaign / ad group</th><th>Avg CPC</th><th>New bid</th><th>Why</th></tr></thead>
        <tbody>{r.fixes.bids.map((b) => <tr key={b.campaign + b.adGroup + b.targeting + b.matchType}><td>{b.targeting} <span className="muted">({b.matchType === "-" ? "auto" : b.matchType.toLowerCase()})</span></td><td>{b.campaign} / {b.adGroup}</td><td>{r.currency}{b.currentCpc.toFixed(2)}</td><td><b>{r.currency}{b.newBid.toFixed(2)}</b> <span className="muted">({b.changePct > 0 ? "+" : ""}{b.changePct}%)</span></td><td>{b.reason}</td></tr>)}</tbody></table></div>
    </div>
  );
}
