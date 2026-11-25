"use client";
import Link from "next/link";
import { useState } from "react";
import { analyze, detectKind, REPORT_HELP, type ReportKind } from "@/lib/analyze";
import { checkAdvice, FREE_ITEMS, magnet, parseAdviceRules, type Advice, type Reports, type Result } from "@/lib/magnets";
import { readTables } from "@/lib/readTable";
import { track } from "@/lib/track";
import { LeadCapture } from "../LeadCapture";
import { Rocco } from "../Rocco";
import { WrappedStory } from "./WrappedStory";

const SAMPLE: Partial<Record<ReportKind, string>> = { sp_search_term: "sp-search-term-report.csv", sp_campaign: "sp-campaign-report.csv", sp_placement: "sp-placement-report.csv", business_report: "business-report.csv", inventory: "restock-inventory.csv" };
const SAMPLE_BEFORE: Partial<Record<ReportKind, string>> = { sp_search_term: "sp-search-term-report-before.csv", sp_campaign: "sp-campaign-report-before.csv" };
const SAMPLE_ADVICE = `Here's what I'd do with your account:
1. Add "free cutting board" and "how to clean cutting board" as negative keywords.
2. Add "charcuterie board large" as a negative, it's off-topic.
3. Raise the bid on "bamboo cutting board" by 40%.
4. Pause "cutting board" since ACoS is high.
5. Move "large bamboo board for kitchen" into an exact match campaign.
6. Restructure everything into single-keyword campaigns.`;
const TONE_ICON = { bad: "🔴", warn: "🟠", good: "🟢", info: "⚪" } as const;

