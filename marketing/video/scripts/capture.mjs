#!/usr/bin/env node
/**
 * Records clean footage of the public site with Playwright, for the "screen recording" scenes (shot B).
 *
 *   npm run capture                                   every clip, every format, from https://rocco.works
 *   npm run capture -- --base http://localhost:3000   from the local dev server instead
 *   npm run capture -- --only hero-loop,pricing-card --format 9x16
 *
 * Output: marketing/video/footage/site/<name>-<format>.mp4 (the footage folder is gitignored).
 *
 * Rules built in:
 *  - Public pages only. It never signs in and never opens a team page, so no real seller's dashboard can be captured.
 *  - Any clip that shows the sample account or a sample report gets a fixed "Sample account" chip in frame.
 *  - It does not count as traffic: the hackathon tracker and the site's own event endpoint are blocked.
 *  - No browser chrome, no cursor, no sticky bars. Scrolls are scripted and eased, so every take is the same.
 *
 * Sizes: the page is laid out at phone width (540 CSS px) for the vertical formats and at 1280 px for 16:9, on a
 * screen that is really 2x (or 1.5x) dense, so text is as large as on a real phone and still sharp. The density
 * is a browser launch flag: Playwright's own deviceScaleFactor is ignored by its video recorder.
 * Needs ffmpeg on the PATH and Playwright.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(HERE, "..", "footage", "site");
const TMP = path.resolve(HERE, "..", "..", "out", "video", "_capture");
const argv = process.argv.slice(2);
const arg = (n, d) => { const i = argv.indexOf(`--${n}`); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : d; };
const BASE = arg("base", "https://rocco.works").replace(/\/$/, "");
const FORMATS = {
  "9x16": { css: { width: 540, height: 960 }, scale: 2, out: { width: 1080, height: 1920 }, mobile: true },
  "4x5": { css: { width: 540, height: 675 }, scale: 2, out: { width: 1080, height: 1350 }, mobile: true },
  "16x9": { css: { width: 1280, height: 720 }, scale: 1.5, out: { width: 1920, height: 1080 }, mobile: false },
};
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Things every clip can do ───────────────────────────────────────────────────────────────────────────────
const CLEAN_CSS = `
  * { cursor: none !important; scrollbar-width: none !important; }
  ::-webkit-scrollbar { display: none !important; }
  html { scroll-behavior: auto !important; }
  .sticky-hire, .chat-fab, .human-pill, nextjs-portal, [data-nextjs-toast], #__next-build-watcher { display: none !important; }
`;
const CHIP = `<div id="capture-sample-chip" style="position:fixed;top:14px;left:50%;transform:translateX(-50%);z-index:2147483647;display:inline-flex;align-items:center;gap:7px;padding:5px 13px 5px 11px;border-radius:999px;background:#fff;border:1.5px solid #1c2433;color:#1c2433;font:700 12.5px/1.2 Inter,system-ui,sans-serif;letter-spacing:.04em;text-transform:uppercase;white-space:nowrap;box-shadow:0 6px 18px -8px rgba(28,36,51,.5)"><i style="width:7px;height:7px;border-radius:50%;background:#e8a33d"></i>Sample account</div>`;

async function open(page, url) {
  await page.goto(`${BASE}${url}`, { waitUntil: "networkidle" });
  await page.addStyleTag({ content: CLEAN_CSS });
  await page.evaluate(() => document.fonts.ready);
}
const sampleChip = (page) => page.evaluate((html) => { if (!document.getElementById("capture-sample-chip")) document.body.insertAdjacentHTML("beforeend", html); }, CHIP);
/** Eased scroll so that `selector` sits at `align` (0 = top of the screen, 0.5 = centre) after `ms`. */
async function scrollTo(page, selector, { ms = 1200, align = 0.5, offset = 0 } = {}) {
  await page.evaluate(async ({ selector, ms, align, offset }) => {
    const el = typeof selector === "string" ? document.querySelector(selector) : null;
    const r = el?.getBoundingClientRect();
    const target = el ? Math.max(0, Math.min(document.documentElement.scrollHeight - innerHeight, scrollY + r.top + r.height * align - innerHeight * align + offset)) : selector;
    const from = scrollY, t0 = performance.now();
    if (ms <= 0) { scrollTo(0, target); return; }
    await new Promise((done) => { const step = (t) => { const k = Math.min(1, (t - t0) / ms), e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; scrollTo(0, from + (target - from) * e); k < 1 ? requestAnimationFrame(step) : done(); }; requestAnimationFrame(step); });
  }, { selector, ms, align, offset });
}
/** Scroll from the top of an element to its bottom at a steady, readable pace. */
async function scrollThrough(page, selector, ms) {
  const fits = await page.evaluate((s) => document.querySelector(s).getBoundingClientRect().height <= innerHeight * 0.92, selector);
  if (fits) { await scrollTo(page, selector, { ms: 0 }); await wait(ms); return; }
  await scrollTo(page, selector, { ms: 0, align: 0, offset: -70 });
  await wait(700);
  await page.evaluate(async ({ selector, ms }) => {
    const r = document.querySelector(selector).getBoundingClientRect();
    const from = scrollY, to = Math.min(document.documentElement.scrollHeight - innerHeight, scrollY + r.bottom - innerHeight + 70), t0 = performance.now();
    await new Promise((done) => { const step = (t) => { const k = Math.min(1, (t - t0) / ms); scrollTo(0, from + (to - from) * k); k < 1 ? requestAnimationFrame(step) : done(); }; requestAnimationFrame(step); });
  }, { selector, ms });
  await wait(700);
}

