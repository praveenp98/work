"use client";
import { useEffect, useState } from "react";
import { track } from "@/lib/analytics";
import type { AplusDraft } from "@/lib/aplus";
import type { KeywordPlan, Listing, ListingEdit } from "@/lib/listings";
import type { ProductProfit } from "@/lib/profit";
import { officeAct } from "@/lib/client/office";

type Acc = { id: string; name: string; country: string };
const post = (body: object) => fetch("/api/w/products", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json()).catch(() => ({ ok: false, error: "No connection. Try again." }));

/**
 * Products: what each product really makes (DataDoe profit table: Amazon fees, refunds, ad spend and the seller's
 * product cost netted), product costs entered once, and listing work per product: keyword fixes, listing issue
 * fixes, A+ drafts. Every Amazon change is checked by Amazon first and can be undone.
 */
export function ProductsStudio({ token, account, items, sym, at }: { token: string; account: Acc; items: ProductProfit[]; sym: string; at?: string }) {
  const m = (x: number) => `${x < 0 ? "−" : ""}${sym}${Math.abs(Math.round(x)).toLocaleString("en-US")}`;
  const pct = (x: number | null) => (x === null ? "—" : `${Math.round(x * 100)}%`);
  const [costs, setCosts] = useState<Record<string, { cost: string; shipping: string }>>({});
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const missing = items.filter((p) => p.cogsMissing);
  const tot = items.reduce((t, p) => ({ sales: t.sales + p.sales, profit: t.profit + p.profit, ads: t.ads + p.adSpend }), { sales: 0, profit: 0, ads: 0 });

  async function saveCosts() {
    const list = Object.entries(costs).map(([sku, v]) => ({ sku, asin: items.find((p) => p.sku === sku)?.asin, cost: Number(v.cost), shipping: Number(v.shipping || 0) })).filter((x) => x.cost > 0);
    if (!list.length) { setMsg("Type a cost per unit first."); return; }
    setBusy(true); setMsg("");
    const d = await post({ t: token, account: account.id, op: "cogs", items: list });
    setBusy(false);
    setMsg(d.ok ? `Saved costs for ${d.saved} product${d.saved === 1 ? "" : "s"}. Profit updates with the next data pull (tomorrow morning, or tap Check connection now on your dashboard in a few minutes).` : d.error);
    if (d.ok) { track("cogs_saved", { products: list.length }); officeAct("desk", "Got your product costs. Re-running profit on the next pull."); }
  }

  return (
    <div className="ps">
      <section className="ps-sum">
        <div><span>Sales · 30 days</span><b>{m(tot.sales)}</b></div>
        <div><span>Profit · 30 days</span><b className={tot.profit < 0 ? "neg" : "pos"}>{m(tot.profit)}</b></div>
        <div><span>Margin</span><b>{tot.sales > 0 ? pct(tot.profit / tot.sales) : "—"}</b></div>
        <div><span>Ad spend in that</span><b>{m(tot.ads)}</b></div>
      </section>
      <p className="fine">After Amazon&apos;s fees, refunds, ad spend and your product cost. From Amazon via DataDoe{at ? `, updated ${new Date(at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : ""}. Shipped orders only, so the last day or two fill in as orders ship.</p>

      {missing.length > 0 && (
        <section className="ps-missing">
          <b>{missing.length} product{missing.length > 1 ? "s need" : " needs"} a cost before the profit is real.</b>
          <span>Without it, profit leaves out what you paid for the product. Enter it once; Rocco keeps it and applies it back 6 months.</span>
        </section>
      )}

      <div className="ps-tw">
        <table className="ps-t">
          <thead><tr><th>Product</th><th>Sales</th><th>Units</th><th>Fees</th><th>Ads</th><th>Product cost</th><th>Profit</th><th>Margin</th><th title="Margin before ads: the most you can pay in ACoS and still break even">Break-even ACoS</th><th></th></tr></thead>
          <tbody>
            {items.map((p) => (
              <ProductRow key={p.sku} p={p} m={m} pct={pct} sym={sym} cost={costs[p.sku]} onCost={(v) => setCosts((c) => ({ ...c, [p.sku]: v }))} open={open === p.sku} onOpen={() => setOpen(open === p.sku ? null : p.sku)} token={token} account={account} />
            ))}
          </tbody>
        </table>
      </div>
      {Object.keys(costs).length > 0 && (
        <div className="ps-save"><button className="btn" disabled={busy} onClick={saveCosts}>{busy ? "Saving…" : "Save product costs"}</button>{msg && <span className="fine">{msg}</span>}</div>
      )}
      {!Object.keys(costs).length && msg && <p className="fine">{msg}</p>}
    </div>
  );
}

function ProductRow({ p, m, pct, sym, cost, onCost, open, onOpen, token, account }: { p: ProductProfit; m: (x: number) => string; pct: (x: number | null) => string; sym: string; cost?: { cost: string; shipping: string }; onCost: (v: { cost: string; shipping: string }) => void; open: boolean; onOpen: () => void; token: string; account: Acc }) {
  return (
    <>
      <tr className={open ? "on" : ""}>
        <td className="ps-name"><b title={p.title}>{p.title || p.sku}</b><small>{p.sku}{p.asin ? ` · ${p.asin}` : ""}</small></td>
        <td>{m(p.sales)}</td><td>{p.units}</td><td>{m(p.fees)}</td><td>{m(p.adSpend)}</td>
        <td>{p.cogsMissing
          ? <span className="ps-cost"><span>{sym}</span><input inputMode="decimal" placeholder="cost/unit" value={cost?.cost ?? ""} onChange={(e) => onCost({ cost: e.target.value, shipping: cost?.shipping ?? "" })} aria-label={`Cost per unit for ${p.sku}`} /><input inputMode="decimal" placeholder="+ship" value={cost?.shipping ?? ""} onChange={(e) => onCost({ cost: cost?.cost ?? "", shipping: e.target.value })} aria-label={`Inbound shipping per unit for ${p.sku}`} /></span>
          : m(p.cogs)}</td>
        <td className={p.profit < 0 ? "neg" : "pos"}>{m(p.profit)}{p.cogsMissing && <small className="ps-est">before cost</small>}</td>
        <td>{pct(p.margin)}</td><td>{pct(p.breakevenAcos)}</td>
        <td><button className="linkbtn" onClick={onOpen} aria-expanded={open}>{open ? "Close" : "Listing →"}</button></td>
      </tr>
      {open && <tr className="ps-panel-row"><td colSpan={10}><ListingPanel token={token} account={account} sku={p.sku} /></td></tr>}
    </>
  );
}

function ListingPanel({ token, account, sku }: { token: string; account: Acc; sku: string }) {
  const [state, setState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [err, setErr] = useState("");
  const [l, setL] = useState<Listing | null>(null);
  const [plan, setPlan] = useState<KeywordPlan | null>(null);
  const [aplus, setAplus] = useState<{ possible: boolean; has: boolean | null } | null>(null);
  const [edits, setEdits] = useState<ListingEdit[]>([]);
  const [suppressed, setSuppressed] = useState(false);
  const load = async () => {
    setState("loading"); setErr("");
    officeAct("dock", `Reading the ${sku} listing from Amazon…`);
    const d = await post({ t: token, account: account.id, op: "listing", sku });
    if (!d.ok) { setState("error"); setErr(d.error ?? "Couldn't read it."); return; }
    setL(d.listing); setPlan(d.plan); setAplus(d.aplus); setEdits(d.edits ?? []); setSuppressed(d.suppressed); setState("ready");
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { void load(); }, []);
  if (state !== "ready" || !l) return <div className="lp">{state === "error" ? <p className="lp-err">{err} <button className="linkbtn" onClick={load}>Try again</button></p> : <p className="fine">Reading the live listing from Amazon…</p>}</div>;
  const onEdit = (e: ListingEdit) => setEdits((x) => [...x, e]);
  return (
    <div className="lp">
      {suppressed && <p className="lp-warn">Amazon is hiding or limiting this listing. Fix the issues below first: a hidden listing doesn&apos;t sell, whatever the ads do.</p>}
      <KeywordFix token={token} account={account} sku={sku} l={l} plan={plan!} onEdit={onEdit} />
      <CopyEdit token={token} account={account} sku={sku} l={l} plan={plan!} onEdit={onEdit} />
      {l.issues.length > 0 && <IssueFix token={token} account={account} sku={sku} l={l} onEdit={onEdit} />}
      {aplus?.possible && l.asin && <AplusDraftBox token={token} account={account} sku={sku} asin={l.asin} has={aplus.has} />}
      {edits.length > 0 && <EditLog token={token} account={account} edits={edits} />}
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) { return <p className="lp-note">💡 {children}</p>; }

function KeywordFix({ token, account, sku, l, plan, onEdit }: { token: string; account: Acc; sku: string; l: Listing; plan: KeywordPlan; onEdit: (e: ListingEdit) => void }) {
  const [busy, setBusy] = useState(false); const [msg, setMsg] = useState("");
  const shared = plan.shared?.orders ? ` (${plan.shared.orders} more order${plan.shared.orders === 1 ? "" : "s"} came from ad groups that advertise several products; Amazon's data can't say which product sold, so I left them out.)` : "";
  if (plan.linked === false) return <section className="lp-sec"><h4>Backend search terms</h4><p className="fine">I can&apos;t tie your ad searches to this exact product yet, so I won&apos;t suggest words. Tap Check connection now on the Today page, wait a minute, then open this product again.</p></section>;
  if (!plan.added.length) return <section className="lp-sec"><h4>Backend search terms</h4><p className="fine">{plan.evidence.length || plan.forTitle.length ? "Nothing to add: every word from this product's selling searches is already in the listing." : "No searches sold this product through its own ad groups in the last 30 days, so there's nothing proven to add."}{shared}</p></section>;
  const go = async () => {
    setBusy(true); setMsg(""); officeAct("dock", `Checking ${sku}'s new search terms with Amazon…`);
    const d = await post({ t: token, account: account.id, op: "keywords", sku, value: plan.keywords });
    setBusy(false);
    setMsg(d.ok ? `Done in Amazon ✓ ${d.warnings?.length ? `Amazon noted: ${d.warnings[0]}` : "I'll check sessions and orders in 2 weeks."}` : d.error);
    if (d.ok) { onEdit(d.edit); officeAct("lab", `Updated ${sku}'s search terms ✓ Watching for 2 weeks.`); track("listing_keywords", { added: plan.added.length }); }
  };
  return (
    <section className="lp-sec">
      <h4>Add {plan.added.length} selling word{plan.added.length > 1 ? "s" : ""} to backend search terms</h4>
      <p className="fine">From searches that got orders for this product, through ad groups that advertise only it: {plan.evidence.map((e) => `“${e.term}” (${e.orders} orders)`).join(", ")}.{shared}</p>
      <div className="lp-diff"><div><small>Now</small><code>{l.keywords || "(empty)"}</code></div><div><small>New</small><code>{plan.keywords}</code></div></div>
      <div className="lp-chips">{plan.added.map((w) => <span key={w}>+ {w}</span>)}</div>
      <Note>Shoppers never see backend search terms; they only help Amazon match your product to searches. I keep everything you have, add words only from searches that already sold, and stay under Amazon&apos;s 250-byte limit. Amazon checks it before it goes live.</Note>
      <button className="btn small" disabled={busy || msg.startsWith("Done")} onClick={go}>{busy ? "Checking with Amazon…" : "Update search terms in Amazon"}</button>
      {msg && <p className="fine" role="status">{msg}</p>}
    </section>
  );
}

function CopyEdit({ token, account, sku, l, plan, onEdit }: { token: string; account: Acc; sku: string; l: Listing; plan: KeywordPlan; onEdit: (e: ListingEdit) => void }) {
  const [title, setTitle] = useState(l.title);
  const [bullets, setBullets] = useState<string[]>([...l.bullets, ...Array(Math.max(0, 5 - l.bullets.length)).fill("")].slice(0, 5));
  const [busy, setBusy] = useState<"" | "title" | "bullets">(""); const [msg, setMsg] = useState("");
  const save = async (field: "title" | "bullets") => {
    setBusy(field); setMsg(""); officeAct("dock", `Checking the new ${field} with Amazon…`);
    const d = await post({ t: token, account: account.id, op: field, sku, value: field === "title" ? title : bullets.filter((b) => b.trim()) });
    setBusy(""); setMsg(d.ok ? `${field === "title" ? "Title" : "Bullets"} updated in Amazon ✓ The old version is saved: Undo is below.` : d.error);
    if (d.ok) { onEdit(d.edit); track("listing_copy", { field }); }
  };
  const changedT = title.trim() !== l.title.trim();
  const changedB = bullets.filter((b) => b.trim()).join("|") !== l.bullets.join("|");
  return (
    <section className="lp-sec">
      <h4>Title and bullets</h4>
      {(plan.forTitle.length > 0 || plan.forBullets.length > 0) && <p className="fine">Words shoppers use that aren&apos;t here yet: {plan.forTitle.length > 0 && <>title: <b>{plan.forTitle.join(", ")}</b></>}{plan.forTitle.length > 0 && plan.forBullets.length > 0 && " · "}{plan.forBullets.length > 0 && <>bullets: <b>{plan.forBullets.join(", ")}</b></>}</p>}
      <label className="lp-f">Title <small>{title.length}/200</small><textarea rows={2} value={title} onChange={(e) => setTitle(e.target.value)} /></label>
      <button className="btn small ghost" disabled={!changedT || !!busy} onClick={() => save("title")}>{busy === "title" ? "Checking with Amazon…" : "Save title in Amazon"}</button>
      <div className="lp-bul">{bullets.map((b, i) => <textarea key={i} rows={2} value={b} placeholder={`Bullet ${i + 1}`} onChange={(e) => setBullets(bullets.map((x, j) => (j === i ? e.target.value : x)))} />)}</div>
      <button className="btn small ghost" disabled={!changedB || !!busy} onClick={() => save("bullets")}>{busy === "bullets" ? "Checking with Amazon…" : "Save bullets in Amazon"}</button>
      <Note>The title is what shoppers see first, so treat it like a price change: one thing at a time on your best seller, keep your main keyword at the front, and give it two weeks before judging. Amazon checks every edit before it goes live, and I keep the old version so Undo is one tap.</Note>
      {msg && <p className="fine" role="status">{msg}</p>}
    </section>
  );
}

function IssueFix({ token, account, sku, l, onEdit }: { token: string; account: Acc; sku: string; l: Listing; onEdit: (e: ListingEdit) => void }) {
  const [vals, setVals] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<Record<string, string>>({});
  const fix = async (attr: string) => {
    setMsg((x) => ({ ...x, [attr]: "Checking with Amazon…" }));
    const d = await post({ t: token, account: account.id, op: "attribute", sku, productType: l.productType, attribute: attr, value: vals[attr] });
    setMsg((x) => ({ ...x, [attr]: d.ok ? "Fixed in Amazon ✓ It can take Amazon up to a day to show the listing again." : d.error }));
    if (d.ok) { onEdit(d.edit); track("listing_issue_fixed", { attr }); }
  };
  return (
    <section className="lp-sec">
      <h4>Amazon&apos;s issues on this listing</h4>
      <ul className="lp-issues">
        {l.issues.map((i, k) => (
          <li key={k} className={`sev-${i.severity}`}>
            <b>{i.severity === "ERROR" ? "Needs fixing" : i.severity === "WARNING" ? "Worth fixing" : "FYI"}</b> {i.message}
            {i.attributes.slice(0, 2).map((a) => (
              <span key={a} className="lp-attr"><code>{a.replace(/_/g, " ")}</code><input value={vals[a] ?? ""} placeholder="The correct value" onChange={(e) => setVals((v) => ({ ...v, [a]: e.target.value }))} /><button className="btn small" disabled={!vals[a]?.trim()} onClick={() => fix(a)}>Fix in Amazon</button>{msg[a] && <small>{msg[a]}</small>}</span>
            ))}
          </li>
        ))}
      </ul>
      <Note>Type the real value (for example the material or the size). Amazon checks it against its rules before anything changes; if it&apos;s not accepted, it tells you why and nothing changes.</Note>
    </section>
  );
}

function AplusDraftBox({ token, account, sku, asin, has }: { token: string; account: Acc; sku: string; asin: string; has: boolean | null }) {
  const [d, setD] = useState<AplusDraft | null>(null);
  const [busy, setBusy] = useState(""); const [msg, setMsg] = useState("");
  if (has === true) return <section className="lp-sec"><h4>A+ content</h4><p className="fine">This product already has A+ content. I won&apos;t replace it.</p></section>;
  const draft = async () => {
    setBusy("draft"); setMsg(""); officeAct("desk", "Writing an A+ draft from your listing…");
    const r = await post({ t: token, account: account.id, op: "aplus_draft", sku });
    setBusy(""); if (r.ok) setD(r.draft); else setMsg(r.error);
  };
  const submit = async () => {
    if (!d) return;
    setBusy("submit"); setMsg("");
    const r = await post({ t: token, account: account.id, op: "aplus_submit", sku, asin, draft: d });
    setBusy(""); setMsg(r.ok ? "Sent to Amazon for review ✓ Amazon usually approves A+ within 7 days; I'll show it here when it's live." : r.error);
    if (r.ok) track("aplus_submitted");
  };
  return (
    <section className="lp-sec">
      <h4>A+ content</h4>
      {!d ? (
        <>
          <p className="fine">This product has no A+ yet. I can write a text-only A+ from your own listing and the searches that sell. You edit every word before it goes anywhere.</p>
          <button className="btn small" disabled={!!busy} onClick={draft}>{busy ? "Writing…" : "Draft A+ with Rocco"}</button>
        </>
      ) : (
        <div className="lp-aplus">
          <label className="lp-f">Headline<input value={d.headline} onChange={(e) => setD({ ...d, headline: e.target.value })} /></label>
          {d.intro.map((p, i) => <label key={i} className="lp-f">Paragraph {i + 1}<textarea rows={3} value={p} onChange={(e) => setD({ ...d, intro: d.intro.map((x, j) => (j === i ? e.target.value : x)) })} /></label>)}
          <label className="lp-f">Product description<textarea rows={4} value={d.description} onChange={(e) => setD({ ...d, description: e.target.value })} /></label>
          {d.specs.length > 0 && <div className="lp-specs">{d.specs.map((s, i) => <span key={i}><input value={s.label} onChange={(e) => setD({ ...d, specs: d.specs.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} /><input value={s.value} onChange={(e) => setD({ ...d, specs: d.specs.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)) })} /></span>)}</div>}
          <button className="btn small" disabled={!!busy} onClick={submit}>{busy === "submit" ? "Checking with Amazon…" : "Send to Amazon for review"}</button>
        </div>
      )}
      <Note>Amazon reviews every A+ before shoppers see it, usually within 7 days, and needs Brand Registry. I write only from facts already in your listing, keep it to text (add images later in Seller Central), and leave out what Amazon rejects: prices, guarantees, reviews and health claims.</Note>
      {msg && <p className="fine" role="status">{msg}</p>}
    </section>
  );
}

function EditLog({ token, account, edits }: { token: string; account: Acc; edits: ListingEdit[] }) {
  const [state, setState] = useState<Record<string, string>>({});
  const undo = async (e: ListingEdit) => {
    if (!confirm(`Put the old ${e.field} back in Amazon?`)) return;
    setState((s) => ({ ...s, [e.id]: "Undoing…" }));
    const d = await post({ t: token, account: account.id, op: "undo", edit: e.id });
    setState((s) => ({ ...s, [e.id]: d.ok ? "Undone ✓" : d.error }));
  };
  return (
    <section className="lp-sec">
      <h4>Changes to this listing</h4>
      <ul className="lp-log">{[...edits].reverse().map((e) => (
        <li key={e.id}><span>{new Date(e.at).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {e.field === "attribute" ? `fixed ${e.attribute?.replace(/_/g, " ")}` : `updated ${e.field}`} · {e.by}</span>
          {e.status === "undone" || state[e.id] === "Undone ✓" ? <em>undone</em> : e.field !== "attribute" ? <button className="linkbtn" onClick={() => undo(e)}>{state[e.id] || "Undo"}</button> : null}
        </li>
      ))}</ul>
    </section>
  );
}