/** One free tool (lib/magnets.ts): reports read in the browser → result → first findings free, the rest after an email. */
export function MagnetTool({ slug }: { slug: string }) {
  const m = magnet(slug)!;
  const [now, setNow] = useState<Reports>({});
  const [before, setBefore] = useState<Reports>({});
  const [form, setForm] = useState<Record<string, string>>(() => Object.fromEntries((m.fields ?? []).filter((f) => f.type === "select").map((f) => [f.key, f.options![0]])));
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [roast, setRoast] = useState<{ lines: string[]; fix?: string } | null>(null);

  const kinds = [...m.needs, ...m.optional];
  const textOnly = !kinds.length;

  async function add(files: { name: string; get: () => Promise<File> }[], slot: "now" | "before") {
    setBusy(true);
    const errs: string[] = [];
    const next = { ...(slot === "now" ? now : before) };
    for (const f of files) {
      try {
        const file = await f.get();
        if (!file.size) { errs.push(`${f.name} is empty. Download it again from Amazon and drop the new file.`); continue; }
        if (/\.(png|jpe?g|gif|webp|heic|pdf)$/i.test(f.name)) { errs.push(`${f.name} is a picture or PDF. Rocco needs the .csv or .xlsx file Amazon lets you download.`); continue; }
        const t = (await readTables(file)).find((x) => detectKind(x));
        if (!t) { errs.push(`${f.name} isn't a report Rocco recognizes. ${m.needs.length ? `This tool needs the ${m.needs.map((k) => `${REPORT_HELP[k].name}: ${REPORT_HELP[k].where}`).join(". And the ")}.` : "Use the reports listed in the box."}`); continue; }
        const out = analyze(t);
        if (!kinds.includes(out.kind)) errs.push(`${f.name}: that's a ${REPORT_HELP[out.kind].name}; this tool doesn't use it (still read).`);
        next[out.kind] = out;
      } catch { errs.push(`${f.name} couldn't be opened. Save it again as .csv (or .xlsx) and drop it here.`); }
    }
    (slot === "now" ? setNow : setBefore)(next);
    setErrors(errs); setBusy(false); setResult(null);
  }
  const sample = async () => {
    const pick = (map: typeof SAMPLE, list: ReportKind[]) => list.filter((k) => map[k]).map((k) => ({ name: map[k]!, get: async () => new File([await (await fetch(`/samples/${map[k]}`)).text()], map[k]!) }));
    await add(pick(slug === "amazon-seller-wrapped" ? { ...SAMPLE, business_report: "business-report-year.csv" } : SAMPLE, kinds), "now");
    if (m.periods) await add(pick(SAMPLE_BEFORE, kinds), "before");
    if (m.fields?.some((f) => f.key === "advice")) setForm((f) => ({ ...f, advice: f.advice || SAMPLE_ADVICE }));
    if (m.fields?.some((f) => f.key === "tasks")) setForm((f) => ({ ...f, tasks: f.tasks || "negatives,bids,harvest,budgets,reporting,creative", fee: f.fee || "1500" }));
    if (slug === "amazon-seller-wrapped") setForm((f) => ({ ...f, hide: "no" })); // sample data is made up: show the money
    if (slug === "am-i-overpaying-amazon") setForm((f) => ({ ...f, agency: f.agency || "1200" }));
    track("tool_result", { tool: slug, link: "sample" });
  };

  const has = (r: Reports, ks: ReportKind[]) => ks.some((k) => r[k]);
  const missing = [
    ...m.needs.filter((k) => !now[k] || (m.periods && !before[k])),
    ...(m.needsOneOf && (!has(now, m.needsOneOf) || (m.periods && !has(before, m.needsOneOf))) ? [m.needsOneOf[0]] : []),
  ];
  const needsAdvice = m.fields?.some((f) => f.key === "advice") && !(form.advice ?? "").trim();
  const ready = !missing.length && !needsAdvice && (slug !== "could-i-fire-my-amazon-agency" || !!form.tasks);

  async function run() {
    setBusy(true); setRoast(null);
    let advice;
    if (needsAdvice === false && m.fields?.some((f) => f.key === "advice")) {
      const r = await fetch("/api/magnets", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ op: "advice", text: form.advice }) }).then((x) => x.json()).catch(() => ({ items: [] }));
      const items = (r.items?.length ? r.items : parseAdviceRules(form.advice)) as Advice[];
      advice = checkAdvice(items, now, Number(form.margin) || undefined);
    }
    const res = m.run({ now, before, form, advice });
    setResult(res); setBusy(false);
    track("tool_result", { tool: slug });
    if (res.roastFacts) {
      setRoast({ lines: [] });
      const r = await fetch("/api/magnets", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ op: "roast", facts: res.roastFacts }) }).then((x) => x.json()).catch(() => ({ lines: [] }));
      setRoast(r.lines?.length ? r : { lines: res.roastLines ?? [], fix: res.items[0] ? `${res.items[0].title}.` : undefined });
    }
    setTimeout(() => document.getElementById("mg-result")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  const url = `https://rocco.works/free/${slug}`;
  const shareUrl = url;
  const free = result?.items.slice(0, FREE_ITEMS) ?? [];
  const rest = result?.items.slice(FREE_ITEMS) ?? [];

  return (
    <div className="mg">
      {m.note && <p className="mg-note"><span aria-hidden>🦝</span><span>{m.note}</span></p>}
      {!textOnly && (
        <p className="mg-trust"><span aria-hidden>🔒</span><span><b>Your reports are never uploaded.</b> Rocco reads them right here on your device, in your browser. Nothing is sent to us or stored, and closing this tab erases them.</span></p>
      )}
      {!textOnly && (
        <div className={`mg-slots${m.periods ? " two" : ""}`}>
          {(m.periods ? (["before", "now"] as const) : (["now"] as const)).map((slot) => (
            <Drop key={slot} label={m.periods ? (slot === "before" ? "Before (earlier period)" : "After (last 30 days)") : "Drop your reports here"} have={slot === "now" ? now : before} kinds={[...new Set(kinds)]} needs={m.needs} oneOf={m.needsOneOf} busy={busy} onFiles={(f) => add(f, slot)} />
          ))}
        </div>
      )}
      {m.fields?.map((f) => <FieldInput key={f.key} f={f} value={form[f.key] ?? ""} onChange={(v) => { setForm({ ...form, [f.key]: v }); setResult(null); }} />)}
      <p className="fine" style={{ margin: "10px 0 0" }}>
        <button className="linkbtn" disabled={busy} onClick={sample}>Try it with a sample account →</button>
      </p>
      {!textOnly && (
        <details className="mg-where">
          <summary>Where do I download these?</summary>
          <ul>{[...new Set(kinds)].map((k) => <li key={k}><b>{REPORT_HELP[k].name}:</b> {REPORT_HELP[k].where}</li>)}</ul>
        </details>
      )}
      {errors.map((e) => <p key={e} className="err" role="alert">{e}</p>)}
      <button className="btn mg-go" disabled={!ready || busy} onClick={run}>
        {busy ? "Reading on your device…" : ready ? `Run ${m.name}` : missing.length ? `Add: ${m.needsOneOf && missing.length === 1 && missing[0] === m.needsOneOf[0] ? m.needsOneOf.map((k) => REPORT_HELP[k].name.replace(/ \(.*\)$/, "").replace(/^Sponsored Products /, "")).join(" or ") : missing.map((k) => REPORT_HELP[k].name.replace(/ \(.*\)$/, "")).join(" + ")}${m.periods ? " for both periods" : ""}` : needsAdvice ? "Paste the advice first" : "Tick what your agency does"}
      </button>

      {result?.wrapped && <div id="mg-result" className="mg-res"><WrappedStory key={result.wrapped.code + (form.hide ?? "")} w={result.wrapped} /><HireNote slug={slug} /></div>}
      {result && !result.wrapped && (
        <div id="mg-result" className="mg-res">
          <div className="verdict">
            {(result.score !== undefined || result.grade) && <div className={`grade g-${result.grade ?? (result.score! >= 75 ? "A" : result.score! >= 50 ? "C" : "F")}`}>{slug === "amazon-money-leak-detector" ? `$${result.score!.toLocaleString("en-US")}` : result.score ?? result.grade}</div>}
            <div>
              {result.scoreLabel && <span className="eyebrow">{result.scoreLabel}{result.grade && result.score !== undefined ? ` · ${result.grade}` : ""}</span>}
              <div className="verdict-head">{result.headline}</div>
              {result.sub && <p className="muted" style={{ margin: "6px 0 0" }}>{result.sub}</p>}
            </div>
            <div className="verdict-rocco"><Rocco pose={m.pose} size={96} /></div>
          </div>
          {!!result.stats.length && <div className="mg-stats">{result.stats.map((s) => <div key={s.k}><span>{s.k}</span><b>{s.v}</b></div>)}</div>}

          {roast && (
            <div className="mg-roast">
              <h3>🔥 The roast</h3>
              {!roast.lines.length ? <p className="muted">Rocco is sharpening his claws…</p> : <ol>{roast.lines.map((l) => <li key={l}>{l}</li>)}</ol>}
              {roast.fix && <p><b>The fix:</b> {roast.fix}</p>}
            </div>
          )}


          {slug === "rocco-watches-your-business" ? <Texts items={free} /> : <Items items={free} />}

          {rest.length > 0 && (
            <div className="mg-gate">
              <LeadCapture leadMagnet={slug} title={`See all ${result.items.length} findings`} cta="Show me everything">
                {slug === "rocco-watches-your-business" ? <Texts items={rest} /> : <Items items={rest} />}
              </LeadCapture>
            </div>
          )}

          <div className="mg-share">
            <b>Share it</b>
            <a className="btn ghost small" target="_blank" rel="noopener" onClick={() => track("link_click", { link: "share_x", tool: slug })} href={`https://x.com/intent/post?text=${encodeURIComponent(result.share)}&url=${encodeURIComponent(shareUrl)}`}>Post on X</a>
            <a className="btn ghost small" target="_blank" rel="noopener" onClick={() => track("link_click", { link: "share_linkedin", tool: slug })} href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}>Share on LinkedIn</a>
            <button className="btn ghost small" onClick={() => { navigator.clipboard?.writeText(`${result.share} ${shareUrl}`); track("link_click", { link: "share_copy", tool: slug }); }}>Copy</button>
          </div>

          <HireNote slug={slug} />
        </div>
      )}
    </div>
  );
}