// ── The clips. setup() is not in the video; run() is. ──────────────────────────────────────────────────────
const CLIPS = [
  { name: "hero-loop", sample: true,
    setup: async (p) => { await open(p, "/"); },
    run: async (p, f) => { if (f.mobile) { await wait(7600); await scrollTo(p, ".hd", { ms: 1300 }); await wait(12000); } else { await scrollTo(p, ".h5-hero", { ms: 0 }); await wait(13000); } } },
  { name: "what-i-handle", sample: false,
    setup: async (p) => { await open(p, "/"); await scrollTo(p, ".hjobs", { ms: 0, align: 0, offset: -150 }); },
    run: async (p) => { await wait(600); await scrollThrough(p, ".hjobs", 6500); } },
  { name: "morning-card", sample: true,
    setup: async (p) => { await open(p, "/"); await scrollTo(p, ".hd", { ms: 0 }); await p.waitForFunction(() => document.querySelector(".hd-foot")?.textContent.includes("Sample account"), null, { timeout: 30000 }); await p.waitForFunction(() => !document.querySelector(".hd-foot")?.textContent.includes("Sample account"), null, { timeout: 30000 }); await p.waitForFunction(() => document.querySelector(".hd-foot")?.textContent.includes("Sample account"), null, { timeout: 30000 }); },
    run: async (p) => { await wait(12500); } },
  { name: "change-log", sample: true,
    setup: async (p) => { await open(p, "/"); await scrollTo(p, ".ld", { ms: 0 }); await p.waitForFunction(() => Number(getComputedStyle(document.querySelector(".ld-past")).opacity) > 0.9, null, { timeout: 30000 }); await p.waitForFunction(() => Number(getComputedStyle(document.querySelector(".ld-past")).opacity) < 0.1, null, { timeout: 30000 }); },
    run: async (p) => { await wait(9500); } },
  { name: "data-vs-decisions", sample: false,
    setup: async (p) => { await open(p, "/"); await scrollTo(p, ".vs", { ms: 0, align: 0, offset: -260 }); },
    run: async (p) => { await wait(900); await scrollThrough(p, ".vs", 4500); await wait(600); } },
  { name: "messages", sample: true,
    setup: async (p) => { await open(p, "/"); await scrollTo(p, ".hmsg", { ms: 0, offset: -220 }); },
    run: async (p) => { await wait(500); await scrollTo(p, ".hmsg", { ms: 1400 }); await wait(4200); } },
  { name: "pricing-card", sample: false,
    setup: async (p) => { await open(p, "/pricing"); await scrollTo(p, ".pc", { ms: 0 }); },
    run: async (p) => { await wait(3200); await p.locator(".pc-toggle button").nth(1).click(); await wait(2200); await p.locator(".pc-toggle button").nth(0).click(); await wait(2600); } },
  { name: "time-calculator", sample: false,
    setup: async (p) => { await open(p, "/pricing"); await scrollTo(p, ".pr-sec .vc", { ms: 0, offset: -160 }); },
    run: async (p) => { await wait(400); await scrollTo(p, ".pr-sec .vc", { ms: 1200 }); await wait(4500); } },
  { name: "tools-ad-roast", sample: true,
    setup: async (p) => { await open(p, "/tools"); },
    run: async (p) => {
      await wait(1800); await scrollThrough(p, ".grid", 3200);
      await open(p, "/tools/ad-roast"); await sampleChip(p); await wait(1500);
      const btn = p.getByText("Try a sample", { exact: false }).first();
      await btn.scrollIntoViewIfNeeded(); await wait(700); await btn.click();
      await wait(2500); await scrollThrough(p, "main", 9000);
    } },
  { name: "account-check-sample", sample: true,
    setup: async (p) => { await open(p, "/tools/account-check"); },
    run: async (p) => {
      await wait(1500);
      const btn = p.getByText("Try it with a sample account", { exact: false }).first();
      await btn.scrollIntoViewIfNeeded(); await wait(700); await btn.click();
      await wait(3500); await scrollThrough(p, "main", 10000);
    } },
];

