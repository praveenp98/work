"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { track } from "@/lib/track";
import { everyFromShare, shareText, type Slide, type Wrapped } from "@/lib/wrapped";
import { LeadCapture } from "../LeadCapture";
import { Rocco } from "../Rocco";

const MS = 5200;
const SITE = "https://rocco.works";
const T = "amazon-seller-wrapped";

/**
 * Seller Wrapped, app-style: opens full screen (edge to edge on phones), tap or swipe through, the deeper cuts
 * unlock with an email inside the story, and it ends on a share screen (the phone's own share sheet with the
 * story image). Back button, ✕, Esc or swipe down closes it; the page keeps the recap and a Play again button.
 */
export function WrappedStory({ w }: { w: Wrapped }) {
  const [open, setOpen] = useState(true);
  const [unlocked, setUnlocked] = useState(false);
  const free = w.slides.filter((s) => !s.locked), locked = w.slides.filter((s) => s.locked);
  const slides: Slide[] = [...free, ...(unlocked ? locked : locked.length ? [LOCK] : []), SHARE];
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const cur = slides[Math.min(i, slides.length - 1)];
  const still = cur.id === "lock" || cur.id === "share";
  const pushed = useRef(false);

  const next = useCallback(() => setI((x) => Math.min(x + 1, slides.length - 1)), [slides.length]);
  const prev = useCallback(() => setI((x) => Math.max(0, x - 1)), []);
  const close = useCallback(() => { setOpen(false); if (pushed.current) { pushed.current = false; history.back(); } }, []);
  const play = () => { setI(0); setOpen(true); track("tool_result", { tool: T, link: "replay" }); };

  // Auto-advance (not on the lock or share screens, not while held).
  useEffect(() => {
    if (!open || paused || still) return;
    const t = setTimeout(next, MS);
    return () => clearTimeout(t);
  }, [i, open, paused, still, next]);

  // Full screen: lock page scroll, Esc/arrows, and the phone's Back button closes it.
  useEffect(() => {
    if (!open) return;
    const html = document.documentElement, prevO = html.style.overflow;
    html.style.overflow = "hidden"; document.body.style.overflow = "hidden";
    if (!pushed.current) { history.pushState({ wrapped: 1 }, ""); pushed.current = true; }
    const onPop = () => { pushed.current = false; setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); if (e.key === "ArrowRight") next(); if (e.key === "ArrowLeft") prev(); };
    window.addEventListener("popstate", onPop); window.addEventListener("keydown", onKey);
    return () => { html.style.overflow = prevO; document.body.style.overflow = ""; window.removeEventListener("popstate", onPop); window.removeEventListener("keydown", onKey); };
  }, [open, close, next, prev]);

  // Swipe left/right to move, down to close; a plain tap is handled by the tap zones.
  const start = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);
  const down = (e: React.PointerEvent) => { start.current = { x: e.clientX, y: e.clientY }; swiped.current = false; setPaused(true); };
  const up = (e: React.PointerEvent) => {
    setPaused(false);
    const s = start.current; start.current = null;
    if (!s) return;
    const dx = e.clientX - s.x, dy = e.clientY - s.y;
    if (dy > 90 && Math.abs(dy) > Math.abs(dx)) { swiped.current = true; close(); }
    else if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) { swiped.current = true; if (dx < 0) next(); else prev(); }
  };
  const tap = (f: () => void) => () => { if (swiped.current) { swiped.current = false; return; } f(); };

  const unlock = useCallback(() => { setUnlocked((u) => { if (!u) { setI(free.length); track("tool_result", { tool: T, link: "unlocked" }); } return true; }); }, [free.length]);

  // Share: prefetch the story image so the phone's share sheet opens straight from the tap.
  const url = `${SITE}/free/${T}/w/${w.code}`;
  const text = shareText(w.share);
  const [img, setImg] = useState<Blob | null>(null);
  useEffect(() => { fetch(`/api/magnets/card?c=${encodeURIComponent(w.code)}&f=story`).then((r) => (r.ok ? r.blob() : null)).then(setImg).catch(() => {}); }, [w.code]);
  const save = (b: Blob, name: string) => { const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = name; a.click(); };
  const shareNative = async () => {
    track("link_click", { tool: T, link: "share_native" });
    const file = img ? new File([img], "my-amazon-seller-wrapped.png", { type: "image/png" }) : null;
    try {
      if (file && navigator.canShare?.({ files: [file] })) return await navigator.share({ files: [file], text: `${text} ${url}` });
      if (navigator.share) return await navigator.share({ text, url });
    } catch { return; /* closed the sheet */ }
    if (img) save(img, "my-amazon-seller-wrapped.png");
  };
  const download = async (f: "story" | "post") => {
    track("link_click", { tool: T, link: `download_${f}` });
    const b = f === "story" && img ? img : await fetch(`/api/magnets/card?c=${encodeURIComponent(w.code)}&f=${f}`).then((r) => (r.ok ? r.blob() : null)).catch(() => null);
    if (b) save(b, `amazon-seller-wrapped-${f}.png`);
  };
  const copy = () => { navigator.clipboard?.writeText(`${text} ${url}`); track("link_click", { tool: T, link: "share_copy" }); };
  const xHref = `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  const liHref = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;

  const player = (
    <div className="wr-full" role="dialog" aria-modal="true" aria-label="Your Amazon Seller Wrapped">
      <div className={`wr-card g-${cur.grad}`} onPointerDown={down} onPointerUp={up} onPointerCancel={() => { start.current = null; setPaused(false); }}>
        <div className="wr-bars" aria-hidden>{slides.map((s, k) => <span key={s.id}><i className={k < i ? "full" : k === i && !still ? "run" : k === i ? "full" : ""} style={k === i && !still ? { animationDuration: `${MS}ms`, animationPlayState: paused ? "paused" : "running" } : undefined} /></span>)}</div>
        <div className="wr-top"><b>Amazon Seller Wrapped</b><small>{w.periodLabel}</small><button className="wr-x" aria-label="Close" onPointerDown={(e) => e.stopPropagation()} onClick={close}>✕</button></div>
        {cur.id === "lock" ? <LockBody n={locked.length} titles={locked.map((s) => s.kicker)} onUnlock={unlock} onSkip={() => setI(slides.length - 1)} />
          : cur.id === "share" ? <ShareBody w={w} canNative={typeof navigator !== "undefined" && !!navigator.share} onNative={shareNative} onDownload={download} onCopy={copy} xHref={xHref} liHref={liHref} onReplay={() => setI(0)} onClose={close} />
          : <SlideBody key={cur.id + i} s={cur} />}
        {!still && <div className="wr-foot"><span>rocco.works</span><Rocco pose={cur.id === "persona" ? "party" : "hero"} size={58} /></div>}
        {!still && <><button className="wr-tap l" aria-label="Previous" onClick={tap(prev)} /><button className="wr-tap r" aria-label="Next" onClick={tap(next)} /></>}
      </div>
      <button className="wr-nav l" aria-label="Previous" onClick={prev} disabled={i === 0}>‹</button>
      <button className="wr-nav r" aria-label="Next" onClick={next} disabled={i === slides.length - 1}>›</button>
    </div>
  );

  return (
    <div className="wr">
      {open && typeof document !== "undefined" && createPortal(player, document.body)}
      <div className="wr-recap">
        <button className="btn wr-play" onClick={play}>▶ Play my Wrapped</button>
        <Recap w={w} />
        <p className="fine">The share link and images carry only these numbers, never your product names or searches.</p>
        <div className="mg-share">
          {typeof navigator !== "undefined" && !!navigator.share && <button className="btn small" onClick={shareNative}>Share…</button>}
          <a className="btn small" target="_blank" rel="noopener" onClick={() => track("link_click", { tool: T, link: "share_x" })} href={xHref}>Post on X</a>
          <a className="btn ghost small" target="_blank" rel="noopener" onClick={() => track("link_click", { tool: T, link: "share_linkedin" })} href={liHref}>LinkedIn</a>
          <button className="btn ghost small" onClick={() => download("story")}>Story image</button>
          <button className="btn ghost small" onClick={() => download("post")}>Post image</button>
          <button className="btn ghost small" onClick={copy}>Copy link</button>
        </div>
        {!unlocked && locked.length > 0 && <div className="wr-unlock"><LeadCapture leadMagnet={T} title={`Unlock the other ${locked.length} slides`} cta="Unlock my full Wrapped" askMarketplace={false}><Unlocked onUnlock={() => { unlock(); setOpen(true); }} /></LeadCapture></div>}
      </div>
    </div>
  );
}

const LOCK: Slide = { id: "lock", kicker: "", big: "", line: "", grad: "night" };
const SHARE: Slide = { id: "share", kicker: "", big: "", line: "", grad: "night" };

function Unlocked({ onUnlock }: { onUnlock: () => void }) {
  useEffect(() => { onUnlock(); }, [onUnlock]);
  return <p>Unlocked ✓</p>;
}

function Recap({ w, inside }: { w: Wrapped; inside?: boolean }) {
  return (
    <div className={`wr-mini${inside ? " in" : " g-night"}`}>
      <small>AMAZON SELLER WRAPPED · {w.periodLabel.toUpperCase()}</small>
      <h4>{w.persona.emoji} {w.persona.name}</h4>
      <p>{w.persona.line}</p>
      <dl>
        <div><dt>Units sold</dt><dd>{w.share.units.toLocaleString("en-US")}</dd></div>
        <div><dt>Pace</dt><dd>{everyFromShare(w.share)}</dd></div>
        <div><dt>From the top product</dt><dd>{w.share.topShare}%</dd></div>
        <div><dt>Conversion</dt><dd>{w.share.conv}%</dd></div>
        {w.share.sales !== undefined && <div><dt>Sales</dt><dd>${w.share.sales.toLocaleString("en-US")}</dd></div>}
        {w.share.waste !== undefined && <div><dt>Ad spend wasted</dt><dd>{w.share.waste}%</dd></div>}
      </dl>
    </div>
  );
}

function LockBody({ n, titles, onUnlock, onSkip }: { n: number; titles: string[]; onUnlock: () => void; onSkip: () => void }) {
  return (
    <div className="wr-body wr-lock" onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()}>
      <span className="wr-k">There&apos;s more</span>
      <div className="wr-big s">{n} deeper cuts</div>
      <ul>{titles.map((t) => <li key={t}>🔒 {t.replace(/^Rocco's resolution for you.*$/, "Your resolution")}</li>)}</ul>
      <LeadCapture leadMagnet={T} title="Unlock them free" cta="Unlock my full Wrapped" askMarketplace={false}><Unlocked onUnlock={onUnlock} /></LeadCapture>
      <button className="linkbtn wr-skip" onClick={onSkip}>Skip, show my card →</button>
    </div>
  );
}

function ShareBody(p: { w: Wrapped; canNative: boolean; onNative: () => void; onDownload: (f: "story" | "post") => void; onCopy: () => void; xHref: string; liHref: string; onReplay: () => void; onClose: () => void }) {
  return (
    <div className="wr-body wr-share" onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()}>
      <span className="wr-k">That&apos;s a wrap</span>
      <Recap w={p.w} inside />
      <div className="wr-actions">
        {p.canNative ? <button className="btn wr-main" onClick={p.onNative}>Share my Wrapped</button> : <button className="btn wr-main" onClick={() => p.onDownload("story")}>Save story image</button>}
        <div className="wr-row">
          <a className="btn ghost small" href={p.xHref} target="_blank" rel="noopener">Post on X</a>
          <a className="btn ghost small" href={p.liHref} target="_blank" rel="noopener">LinkedIn</a>
          <button className="btn ghost small" onClick={p.onCopy}>Copy link</button>
        </div>
        <div className="wr-row"><button className="linkbtn" onClick={p.onReplay}>↺ Replay</button><button className="linkbtn" onClick={p.onClose}>Close</button></div>
      </div>
      <p className="wr-fine">Only these numbers are shared. Product names and searches stay on your device.</p>
    </div>
  );
}

function SlideBody({ s }: { s: Slide }) {
  const len = s.big.length;
  return (
    <div className="wr-body">
      <span className="wr-k">{s.kicker}</span>
      <div className={`wr-big${len > 22 ? " xs" : len > 12 ? " s" : ""}`}>{s.num !== undefined ? <Count s={s} /> : s.big}</div>
      <p className="wr-line">{s.line}</p>
      {s.sub && <p className="wr-sub">{s.sub}</p>}
    </div>
  );
}

function Count({ s }: { s: Slide }) {
  const [v, setV] = useState(0);
  const [end, setEnd] = useState(false);
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) { setEnd(true); return; }
    const t0 = performance.now(); let raf = 0;
    const tick = (t: number) => { const k = Math.min(1, (t - t0) / 1400); setV(s.num! * (1 - Math.pow(1 - k, 3))); if (k < 1) raf = requestAnimationFrame(tick); else setEnd(true); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [s.num]);
  return <>{end ? s.big : `${s.prefix ?? ""}${Math.round(v).toLocaleString("en-US")}${s.suffix ?? ""}`}</>;
}
