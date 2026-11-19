"use client";
import { useEffect, useRef, useState } from "react";
import { RoccoHead } from "@/components/Rocco";
import { startText } from "@/lib/client/startText";
import { HireButton } from "@/components/home/HireButton";
import { BRAND_ICONS, type BrandIcon } from "@/lib/brand-icons";

/**
 * Boardy-style hero stage. On load: a row of grey app icons slides into the middle, the card grows out of it,
 * then the apps settle on a dotted circle around the card. Every ~4.5s the circle turns to the next app and the
 * card shows Rocco doing one piece of the Amazon job there (ads, Seller Central, stock, listings, reports, team).
 */
type Scene = { app: BrandIcon | "claudecode"; head: string; sub: string; glow: string; pill: string; href: string; lines: { me?: boolean; text: string }[] };

const SCENES: Scene[] = [
  { app: "imessage", head: "Rocco", sub: "online · Amazon connected", glow: "#2f7cf6", pill: "Text me on iMessage", href: "#text",
    lines: [{ me: true, text: "how'd we do yesterday?" }, { text: "$4,120 sales, ACoS 24%. 2 search terms burned $63 with no sales. Reply YES N1 N2 to cut them." }] },
  { app: "claude", head: "Claude", sub: "Rocco + Amazon's connectors", glow: "#d97757", pill: "Use me in Claude", href: "/setup",
    lines: [{ me: true, text: "Rocco, morning check" }, { text: "Checked Ads and Seller Central. 7 fixes worth ~$1,240/mo. Nothing changes until you approve." }] },
  { app: "imessage", head: "Rocco", sub: "online · Amazon connected", glow: "#2f7cf6", pill: "Text me on iMessage", href: "#text",
    lines: [{ text: "🚨 Bamboo Board S is suppressed (main image background). Kitchen Set Blue runs out in 9 days: send 340 units." }, { me: true, text: "on it, thanks" }] },
  { app: "slack", head: "#amazon-team", sub: "Rocco + Amazon's connectors", glow: "#611f69", pill: "Add me to Slack", href: "/setup",
    lines: [{ text: "☀️ Spend $1,570 · sales $5,307 · ACoS 30%. 3 fixes ready (~$206/mo). Reply @Rocco yes N1 B1 B7." }, { me: true, text: "@Rocco yes N1 B1" }] },
  { app: "claudecode", head: "Claude Code", sub: "Rocco + Amazon's connectors", glow: "#1c2433", pill: "Use me in Claude Code", href: "/setup",
    lines: [{ me: true, text: "/morning-check all brands" }, { text: "5 brands checked. 1 Buy Box drop, 2 listings down, 11 fixes ready. Client report saved." }] },
  { app: "calendar", head: "Calendar", sub: "Rocco checks every change", glow: "#4285f4", pill: "Follow-ups in your calendar", href: "#text",
    lines: [{ text: "📅 Mon 9:00 · Did B3 work?" }, { text: "Yes ✅ Lower bid on “bamboo board” saved $86/mo, sales held." }] },
];

const APPS: (BrandIcon | "claudecode")[] = ["imessage", "claude", "slack", "claudecode", "calendar"];
const ASKS = ["my wasted ad spend", "restock before Q4", "a suppressed listing", "why ACoS jumped", "all 5 of my brands", "my weekly client report"];

