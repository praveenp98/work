"use client";
import Link from "next/link";
import { useState } from "react";
import { analyze, detectKind, REPORT_HELP, type ReportKind } from "@/lib/analyze";
import { readTables } from "@/lib/readTable";
import { accountScore } from "@/lib/rules/score";
import type { Analysis } from "@/lib/rules/types";
import { CountUp } from "./CountUp";
import { Rocco } from "./Rocco";

const SAMPLES = ["sp-search-term-report.csv", "sp-campaign-report.csv", "sp-placement-report.csv", "business-report.csv", "restock-inventory.csv", "sp-bulk-structure.csv"];
const ICON: Record<string, string> = { high: "🔴", medium: "🟠", low: "⚪", win: "🟢" };
const ORDER: ReportKind[] = ["sp_search_term", "sp_campaign", "sp_placement", "business_report", "inventory", "bulk"];
const FREE_ACTIONS = 5;

/** Drop several Amazon reports at once; everything runs in the browser. */
export function AccountCheck() {
  const [results, setResults] = useState<Partial<Record<ReportKind, Analysis>>>({});
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);

  async function addFiles(files: { name: string; get: () => Promise<File> }[]) {
    setBusy(true);
    const errs: string[] = [];
    const next = { ...results };
    for (const f of files) {
      try {
        const file = await f.get();
        if (!file.size) { errs.push(`${f.name} is empty. Download it again from Amazon.`); continue; }
        if (/\.(png|jpe?g|gif|webp|heic|pdf)$/i.test(f.name)) { errs.push(`${f.name} is a picture or PDF. Rocco needs the .csv or .xlsx file Amazon lets you download.`); continue; }
        const tables = await readTables(file);
        const t = tables.find((x) => detectKind(x));
        if (!t) { errs.push(`${f.name} isn't a report Rocco recognizes. Rocco reads: ${Object.values(REPORT_HELP).map((h) => h.name).join(", ")}.`); continue; }
        const out = analyze(t);
        next[out.kind] = out.analysis;
      } catch { errs.push(`${f.name} couldn't be opened. Save it again as .csv (or .xlsx) and drop it here.`); }
    }
    setResults(next); setErrors(errs); setBusy(false);
  }

  const analyses = ORDER.map((k) => results[k]).filter((a): a is Analysis => !!a);
  const s = analyses.length ? accountScore(analyses) : null;
  const missing = ORDER.filter((k) => !results[k]);

  return (
    <div className="tool">
      <label className={`drop${over ? " over" : ""}${busy ? " busy" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); addFiles([...e.dataTransfer.files].map((f) => ({ name: f.name, get: async () => f }))); }}>
        <Rocco pose="hero" size={100} />
        <p style={{ fontWeight: 700, fontSize: 18, margin: "8px 0 4px" }}>{busy ? "Rocco is digging…" : "Drop all your reports here (or one at a time)"}</p>
        <p className="muted" style={{ margin: 0 }}>Search terms · Campaigns · Placements · Business Report · Restock · Bulk file. .csv or .xlsx.</p>
        <input type="file" multiple accept=".csv,.tsv,.txt,.xlsx" hidden onChange={(e) => addFiles([...(e.target.files ?? [])].map((f) => ({ name: f.name, get: async () => f })))} />
      </label>
      <p className="fine" style={{ marginTop: 10 }}>Files are read in your browser and never uploaded. <button className="linkbtn" disabled={busy}
        onClick={() => addFiles(SAMPLES.map((n) => ({ name: n, get: async () => new File([await (await fetch(`/samples/${n}`)).text()], n) })))}>Try it with a sample account (6 reports) →</button></p>
      {errors.map((e) => <p key={e} className="err">{e}</p>)}

      {s && (
        <>
          <div className="verdict" style={{ marginTop: 18 }}>
            <div className={`grade g-${s.grade}`}>{s.score}</div>
            <div>
              <span className="eyebrow">Rocco Score · {analyses.length} of 6 areas checked</span>
              <div className="verdict-head">{s.high} urgent issue{s.high === 1 ? "" : "s"} and about <span className="hot">$<CountUp value={s.atStakeMonthly} />/month</span> at stake across your account.</div>
            </div>
            <div className="verdict-rocco"><Rocco pose={s.score >= 75 ? "party" : "judge"} size={100} /></div>
          </div>

          <h2>Do these first</h2>
          <ol className="actions">
            {s.proposals.slice(0, FREE_ACTIONS).map((p) => (
              <li key={p.kind + p.code + p.campaign + p.target}><b>{p.target}</b> <span className="muted">· {p.campaign && p.campaign !== p.target ? p.campaign : p.kind}</span><br /><span>{p.reason}</span>{p.valueMonthly ? <span className="hot"> · ~${Math.round(p.valueMonthly)}/mo</span> : null}</li>
            ))}
          </ol>
          {s.proposals.length > FREE_ACTIONS && (
            <div className="cta-inline" style={{ marginTop: 12 }}>
              <div style={{ flex: "1 1 260px" }}><b>+{s.proposals.length - FREE_ACTIONS} more changes Rocco wants to make.</b><p className="muted" style={{ margin: 0 }}>Hire Rocco to get them as one-tap approvals made in Amazon, as an approval list he tracks and re-checks every week.</p></div>
              <Link className="btn small" href="/?utm_source=account_check#price">Hire Rocco →</Link>
            </div>
          )}

          <h2>Area by area</h2>
          <div className="grid">
            {ORDER.filter((k) => results[k]).map((k) => {
              const a = results[k]!;
              return (
                <div className="card" key={k}>
                  <span className="tag">{REPORT_HELP[k].name}</span>
                  <p style={{ fontWeight: 700, margin: "0 0 8px" }}>{a.headline}</p>
                  <ul className="md" style={{ paddingLeft: 18 }}>{a.findings.slice(0, 3).map((f) => <li key={f.title}>{ICON[f.severity]} {f.title}</li>)}</ul>
                </div>
              );
            })}
          </div>
          {missing.length > 0 && (
            <>
              <h3 style={{ marginTop: 24 }}>Rocco can also check</h3>
              <ul>{missing.map((k) => <li key={k}><b>{REPORT_HELP[k].name}</b>: <span className="muted">{REPORT_HELP[k].where}</span></li>)}</ul>
            </>
          )}
        </>
      )}
    </div>
  );
}
