import type { Metadata } from "next";
import Link from "next/link";
import { ChangeLogRow, MorningListCard, RoccoBubble, SampleChip, YesBubble } from "@/marketing/brand/components";
import { COLORS, contrast, FONTS, FORMATS, RADII, TEXT_PAIRS, TYPE, type FormatId } from "@/marketing/brand/tokens";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Brand", description: "Rocco's logo files, colours, fonts and rules.", robots: { index: false, follow: false }, alternates: { canonical: "/brand" } };

/**
 * The brand sheet: an add-on to the press kit (/press links here). Not indexed. Everything on it is read from
 * marketing/brand/tokens.ts and the files in public/brand/logos (built by marketing/brand/build-logos.mjs).
 */
const L = "/brand/logos";
const LOGOS: { title: string; note: string; files: [string, string, string][] }[] = [
  { title: "Lockup", note: "Banners, headers, anywhere with room.", files: [["rocco-lockup-light.svg", COLORS.bg, "Light"], ["rocco-lockup-dark.svg", COLORS.night, "Dark"], ["rocco-lockup-mono.svg", COLORS.white, "One colour"]] },
  { title: "Mark", note: "The raccoon alone, when the name is already next to it.", files: [["rocco-mark-light.svg", COLORS.bg, "Light"], ["rocco-mark-dark.svg", COLORS.night, "Dark"], ["rocco-mark-mono.svg", COLORS.white, "One colour"]] },
  { title: "Wordmark", note: "Type only.", files: [["rocco-wordmark-light.svg", COLORS.bg, "Light"], ["rocco-wordmark-dark.svg", COLORS.night, "Dark"], ["rocco-wordmark-mono.svg", COLORS.white, "One colour"]] },
  { title: "Wordmark with domain", note: "End cards and print, where the address matters.", files: [["rocco-works-light.svg", COLORS.bg, "Light"], ["rocco-works-dark.svg", COLORS.night, "Dark"], ["rocco-works-mono.svg", COLORS.white, "One colour"]] },
];
const SWATCHES: [keyof typeof COLORS, string][] = [
  ["bg", "Page background"], ["white", "Cards"], ["ink", "Text"], ["muted", "Secondary text"], ["line", "Borders"],
  ["accent", "Primary: buttons, links, the YES reply"], ["accentDeep", "Small blue text, button hover"], ["green", "Approve, worked, money (fills and large text)"],
  ["greenDeep", "\"Worked\" as small text"], ["amber", "Countdown, the dot on the sample chip"], ["amberDeep", "Reverted"], ["night", "Dark backgrounds"],
];
const DO: [string, string][] = [
  ["Use the files as they are.", "Don't redraw, stretch, tilt or recolour the raccoon."],
  ["Give the logo room: at least the height of the \"o\" on every side.", "Don't put it on a busy photo without the dark or white version."],
  ["Write the name \"Rocco\" in text. The lowercase wordmark is a logo, not a spelling.", "Don't write \"Rocco AI\" or join the name to an Amazon trademark."],
  ["Label Bamboo & Co numbers \"Sample account\", every time.", "Don't show the sample numbers as a customer's result."],
  ["Say \"Not affiliated with Amazon\" where Amazon's name is prominent.", "Don't place the logo beside Amazon's as if it were a partnership."],
];
const sec: React.CSSProperties = { display: "grid", gap: 14 };
const h2: React.CSSProperties = { margin: 0, fontSize: 30 };
const card: React.CSSProperties = { background: "#fff", border: "1px solid var(--line)", borderRadius: RADII.lg, padding: 18 };
const fmt = (f: FormatId) => `${FORMATS[f].width}×${FORMATS[f].height}`;