function HireNote({ slug }: { slug: string }) {
  return (
    <div className="cta-inline mg-hire">
      <div style={{ flex: "1 1 280px" }}>
        <b>Want this every morning, done for you?</b>
        <p className="muted" style={{ margin: 0 }}>Hire Rocco and connect Amazon once. Sales and stock usually show up within hours; Amazon takes up to 48 hours to send ads history the first time. Then Rocco runs these checks daily and makes the fixes you approve.</p>
      </div>
      <Link className="btn small" href={`/?utm_source=free_tool&utm_content=${slug}#price`} onClick={() => track("hire_click", { tool: slug })}>Hire Rocco →</Link>
    </div>
  );
}

function Drop({ label, have, kinds, needs, oneOf, busy, onFiles }: { label: string; have: Reports; kinds: ReportKind[]; needs: ReportKind[]; oneOf?: ReportKind[]; busy: boolean; onFiles: (f: { name: string; get: () => Promise<File> }[]) => void }) {
  const [over, setOver] = useState(false);
  const wrap = (fs: File[]) => onFiles(fs.map((f) => ({ name: f.name, get: async () => f })));
  return (
    <label className={`drop${over ? " over" : ""}${busy ? " busy" : ""}`} onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={(e) => { e.preventDefault(); setOver(false); wrap([...e.dataTransfer.files]); }}>
      <p style={{ fontWeight: 700, fontSize: 17, margin: "0 0 8px" }}>{label}</p>
      <ul className="mg-kinds">
        {kinds.map((k) => <li key={k} className={have[k] ? "ok" : ""}>{have[k] ? "✓" : needs.includes(k) || oneOf?.includes(k) ? "•" : "+"} {REPORT_HELP[k].name.replace(/ \(.*\)$/, "")}{have[k] ? "" : oneOf?.includes(k) ? (k === oneOf[0] ? " (best)" : " (or this)") : !needs.includes(k) ? " (optional)" : ""}</li>)}
      </ul>
      <span className="fine">Drop .csv / .xlsx or tap to choose</span>
      <span className="mg-lock">🔒 Stays on your device · never uploaded</span>
      <input type="file" multiple accept=".csv,.tsv,.txt,.xlsx" hidden onChange={(e) => wrap([...(e.target.files ?? [])])} />
    </label>
  );
}

