/**
 * Rocco's look, in one file. Nothing here is new: every value is lifted from rocco.works (app/globals.css,
 * app/connect.css, components/Rocco.tsx). Videos (marketing/video), share images (lib/og.tsx), the /brand page,
 * image templates and carousels all import this, so there is one copy outside the site's own stylesheet.
 * lib/brand-tokens.test.ts fails if the site's CSS variables and this file ever disagree.
 *
 * Keep it to erasable TypeScript (no enums, no path aliases) so plain Node scripts can load it.
 */

// ── Colours ────────────────────────────────────────────────────────────────────────────────────────────────
export const COLORS = {
  /** Page background. --bg */
  bg: "#f4f2ee",
  /** Alternating section background (.hband.soft). */
  bgSoft: "#f8f6f2",
  /** Chat bubbles from Rocco, quiet fills. --bg2 */
  bg2: "#ece9e3",
  /** Cards on the page background. --card */
  card: "#fcfbf9",
  white: "#ffffff",
  /** Text. --ink */
  ink: "#1c2433",
  /** Secondary text. --muted */
  muted: "#5d6676",
  /** Borders. --line */
  line: "#e2ddd5",
  /** Primary: buttons, links, kickers, the YES reply. --accent */
  accent: "#1f6feb",
  accentDeep: "#1559c7",
  /** Approve, worked, money. Also the raccoon's hoodie family. */
  green: "#1f9d63",
  /** Green for small text ("worked", "13× what I cost"). */
  greenDeep: "#1f7a4f",
  /** Green wash behind "done" rows and the ROI strip (7% green on white). */
  greenTint: "#eff8f4",
  /** Blue wash behind notes like "Before Rocco" (7% accent on white). */
  accentTint: "#eff5fe",
  /** Countdown and the dot on the sample-account chip. */
  amber: "#e8a33d",
  /** Reverted / undone, as text. */
  amberDeep: "#9a5b00",
  /** Errors. */
  danger: "#b4432f",
  /** Phone frame, dark surfaces, dark logo backgrounds. */
  night: "#15181d",
} as const;

/** The raccoon's own colours (components/Rocco.tsx). Recolour only for the one-colour logo. */
export const MASCOT = { fur: "#9aa4b4", furDark: "#6e7889", furLight: "#eef1f5", mask: "#1d2330", ink: "#141821", pink: "#f3b9b5", hoodie: "#2f9e6b", hoodieDark: "#22784f", hoodieLight: "#45b982", gold: "#f6c445" } as const;

/** What each colour is for. Assets pick from here, not from COLORS directly. */
export const ROLES = {
  primary: { fill: COLORS.accent, text: COLORS.white },
  background: COLORS.bg,
  surface: COLORS.white,
  text: COLORS.ink,
  textMuted: COLORS.muted,
  /** Approve done, "worked", money found. Green check. */
  worked: { fill: COLORS.green, text: COLORS.greenDeep, tint: COLORS.greenTint },
  /** Undone by the seller. */
  reverted: { text: COLORS.amberDeep },
  /** Still being checked. */
  checking: { text: COLORS.muted },
  /** The seller's reply bubble: "YES". The site's bubble is the primary blue. */
  yesBubble: { fill: COLORS.accent, text: COLORS.white },
  /** Rocco's own bubbles. */
  roccoBubble: { fill: COLORS.bg2, text: COLORS.ink },
  /** "Sample account" chip: must stay readable on any background. */
  sampleChip: { fill: COLORS.white, text: COLORS.ink, border: COLORS.ink, dot: COLORS.amber },
} as const;

/**
 * Every text-on-background pair assets may use, for the contrast check (marketing/scripts/contrast.mjs).
 * size "large" = 24px and up (or 19px bold): WCAG AA needs 3:1. Everything else needs 4.5:1.
 */
export const TEXT_PAIRS: { name: string; text: string; on: string; size: "normal" | "large" }[] = [
  { name: "ink on page", text: COLORS.ink, on: COLORS.bg, size: "normal" },
  { name: "ink on card", text: COLORS.ink, on: COLORS.white, size: "normal" },
  { name: "muted on page", text: COLORS.muted, on: COLORS.bg, size: "normal" },
  { name: "muted on card", text: COLORS.muted, on: COLORS.white, size: "normal" },
  // Blue on the page background is 4.14:1: fine for large text (kickers in video, 19px bold and up), not for small.
  { name: "kicker blue on page (large only)", text: COLORS.accent, on: COLORS.bg, size: "large" },
  { name: "small blue text on page: use deep blue", text: COLORS.accentDeep, on: COLORS.bg, size: "normal" },
  { name: "link blue on card", text: COLORS.accent, on: COLORS.white, size: "normal" },
  { name: "button: white on blue", text: COLORS.white, on: COLORS.accent, size: "normal" },
  { name: "YES bubble: white on blue", text: COLORS.white, on: COLORS.accent, size: "normal" },
  { name: "worked: deep green on white", text: COLORS.greenDeep, on: COLORS.white, size: "normal" },
  { name: "worked: deep green on green wash", text: COLORS.greenDeep, on: COLORS.greenTint, size: "normal" },
  { name: "money: green on white (large only)", text: COLORS.green, on: COLORS.white, size: "large" },
  { name: "pill: white on green (large only)", text: COLORS.white, on: COLORS.green, size: "large" },
  { name: "reverted: deep amber on white", text: COLORS.amberDeep, on: COLORS.white, size: "normal" },
  { name: "sample chip: ink on white", text: COLORS.ink, on: COLORS.white, size: "normal" },
  { name: "Rocco bubble: ink on bg2", text: COLORS.ink, on: COLORS.bg2, size: "normal" },
  { name: "note: ink on blue wash", text: COLORS.ink, on: COLORS.accentTint, size: "normal" },
  { name: "dark: white on night", text: COLORS.white, on: COLORS.night, size: "normal" },
  { name: "error on white", text: COLORS.danger, on: COLORS.white, size: "normal" },
];

