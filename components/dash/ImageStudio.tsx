"use client";
import { useEffect, useRef, useState } from "react";
import type { Concept, Creative, CreativeKind } from "@/lib/creative";

type Product = { sku: string; asin: string; title: string };

/**
 * Listing and A+ images on demand: Rocco (Opus) plans the images from the listing, Higgsfield renders each from the
 * product's real photo, the seller picks one and Rocco puts it into a listing image slot (Amazon checks it first).
 */
export function ImageStudio({ token, account, products }: { token: string; account: string; products: Product[] }) {
  const [sku, setSku] = useState(products[0]?.sku ?? "");
  const [kind, setKind] = useState<CreativeKind>("listing");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [refs, setRefs] = useState<string[]>([]);
  const [items, setItems] = useState<Creative[]>([]);
  const post = (body: Record<string, unknown>) => fetch("/api/w/creative", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ t: token, account, ...body }) }).then((r) => r.json()).catch(() => ({ ok: false, error: "Network hiccup. Try again." }));

  useEffect(() => { post({ op: "list", sku }).then((r) => r.ok && setItems(r.items ?? [])); setConcepts([]); setPhotos([]); setRefs([]); }, [sku]); // eslint-disable-line react-hooks/exhaustive-deps

  // Poll renders that are still going.
  const itemsRef = useRef(items); itemsRef.current = items;
  useEffect(() => {
    const t = setInterval(async () => {
      const pending = itemsRef.current.filter((x) => x.status === "rendering");
      if (!pending.length) return;
      for (const p of pending) {
        const r = await post({ op: "status", id: p.id });
        if (r.ok && r.item && r.item.status !== "rendering") setItems((xs) => xs.map((x) => (x.id === p.id ? r.item : x)));
      }
    }, 4000);
    return () => clearInterval(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function plan() {
    setBusy(true); setErr(""); setConcepts([]);
    const r = await post({ op: "plan", sku, kind, note });
    if (r.ok) { setConcepts(r.concepts); setPhotos(r.photos ?? []); setRefs((r.photos ?? []).slice(0, 1)); } else setErr(r.error ?? "Couldn't plan images.");
    setBusy(false);
  }
  async function upload(f: File) {
    const fd = new FormData(); fd.set("t", token); fd.set("account", account); fd.set("file", f);
    const r = await fetch("/api/w/creative", { method: "POST", body: fd }).then((x) => x.json()).catch(() => ({ ok: false }));
    if (r.ok) { setPhotos((p) => [r.url, ...p]); setRefs((x) => [r.url, ...x].slice(0, 3)); } else setErr(r.error ?? "Upload failed.");
  }
  async function render(c: Concept) {
    setErr("");
    const r = await post({ op: "render", sku, kind, concept: c, refs });
    if (r.item) setItems((xs) => [r.item, ...xs]);
    if (!r.ok) setErr(r.error ?? "Couldn't start the image.");
  }

  const product = products.find((p) => p.sku === sku);
  return (
    <div className="is">
      <section className="is-pick">
        <label>Product
          <select value={sku} onChange={(e) => setSku(e.target.value)}>{products.map((p) => <option key={p.sku} value={p.sku}>{p.title.slice(0, 70)} · {p.sku}</option>)}</select>
        </label>
        <div className="is-kind" role="radiogroup" aria-label="What to make">
          <button role="radio" aria-checked={kind === "listing"} className={kind === "listing" ? "on" : ""} onClick={() => setKind("listing")}>Listing images <small>slots 2–7, square</small></button>
          <button role="radio" aria-checked={kind === "aplus"} className={kind === "aplus" ? "on" : ""} onClick={() => setKind("aplus")}>A+ images <small>banner + feature tiles</small></button>
        </div>
        <label>Anything Rocco should know? <em>(optional)</em>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. our buyers are new runners; keep it bright and outdoorsy" />
        </label>
        <button className="btn" disabled={busy || !sku} onClick={plan}>{busy ? "Rocco is planning the images…" : concepts.length ? "Plan again" : "Plan my images"}</button>
        <p className="fine">Rocco keeps your main white-background image. Every new image starts from your real product photo, so the product stays exactly as it is. Amazon's image rules are built in: no badges, prices, reviews or claims your listing doesn't make.</p>
      </section>

      {err && <p className="err">{err}</p>}

      {concepts.length > 0 && (
        <section className="is-refs">
          <b>Product photo to work from</b> <small>(pick 1–3; the first matters most)</small>
          <div className="is-thumbs">
            {photos.map((u) => <button key={u} className={refs.includes(u) ? "on" : ""} onClick={() => setRefs((x) => (x.includes(u) ? x.filter((y) => y !== u) : [...x, u].slice(0, 3)))}><img src={u} alt="" /></button>)}
            <label className="is-up">+ Upload<input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} /></label>
          </div>
          {!photos.length && <p className="fine">Amazon didn't send this product's photos, so upload a clear photo of it (JPG/PNG).</p>}
        </section>
      )}

      {concepts.length > 0 && (
        <ol className="is-concepts">
          {concepts.map((c, i) => <ConceptCard key={`${c.slot}-${i}`} c={c} kind={kind} canRender={refs.length > 0} onChange={(nc) => setConcepts((cs) => cs.map((x, k) => (k === i ? nc : x)))} onRender={() => render(c)} />)}
        </ol>
      )}

      {items.length > 0 && (
        <section className="is-made">
          <h3>Images for {product?.title.slice(0, 60) ?? sku}</h3>
          <div className="is-grid">{items.map((it) => <Made key={it.id} it={it} token={token} account={account} onUpdate={(n) => setItems((xs) => xs.map((x) => (x.id === n.id ? n : x)))} />)}</div>
          <p className="fine">Image files are kept by Higgsfield for at least 7 days. Download the ones you want to keep.</p>
        </section>
      )}
    </div>
  );
}

function ConceptCard({ c, kind, canRender, onChange, onRender }: { c: Concept; kind: CreativeKind; canRender: boolean; onChange: (c: Concept) => void; onRender: () => void }) {
  const [open, setOpen] = useState(false);
  const [started, setStarted] = useState(false);
  return (
    <li className="is-c">
      <div className="is-c-h"><span className="is-slot">{kind === "listing" ? `Image ${c.slot}` : c.slot}</span><b>{c.title}</b><small>{c.aspect}</small></div>
      <p>{c.why}</p>
      {open ? <textarea rows={5} value={c.prompt} onChange={(e) => onChange({ ...c, prompt: e.target.value })} /> : <button className="linkbtn" onClick={() => setOpen(true)}>See or edit the brief</button>}
      <button className="btn small" disabled={!canRender} onClick={() => { setStarted(true); onRender(); setTimeout(() => setStarted(false), 3000); }}>{started ? "Started ✓" : "Make this image"}</button>
    </li>
  );
}

function Made({ it, token, account, onUpdate }: { it: Creative; token: string; account: string; onUpdate: (c: Creative) => void }) {
  const [slot, setSlot] = useState(Number(it.concept.slot) || 2);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  async function use(url: string) {
    setBusy(true); setMsg("");
    const r = await fetch("/api/w/creative", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ t: token, account, op: "use", id: it.id, url, slot }) }).then((x) => x.json()).catch(() => ({ ok: false }));
    if (r.item) onUpdate(r.item);
    setMsg(r.ok ? `✓ Sent to Amazon as image ${slot}. It shows on the listing once Amazon processes it (usually within an hour).${r.warnings?.length ? ` Amazon noted: ${r.warnings[0]}` : ""}` : r.error ?? "Amazon didn't take it.");
    setBusy(false);
  }
  return (
    <div className={`is-m s-${it.status}`}>
      <small>{it.concept.title} · {new Date(it.at).toLocaleDateString()}</small>
      {it.status === "rendering" && <div className="is-wait">Higgsfield is making it… (about a minute)</div>}
      {it.status === "failed" && <p className="err">{it.error ?? "It didn't work. Try again or edit the brief."}</p>}
      {it.images.map((u) => (
        <div key={u} className="is-img">
          <img src={u} alt={it.concept.title} />
          <div className="is-act">
            <a className="btn ghost small" href={u} target="_blank" rel="noopener" download>Download</a>
            {it.kind === "listing" && it.status !== "used" && (
              <>
                <select value={slot} onChange={(e) => setSlot(Number(e.target.value))} aria-label="Image slot">{[2, 3, 4, 5, 6, 7, 8].map((n) => <option key={n} value={n}>Image {n}</option>)}</select>
                <button className="btn small" disabled={busy} onClick={() => use(u)}>{busy ? "Checking with Amazon…" : "Put on my listing"}</button>
              </>
            )}
            {it.status === "used" && it.usedUrl === u && <span className="ok">✓ On the listing as image {it.usedSlot}</span>}
          </div>
        </div>
      ))}
      {it.kind === "aplus" && it.status === "ready" && <p className="fine">Add it in Seller Central → Advertising → A+ Content Manager.</p>}
      {msg && <p className={msg.startsWith("✓") ? "ok" : "err"}>{msg}</p>}
    </div>
  );
}