function FieldInput({ f, value, onChange }: { f: NonNullable<ReturnType<typeof magnet>>["fields"] extends (infer T)[] | undefined ? T : never; value: string; onChange: (v: string) => void }) {
  if (f.type === "checks") {
    const on = new Set(value.split(",").filter(Boolean));
    return (
      <fieldset className="mg-field"><legend>{f.label}</legend>
        <div className="mg-checks">{f.options!.map((o) => { const [k, t] = o.split("|"); return (
          <label key={k}><input type="checkbox" checked={on.has(k)} onChange={(e) => { e.target.checked ? on.add(k) : on.delete(k); onChange([...on].join(",")); }} /> {t}</label>
        ); })}</div>
      </fieldset>
    );
  }
  return (
    <label className="mg-field"><span>{f.label}{f.optional ? <em> (optional)</em> : null}</span>
      {f.type === "textarea" ? <textarea rows={6} value={value} placeholder={f.placeholder} onChange={(e) => onChange(e.target.value)} />
        : f.type === "select" ? <select value={value} onChange={(e) => onChange(e.target.value)}>{f.options!.map((o) => <option key={o} value={o}>{o === "yes" ? "Yes" : o === "no" ? "No" : o}</option>)}</select>
        : <input inputMode="decimal" value={value} placeholder={f.placeholder} onChange={(e) => onChange(e.target.value)} />}
      {f.help && <small className="muted">{f.help}</small>}
    </label>
  );
}

function Items({ items }: { items: Result["items"] }) {
  return (
    <ul className="mg-items">
      {items.map((x, i) => <li key={i} className={`t-${x.tone}`}><span>{TONE_ICON[x.tone]}</span><div><b>{x.title}</b>{x.value ? <em className="hot"> · ~${Math.round(x.value).toLocaleString("en-US")}/mo</em> : null}<p>{x.detail}</p></div></li>)}
    </ul>
  );
}

function Texts({ items }: { items: Result["items"] }) {
  return (
    <div className="mg-texts">
      {items.map((x, i) => { const [when, ...t] = x.title.split(" · "); return (
        <div key={i} className="mg-bubble"><small>{when} · Rocco</small><p><b>{t.join(" · ")}</b> {x.detail}{x.value ? ` (~$${Math.round(x.value).toLocaleString("en-US")}/mo)` : ""}</p></div>
      ); })}
    </div>
  );
}