/** WCAG contrast ratio between two hex colours (1 to 21). AA: 4.5 for normal text, 3 for large. */
export function contrast(a: string, b: string): number {
  const lin = (c: number) => { const v = c / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  const lum = (hex: string) => { const n = parseInt(hex.slice(1), 16); return 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255); };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// ── Type ───────────────────────────────────────────────────────────────────────────────────────────────────
export const FONTS = {
  /** Headlines, the wordmark, big numbers. Raleway 500 (the site loads 400, 500, 600). */
  display: { family: "Raleway", weight: 500, letterSpacing: "-0.035em", lineHeight: 1.04, stack: '"Raleway", ui-sans-serif, system-ui, sans-serif' },
  /** Everything else. Inter (variable on the site). */
  body: { family: "Inter", weight: 400, bold: 600, lineHeight: 1.5, stack: '"Inter Variable", "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' },
  /** Kickers: Inter 600, wide, uppercase. */
  kicker: { weight: 600, letterSpacing: ".12em", transform: "uppercase" },
  /** The wordmark is Raleway 600 at -0.03em, as in the site header. */
  wordmark: { family: "Raleway", weight: 600, letterSpacing: "-0.03em" },
} as const;

export type FormatId = "9x16" | "4x5" | "16x9" | "slide";

/** Canvas sizes and the margins nothing important may cross. */
export const FORMATS: Record<FormatId, { width: number; height: number; use: string; safe: { top: number; bottom: number; side: number } }> = {
  "9x16": { width: 1080, height: 1920, use: "Reels, Shorts, TikTok", safe: { top: 250, bottom: 400, side: 64 } },
  "4x5": { width: 1080, height: 1350, use: "Feed video, LinkedIn", safe: { top: 70, bottom: 70, side: 64 } },
  "16x9": { width: 1920, height: 1080, use: "X, YouTube", safe: { top: 70, bottom: 64, side: 110 } },
  slide: { width: 1080, height: 1350, use: "Carousel slides and post images (static)", safe: { top: 90, bottom: 90, side: 80 } },
};

/**
 * Sizes in px on that canvas. headline = the hook or slide title (its largest size: long lines shrink to fit).
 * title = a heading above a piece of UI. body = supporting line. caption = burned-in captions (video) or the
 * footer line (slides). kicker and chip are the small caps line and the sample-account chip.
 * maxWords: the most words on screen at once, so a frame reads in the time it is up.
 */
export const TYPE: Record<FormatId, { headline: number; title: number; body: number; caption: number; kicker: number; chip: number; maxWords: { headline: number; body: number; caption: number; frame: number } }> = {
  "9x16": { headline: 150, title: 58, body: 46, caption: 52, kicker: 26, chip: 26, maxWords: { headline: 8, body: 14, caption: 5, frame: 22 } },
  "4x5": { headline: 140, title: 54, body: 43, caption: 49, kicker: 24, chip: 24, maxWords: { headline: 8, body: 14, caption: 5, frame: 22 } },
  "16x9": { headline: 150, title: 68, body: 46, caption: 46, kicker: 24, chip: 26, maxWords: { headline: 8, body: 16, caption: 5, frame: 26 } },
  slide: { headline: 96, title: 64, body: 40, caption: 28, kicker: 26, chip: 24, maxWords: { headline: 10, body: 30, caption: 12, frame: 45 } },
};

// ── Shape ──────────────────────────────────────────────────────────────────────────────────────────────────
export const RADII = { sm: 12, md: 16, lg: 22, xl: 26, card: 30, pill: 999 } as const;
export const SPACING = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 24, 6: 32, 7: 48, 8: 64, 9: 96 } as const;
export const SHADOWS = {
  /** --shadow: resting cards. */
  card: "0 1px 2px rgba(28, 36, 51, .04), 0 12px 32px rgba(28, 36, 51, .07)",
  /** The hero dashboard and anything that floats. */
  float: "0 40px 90px -40px rgba(28, 36, 51, .45)",
  /** Under the primary button. */
  button: "0 8px 22px rgba(31, 111, 235, .28)",
} as const;

/** Where the files are (paths from the repo root). The raccoon is never redrawn: crop or recolour these. */
export const ASSETS = {
  mascotHeadSvg: "public/icon.svg",
  mascotComponent: "components/Rocco.tsx",
  mascotPoses: ["public/brand/rocco-hero.png", "public/brand/rocco-wave.png", "public/brand/rocco-judge.png", "public/brand/rocco-party.png"],
  logos: "public/brand/logos/",
  fonts: "lib/og-fonts/",
} as const;