export function AppIcon({ app, size = 26 }: { app: BrandIcon | "claudecode"; size?: number }) {
  if (app === "claudecode") {
    return <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden><rect width="24" height="24" rx="6" fill="#1c2433" /><path d="M6.5 8.5 10 12l-3.5 3.5M12 16h5.5" fill="none" stroke="#f0eee9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  }
  const b = BRAND_ICONS[app];
  return <svg viewBox="0 0 24 24" width={size} height={size} aria-label={b.title} role="img"><path d={b.path} fill={b.hex} /></svg>;
}

const appName = (a: BrandIcon | "claudecode") => (a === "claudecode" ? "Claude Code" : BRAND_ICONS[a].title);

export function RoccoStage({ price = "$99", next, google }: { price?: string; next?: string; google?: boolean }) {
  const [phase, setPhase] = useState(0); // 0 row, 1 gather, 2 card, 3 live
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [typed, setTyped] = useState("");
  const [own, setOwn] = useState(false);
  const [busy, setBusy] = useState(false);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    if (reduced.current) { setPhase(3); return; }
    const t = [setTimeout(() => setPhase(1), 900), setTimeout(() => setPhase(2), 1500), setTimeout(() => setPhase(3), 2200)];
    return () => t.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (paused || phase < 3) return;
    const t = setInterval(() => setI((x) => (x + 1) % SCENES.length), 4500);
    return () => clearInterval(t);
  }, [paused, phase]);

  useEffect(() => {
    if (own) return;
    let k = 0, pos = 0, dir = 1;
    const t = setInterval(() => {
      const w = ASKS[k];
      pos += dir;
      if (pos > w.length + 14) dir = -1;
      if (pos <= 0) { dir = 1; k = (k + 1) % ASKS.length; }
      setTyped(w.slice(0, Math.max(0, Math.min(pos, w.length))));
    }, 75);
    return () => clearInterval(t);
  }, [own]);

  const s = SCENES[i];
  const active = APPS.indexOf(s.app);
  const href = (sc: Scene) => (sc.href === "#text" ? "/text" : sc.href);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const ok = await startText({ q: own ? typed : ASKS[0] });
    setBusy(false);
    if (!ok) window.location.href = "/text?closed=1";
  }

  return (
    <div className={`bstage p${phase}`} style={{ ["--glow" as string]: s.glow }}>
      <div className="bstage-area">
        <div className="bstage-glow" aria-hidden />
        <div className="bstage-ring" aria-hidden />
        {/* Opening: grey row of apps that gathers into the middle */}
        <div className="bstage-row" aria-hidden>{[...APPS, ...APPS.slice(0, 2)].map((a, k) => <span key={k} style={{ ["--k" as string]: k - 3.5 }}><AppIcon app={a} size={14} /></span>)}</div>
        <div className="bstage-card" key={phase >= 3 ? i : "intro"} aria-live="polite">
          <div className="bstage-head">
            <span className="bstage-av">{s.app === "imessage" ? <svg width="26" height="22" viewBox="15 5 170 140" aria-hidden><RoccoHead mood="smirk" id={`bs${i}`} /></svg> : <AppIcon app={s.app} size={20} />}</span>
            <div><b>{s.head}</b><small className={s.sub === "online" ? "on" : ""}>{s.sub}</small></div>
            <span className="bstage-badge"><AppIcon app={s.app} size={18} /></span>
          </div>
          <div className="bstage-body">
            {phase >= 3 && s.lines.map((l, k) => <div key={k} className={`bl${l.me ? " me" : ""}`} style={{ animationDelay: `${0.35 + k * 0.9}s` }}><span>{l.text}</span></div>)}
          </div>
        </div>
        {APPS.map((a, k) => {
          const off = ((k - active + APPS.length + 2) % APPS.length) - 2; // -2..2, 0 = bottom center
          const ang = (90 + off * 45) * (Math.PI / 180);
          return (
            <button key={a} type="button" className={`bstage-app${off === 0 ? " on" : ""}${Math.abs(off) > 2 ? " hide" : ""}`} aria-label={appName(a)}
              style={{ ["--x" as string]: `${Math.cos(ang) * 1}`, ["--y" as string]: `${Math.sin(ang) * 1}` }}
              onClick={() => { const n = SCENES.findIndex((sc) => sc.app === a); if (n >= 0) { setI(n); setPaused(true); } }}>
              <AppIcon app={a} size={off === 0 ? 28 : 22} />
            </button>
          );
        })}
      </div>

      <div className="bstage-pillrow">
        <a className="bstage-pill" href={href(s)} rel={s.href === "#text" ? "nofollow" : undefined} onClick={async (ev) => { if (s.href !== "#text") return; ev.preventDefault(); if (!(await startText())) window.location.href = "/text?closed=1"; }}><span><AppIcon app={s.app} size={16} /></span>{s.pill}</a>
      </div>

      <div className="hero-cta">
        <HireButton price={price} next={next} google={google} label="Hire Rocco" className="btn hire-cta" />
        <span className="fine">{price}/year for your whole team · +$10 with every hire</span>
      </div>
    </div>
  );
}