export default function Page() {
  return (
    <section style={{ maxWidth: 1040, margin: "0 auto", padding: "16px 0 60px", display: "grid", gap: 48 }}>
      <header>
        <span className="h5-kicker">Brand</span>
        <h1 style={{ margin: "0 0 10px", fontSize: "clamp(38px, 5vw, 58px)" }}>How Rocco looks.</h1>
        <p className="muted" style={{ fontSize: 19, margin: "0 0 18px", maxWidth: 640 }}>Logo files, colours, fonts and the few rules that keep it recognisable. For press copy and screenshots, see the <Link href="/press">press kit</Link>.</p>
        <a className="btn" href="/brand/rocco-brand-kit.zip" download>Download the brand kit (zip) ↓</a>
      </header>

      <div style={sec}>
        <h2 style={h2}>Logo</h2>
        {LOGOS.map((g) => (
          <div key={g.title} style={{ display: "grid", gap: 8 }}>
            <p style={{ margin: 0 }}><b>{g.title}.</b> <span className="muted">{g.note}</span></p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
              {g.files.map(([f, bg, label]) => (
                <a key={f} href={`${L}/${f}`} download style={{ background: bg, border: "1px solid var(--line)", borderRadius: RADII.md, height: 132, display: "grid", placeItems: "center", position: "relative", textDecoration: "none" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`${L}/${f}`} alt={`${g.title}, ${label}`} style={{ maxHeight: 62, maxWidth: "78%" }} />
                  <span style={{ position: "absolute", left: 12, bottom: 8, fontSize: 11.5, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: bg === COLORS.night ? "#aab2c0" : "var(--muted)" }}>{label} · SVG</span>
                </a>
              ))}
            </div>
          </div>
        ))}
        <div style={{ ...card, display: "flex", gap: 22, alignItems: "center", flexWrap: "wrap" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${L}/rocco-avatar-green-400.png`} alt="Rocco avatar" width={96} height={96} style={{ borderRadius: "50%" }} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${L}/rocco-avatar-green-48.png`} alt="" width={48} height={48} style={{ borderRadius: "50%" }} />
          <p style={{ margin: 0, flex: "1 1 280px" }}><b>Avatar.</b> The raccoon face on green. It reads at 48 pixels, which the wordmark does not. <a href={`${L}/rocco-avatar-green-400.png`} download>PNG</a> · <a href={`${L}/rocco-avatar-green.svg`} download>SVG</a></p>
        </div>
      </div>

      <div style={sec}>
        <h2 style={h2}>Colour</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 12 }}>
          {SWATCHES.map(([k, use]) => (
            <div key={k} style={{ ...card, padding: 0, overflow: "hidden" }}>
              <div style={{ height: 64, background: COLORS[k], borderBottom: "1px solid var(--line)" }} />
              <div style={{ padding: "10px 14px", display: "grid", gap: 2 }}><b style={{ fontSize: 14.5 }}>{k} <code style={{ fontWeight: 400, color: "var(--muted)" }}>{COLORS[k]}</code></b><span className="fine">{use}</span></div>
            </div>
          ))}
        </div>
        <div style={{ ...card, overflowX: "auto" }}>
          <p style={{ margin: "0 0 10px" }}><b>Contrast (WCAG AA).</b> <span className="muted">Normal text needs 4.5 to 1. Large text (24px and up, or 19px bold) needs 3 to 1.</span></p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: 8 }}>
            {TEXT_PAIRS.map((p) => { const r = contrast(p.text, p.on); const ok = r >= (p.size === "large" ? 3 : 4.5); return (
              <div key={p.name} style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 12, background: p.on, color: p.text, border: "1px solid var(--line)", fontSize: p.size === "large" ? 19 : 14, fontWeight: p.size === "large" ? 700 : 500 }}>
                <span>{p.name}</span><span style={{ fontVariantNumeric: "tabular-nums" }}>{r.toFixed(1)} {ok ? "✓" : "✗"}</span>
              </div>
            ); })}
          </div>
        </div>
      </div>

      <div style={sec}>
        <h2 style={h2}>Type</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 12 }}>
          <div style={card}><p className="fine" style={{ margin: 0 }}>Headlines · {FONTS.display.family} {FONTS.display.weight}</p><p style={{ margin: "6px 0 0", fontFamily: "var(--display)", fontWeight: 500, fontSize: 44, letterSpacing: "-0.035em", lineHeight: 1.04 }}>You approve. Rocco does the rest.</p></div>
          <div style={card}><p className="fine" style={{ margin: 0 }}>Text · {FONTS.body.family} 400 and 600</p><p style={{ margin: "6px 0 0", fontSize: 18 }}>Every morning I find what to fix. You tap approve. I make the change in Amazon, then check it worked.</p><p className="kicker" style={{ margin: "12px 0 0" }}>Kickers look like this</p></div>
        </div>
        <div style={{ ...card, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14.5 }}>
            <thead><tr>{["Format", "Canvas", "Headline", "Title", "Body", "Caption", "Most words on screen"].map((t) => <th key={t} style={{ textAlign: "left", padding: "6px 10px", fontSize: 12, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--muted)" }}>{t}</th>)}</tr></thead>
            <tbody>{(Object.keys(TYPE) as FormatId[]).map((f) => <tr key={f}>{[f === "slide" ? "Slide / post image" : f.replace("x", ":"), fmt(f), `${TYPE[f].headline}px`, `${TYPE[f].title}px`, `${TYPE[f].body}px`, `${TYPE[f].caption}px`, `${TYPE[f].maxWords.frame} (headline ${TYPE[f].maxWords.headline})`].map((v, i) => <td key={i} style={{ padding: "8px 10px", borderTop: "1px solid var(--line)" }}>{v}</td>)}</tr>)}</tbody>
          </table>
        </div>
      </div>

      <div style={sec}>
        <h2 style={h2}>Signature elements</h2>
        <p className="muted" style={{ margin: 0, maxWidth: 680 }}>Four things show up in every asset, so it reads as Rocco before anyone sees a logo. The numbers in them belong to a sample account and always carry the chip.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 420px), 1fr))", gap: 22, alignItems: "start" }}>
          <div style={{ display: "grid", gap: 10 }}><b>1. The morning list</b><SampleChip size={12} style={{ justifySelf: "start" }} /><MorningListCard states={["done", "open", "open"]} /></div>
          <div style={{ display: "grid", gap: 26 }}>
            <div style={{ display: "grid", gap: 10 }}><b>2. The YES reply</b><SampleChip size={12} style={{ justifySelf: "start" }} />
              <div style={{ ...card, display: "grid", gap: 10 }}><RoccoBubble size={15}>☀️ Bamboo &amp; Co: 4 jobs waiting, worth ~$1,240/mo.</RoccoBubble><YesBubble text="YES N1 G2" size={15} style={{ justifySelf: "end" }} /><RoccoBubble size={15}>Done in Amazon ✅ N1, G2. I&apos;ll check the results in a week.</RoccoBubble></div>
            </div>
            <div style={{ display: "grid", gap: 10 }}><b>3. The change log row</b><SampleChip size={12} style={{ justifySelf: "start" }} /><ChangeLogRow /></div>
            <div style={{ display: "grid", gap: 10, justifyItems: "start" }}><b>4. The sample-account chip</b><SampleChip size={18} /></div>
          </div>
        </div>
      </div>

      <div style={sec}>
        <h2 style={h2}>Do and don&apos;t</h2>
        <div style={{ display: "grid", gap: 8 }}>
          {DO.map(([yes, no]) => (
            <div key={yes} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 8 }}>
              <p style={{ ...card, margin: 0, padding: "12px 16px", borderColor: "color-mix(in srgb, #1f9d63 35%, var(--line))" }}><b style={{ color: COLORS.greenDeep }}>Do</b> · {yes}</p>
              <p style={{ ...card, margin: 0, padding: "12px 16px" }}><b style={{ color: COLORS.danger }}>Don&apos;t</b> · {no}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="fine" style={{ margin: 0 }}>{SITE.disclaimer} Questions: <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>.</p>
    </section>
  );
}
