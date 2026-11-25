"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { track } from "@/lib/track";
import { everyFromShare, shareText, type Slide, type Wrapped } from "@/lib/wrapped";
import { LeadCapture } from "../LeadCapture";
import { Rocco } from "../Rocco";

const MS = 5200;
const SITE = "https://rocco.works";

/** Seller Wrapped as a story: tap through, numbers count up, the deeper cuts unlock with an email, then share. */
export function WrappedStory({ w }: { w: Wrapped }) {
  const [unlocked, setUnlocked] = useState(false);
  const free = w.slides.filter((s) => !s.locked), locked = w.slides.filter((s) => s.locked);
  const slides = unlocked ? w.slides : [...free, ...(locked.length ? [LOCK] : [])];
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [done, setDone] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const cur = slides[Math.min(i, slides.length - 1)];
  const isLock = cur.id === "lock";

  const next = useCallback(() => setI((x) => { if (x + 1 >= slides.length) { setDone(true); return x; } return x + 1; }), [slides.length]);
  const prev = useCallback(() => setI((x) => Math.max(0, x - 1)), []);
  useEffect(() => {
    if (paused || done || isLock) return;
    const t = setTimeout(next, MS);
    return () => clearTimeout(t);
  }, [i, paused, done, isLock, next]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (!box.current?.matches(":hover, :focus-within")) return; if (e.key === "ArrowRight") next(); if (e.key === "ArrowLeft") prev(); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [next, prev]);
  useEffect(() => { box.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }, []);

  const unlock = () => { if (unlocked) return; setUnlocked(true); setDone(false); setI(free.length); track("tool_result", { tool: "amazon-seller-wrapped", link: "unlocked" }); };
  const url = `${SITE}/free/amazon-seller-wrapped/w/${w.code}`;
  const text = shareText(w.share);
  const download = async (f: "story" | "post") => {
    track("link_click", { tool: "amazon-seller-wrapped", link: `download_${f}` });
    const r = await fetch(`/api/magnets/card?c=${encodeURIComponent(w.code)}&f=${f}`);
    if (!r.ok) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(await r.blob());
    a.download = `amazon-seller-wrapped-${f}.png`;
    a.click();
  };

  return (
    <div className="wr">
      <div className="wr-stage">
        <div ref={box} tabIndex={0} className={`wr-card g-${cur.grad}`} aria-roledescription="story" aria-label={`Slide ${i + 1} of ${slides.length}`}
          onPointerDown={() => setPaused(true)} onPointerUp={() => setPaused(false)} onPointerLeave={() => setPaused(false)}>
          <div className="wr-bars" aria-hidden>{slides.map((s, k) => <span key={s.id}><i className={k < i || (done && k === i) ? "full" : k === i && !isLock ? "run" : ""} style={k === i ? { animationDuration: `${MS}ms`, animationPlayState: paused ? "paused" : "running" } : undefined} /></span>)}</div>
          <div className="wr-top"><b>Amazon Seller Wrapped</b><small>{w.periodLabel}</small></div>
          {isLock ? <LockBody n={locked.length} titles={locked.map((s) => s.kicker)} onUnlock={unlock} /> : <SlideBody key={cur.id + i} s={cur} />}
          <div className="wr-foot"><span>rocco.works</span><Rocco pose={cur.id === "persona" ? "party" : "hero"} size={54} /></div>
          {!isLock && <><button className="wr-tap l" aria-label="Previous" onClick={prev} /><button className="wr-tap r" aria-label="Next" onClick={next} /></>}
        </div>
        <p className="fine wr-hint">Tap the sides or use ← → · hold to pause</p>
      </div>

      {!unlocked && locked.length > 0 && (
        <div className="wr-unlock" id="wr-unlock">
          <LeadCapture leadMagnet="amazon-seller-wrapped" title={`Unlock the other ${locked.length} slides`} cta="Unlock my full Wrapped"><Unlocked onUnlock={unlock} /></LeadCapture>
        </div>
      )}

      <div className="wr-recap">
        <h3>Your recap card</h3>
        <div className={`wr-mini g-night`}>
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
        <p className="fine">The share link and images carry only these numbers, never your product names or searches.</p>
        <div className="mg-share">
          <a className="btn small" target="_blank" rel="noopener" onClick={() => track("link_click", { tool: "amazon-seller-wrapped", link: "share_x" })} href={`https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`}>Post on X</a>
          <a className="btn ghost small" target="_blank" rel="noopener" onClick={() => track("link_click", { tool: "amazon-seller-wrapped", link: "share_linkedin" })} href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}>Share on LinkedIn</a>
          <button className="btn ghost small" onClick={() => download("story")}>Download story image</button>
          <button className="btn ghost small" onClick={() => download("post")}>Download post image</button>
          <button className="btn ghost small" onClick={() => { navigator.clipboard?.writeText(`${text} ${url}`); track("link_click", { tool: "amazon-seller-wrapped", link: "share_copy" }); }}>Copy link</button>
          <button className="linkbtn" onClick={() => { setI(0); setDone(false); }}>↺ Replay</button>
        </div>
      </div>
    </div>
  );
}

const LOCK: Slide = { id: "lock", kicker: "", big: "", line: "", grad: "night" };

function Unlocked({ onUnlock }: { onUnlock: () => void }) {
  useEffect(() => { onUnlock(); }, [onUnlock]);
  return <p>Unlocked. The story is playing the rest now ↑</p>;
}

function LockBody({ n, titles, onUnlock }: { n: number; titles: string[]; onUnlock: () => void }) {
  void onUnlock;
  return (
    <div className="wr-body wr-lock">
      <span className="wr-k">There&apos;s more</span>
      <div className="wr-big s">{n} deeper cuts</div>
      <ul>{titles.map((t) => <li key={t}>🔒 {t}</li>)}</ul>
      <a className="btn small" href="#wr-unlock" onClick={(e) => { e.preventDefault(); document.getElementById("wr-unlock")?.scrollIntoView({ behavior: "smooth", block: "center" }); (document.querySelector("#wr-unlock input[type=email]") as HTMLInputElement | null)?.focus({ preventScroll: true }); }}>Unlock with your email ↓</a>
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