// ── Record ─────────────────────────────────────────────────────────────────────────────────────────────────
const only = arg("only")?.split(",").map((s) => s.trim());
const formatArg = arg("format", "all");
const formats = formatArg === "all" ? Object.keys(FORMATS) : formatArg.split(",").map((s) => s.trim());
const clips = CLIPS.filter((c) => !only || only.includes(c.name));
if (!clips.length || formats.some((f) => !FORMATS[f])) { console.error(`Clips: ${CLIPS.map((c) => c.name).join(", ")}\nFormats: ${Object.keys(FORMATS).join(", ")}`); process.exit(1); }
try { execFileSync("ffmpeg", ["-version"], { stdio: "ignore" }); } catch { console.error("ffmpeg is needed to turn the recordings into mp4 (brew install ffmpeg)."); process.exit(1); }
let chromium;
try { ({ chromium } = createRequire(import.meta.url)("playwright")); } catch { console.error("Playwright not found. Install it once: npm i -g playwright && npx playwright install chromium"); process.exit(1); }

fs.mkdirSync(OUT, { recursive: true }); fs.mkdirSync(TMP, { recursive: true });
// One browser per screen density (the density can only be set when the browser starts).
const browsers = new Map();
const browserFor = async (scale) => { if (!browsers.has(scale)) browsers.set(scale, await chromium.launch({ args: [`--force-device-scale-factor=${scale}`] })); return browsers.get(scale); };
const report = [];
console.log(`Recording ${clips.length} clip(s) x ${formats.length} format(s) from ${BASE}`);
for (const clip of clips) {
  for (const fmt of formats) {
    const f = FORMATS[fmt];
    const browser = await browserFor(f.scale);
    const context = await browser.newContext({ viewport: f.css, userAgent: UA, hasTouch: false, recordVideo: { dir: TMP, size: f.out }, reducedMotion: "no-preference" });
    // Footage must not count as a visit: block the hackathon tracker and the site's own event endpoint.
    await context.route(/ship-or-die\.com|\/api\/events$/, (r) => r.abort());
    const t0 = Date.now();
    const page = await context.newPage();
    let row = { clip: clip.name, format: fmt };
    try {
      await clip.setup(page, f);
      if (clip.sample) await sampleChip(page);
      await wait(250);
      const start = (Date.now() - t0) / 1000;
      await clip.run(page, f);
      const seconds = (Date.now() - t0) / 1000 - start;
      const webm = await page.video().path();
      await context.close();
      const out = path.join(OUT, `${clip.name}-${fmt}.mp4`);
      execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-ss", start.toFixed(2), "-i", webm, "-t", seconds.toFixed(2), "-vf", `scale=${f.out.width}:${f.out.height}:flags=lanczos,fps=30`, "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-an", "-movflags", "+faststart", out]);
      fs.rmSync(webm, { force: true });
      row = { ...row, seconds: seconds.toFixed(1), mb: (fs.statSync(out).size / 1e6).toFixed(1), sampleChip: clip.sample ? "yes" : "", file: path.relative(process.cwd(), out) };
    } catch (e) {
      await context.close().catch(() => {});
      row = { ...row, error: String(e.message ?? e).split("\n")[0].slice(0, 90) };
    }
    report.push(row);
    console.log(`${row.error ? "✖" : "✓"} ${clip.name}-${fmt}${row.error ? `  ${row.error}` : `  ${row.seconds}s`}`);
  }
}
for (const b of browsers.values()) await b.close();
console.table(report);
process.exit(report.some((r) => r.error) ? 1 : 0);
