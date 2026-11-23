#!/usr/bin/env node
/**
 * Builds Rocco's logo files from what the site already has. Nothing is drawn here:
 *  - the wordmark is the site header's type (Raleway 600, -0.03em), turned into outlines so the SVGs need no font;
 *  - the raccoon is public/icon.svg, placed as is, or recoloured for the one-colour versions.
 *
 *   node marketing/brand/build-logos.mjs
 *
 * Writes public/brand/logos/*.svg, PNG avatars, the contact sheet (marketing/out/brand/contact-sheet.png) and
 * public/brand/rocco-brand-kit.zip. Needs opentype.js (installed in marketing/video) and Playwright for the PNGs.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { MARKETING_DIR, REPO_DIR } from "../scripts/load-config.mjs";

const { COLORS, FONTS, MASCOT, ROLES, RADII, TYPE, FORMATS } = await import(pathToFileURL(path.join(MARKETING_DIR, "brand", "tokens.ts")).href);
const opentype = createRequire(path.join(MARKETING_DIR, "video", "package.json"))("opentype.js");
const font = opentype.loadSync(path.join(REPO_DIR, "lib", "og-fonts", "raleway-600.woff"));
const OUT = path.join(REPO_DIR, "public", "brand", "logos");
const SHEET_DIR = path.join(MARKETING_DIR, "out", "brand");
fs.mkdirSync(OUT, { recursive: true }); fs.mkdirSync(SHEET_DIR, { recursive: true });

// ── The raccoon (public/icon.svg), as is or in one colour ──────────────────────────────────────────────────
const icon = fs.readFileSync(path.join(REPO_DIR, "public", "icon.svg"), "utf8");
const HEAD = { x: 15, y: 5, w: 170, h: 140 };
const inner = icon.replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
const shapes = [...inner.replace(/<defs>.*?<\/defs>/s, "").matchAll(/<(path|ellipse|circle|rect)\b[^>]*>/g)].map((m) => m[0].replace(/><\/\w+>$/, "/>").replace(/([^/])>$/, "$1/>")); // lint-allow: regex backreference, not a price
const LIGHT = new Set(["#fff", "#ffffff", MASCOT.furLight]);
const DARK = new Set([MASCOT.mask, MASCOT.ink, MASCOT.furDark]);
let uid = 0;
/** Full colour: the file's own content. One colour: each shape becomes solid, a tint, or a hole, in paint order. */
function raccoon(x, y, height, mono) {
  const s = height / HEAD.h, tf = `translate(${x - HEAD.x * s} ${y - HEAD.y * s}) scale(${s})`;
  if (!mono) { const id = `f${++uid}`; return `<g transform="${tf}">${inner.replaceAll("mini-smirk-face", id)}</g>`; }
  const id = `m${++uid}`;
  const painted = shapes.map((el) => {
    const fill = (el.match(/fill="([^"]+)"/)?.[1] ?? "").toLowerCase();
    const tone = LIGHT.has(fill) ? "#000" : DARK.has(fill) ? "#fff" : fill === MASCOT.pink ? "#555" : "#9a9a9a";
    return el.replace(/fill="[^"]+"/, `fill="${tone}"`).replace(/stroke="[^"]+"/, `stroke="${tone}"`);
  }).join("");
  return `<g transform="${tf}"><mask id="${id}" maskUnits="userSpaceOnUse" x="${HEAD.x}" y="${HEAD.y}" width="${HEAD.w}" height="${HEAD.h}">${painted}</mask><rect x="${HEAD.x}" y="${HEAD.y}" width="${HEAD.w}" height="${HEAD.h}" fill="${mono}" mask="url(#${id})"/></g>`;
}

// ── The wordmark: site header type as outlines ─────────────────────────────────────────────────────────────
const SIZE = 100, TRACK = -0.03;
const textPath = (text, x, baseline, fill) => `<path d="${font.getPath(text, x, baseline, SIZE, { letterSpacing: TRACK }).toPathData(2)}" fill="${fill}"/>`;
const textWidth = (text) => font.getAdvanceWidth(text, SIZE, { letterSpacing: TRACK });
const svg = (w, h, body, bg) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${Math.round(w)} ${Math.round(h)}" width="${Math.round(w)}" height="${Math.round(h)}" role="img" aria-label="Rocco">${bg ? `<rect width="100%" height="100%" fill="${bg}"/>` : ""}${body}</svg>\n`;

const THEMES = {
  light: { ink: COLORS.ink, soft: COLORS.muted, mono: null, preview: COLORS.bg },
  dark: { ink: COLORS.white, soft: "#aab2c0", mono: null, preview: COLORS.night },
  mono: { ink: COLORS.ink, soft: COLORS.ink, mono: COLORS.ink, preview: COLORS.white },
};
const PAD = 14, BASE = 92, H = 120;
const files = [];
const save = (name, content) => { fs.writeFileSync(path.join(OUT, name), content); files.push(name); };

for (const [theme, t] of Object.entries(THEMES)) {
  // 1. lowercase "rocco"
  save(`rocco-wordmark-${theme}.svg`, svg(textWidth("rocco") + PAD * 2, H, textPath("rocco", PAD, BASE, t.ink)));
  // 2. "rocco.works"
  const w1 = textWidth("rocco");
  save(`rocco-works-${theme}.svg`, svg(textWidth("rocco.works") + PAD * 2, H, textPath("rocco", PAD, BASE, t.ink) + textPath(".works", PAD + w1 + SIZE * TRACK * 0, BASE, t.soft)));
  // 3. raccoon + wordmark lockup
  const rh = 96, rw = rh * (HEAD.w / HEAD.h), gap = 16;
  save(`rocco-lockup-${theme}.svg`, svg(PAD + rw + gap + textWidth("rocco") + PAD, H, raccoon(PAD, (H - rh) / 2, rh, t.mono) + textPath("rocco", PAD + rw + gap, BASE, t.ink)));
  // 4. raccoon-only mark (square, transparent)
  const m = 160, mh = 116;
  save(`rocco-mark-${theme}.svg`, svg(m, m, raccoon((m - mh * (HEAD.w / HEAD.h)) / 2, (m - mh) / 2 + 2, mh, t.mono)));
}
// One-colour in white, for dark or photo backgrounds.
save("rocco-lockup-mono-white.svg", svg(PAD + 96 * (HEAD.w / HEAD.h) + 16 + textWidth("rocco") + PAD, H, raccoon(PAD, 12, 96, "#ffffff") + textPath("rocco", PAD + 96 * (HEAD.w / HEAD.h) + 16, BASE, "#ffffff")));
save("rocco-mark-mono-white.svg", svg(160, 160, raccoon((160 - 116 * (HEAD.w / HEAD.h)) / 2, 24, 116, "#ffffff")));

// Avatars: the raccoon face, full colour, on a full-bleed square (platforms crop it to a circle).
const avatar = (bg) => svg(400, 400, raccoon((400 - 250 * (HEAD.w / HEAD.h)) / 2, 80, 250, null), bg);
save("rocco-avatar-green.svg", avatar(COLORS.green));
save("rocco-avatar-light.svg", avatar(COLORS.bg));
save("rocco-avatar-night.svg", avatar(COLORS.night));

// ── PNGs and the contact sheet ─────────────────────────────────────────────────────────────────────────────
const { chromium } = createRequire(import.meta.url)("playwright");
const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });
for (const [name, px] of [["rocco-avatar-green", 400], ["rocco-avatar-green", 48], ["rocco-avatar-light", 400], ["rocco-avatar-night", 400]]) {
  await page.setViewportSize({ width: px, height: px });
  // Inline the SVG: a blank page is not allowed to load file:// images.
  await page.setContent(`<body style="margin:0">${fs.readFileSync(path.join(OUT, `${name}.svg`), "utf8").replace(/width="\d+" height="\d+"/, `width="${px}" height="${px}" style="display:block"`)}</body>`);
  await page.screenshot({ path: path.join(OUT, `${name}-${px}.png`) }); files.push(`${name}-${px}.png`);
}
await page.setViewportSize({ width: 1600, height: 500 });
await page.setContent(`<body style="margin:0;background:${COLORS.bg};display:grid;place-items:center;height:500px">${fs.readFileSync(path.join(OUT, "rocco-lockup-light.svg"), "utf8").replace(/width="(\d+)" height="(\d+)"/, (_, w, h) => `width="${Math.round((w / h) * 170)}" height="170"`)}</body>`);
await page.screenshot({ path: path.join(OUT, "rocco-banner-light-1600x500.png") }); files.push("rocco-banner-light-1600x500.png");

const u = (n) => pathToFileURL(path.join(OUT, n)).href;
const LIGHT_BG = new Set([COLORS.bg, COLORS.white]);
const cell = (n, bg, label) => `<figure style="background:${bg}"><img src="${u(n)}"><figcaption style="color:${LIGHT_BG.has(bg) ? COLORS.muted : "#ffffff"}">${label}</figcaption></figure>`;
const row = (title, base) => `<h2>${title}</h2><div class="row">${cell(`${base}-light.svg`, COLORS.bg, "light")}${cell(`${base}-dark.svg`, COLORS.night, "dark")}${cell(`${base}-mono.svg`, COLORS.white, "one colour")}</div>`;
const sheet = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Raleway;font-weight:500;src:url("${pathToFileURL(path.join(REPO_DIR, "lib/og-fonts/raleway-500.woff")).href}")}
@font-face{font-family:Inter;font-weight:400;src:url("${pathToFileURL(path.join(REPO_DIR, "lib/og-fonts/inter-400.woff")).href}")}
@font-face{font-family:Inter;font-weight:600;src:url("${pathToFileURL(path.join(REPO_DIR, "lib/og-fonts/inter-600.woff")).href}")}
body{margin:0;padding:48px 56px;background:#fff;color:${COLORS.ink};font:400 16px/1.5 Inter;width:1500px}
h1{font:500 44px Raleway;letter-spacing:-.035em;margin:0 0 6px} h2{font:500 22px Raleway;letter-spacing:-.02em;margin:30px 0 10px}
p{margin:0;color:${COLORS.muted}} .row{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
figure{margin:0;border:1px solid ${COLORS.line};border-radius:18px;height:170px;display:grid;place-items:center;position:relative}
figure img{max-height:84px;max-width:80%} figcaption{position:absolute;left:14px;bottom:10px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;font-weight:600}
.av{display:flex;gap:28px;align-items:flex-end;flex-wrap:wrap} .av div{display:grid;gap:6px;justify-items:center;font-size:12px;color:${COLORS.muted}} .av img{border-radius:50%}
.pick{border:2px solid ${COLORS.green};border-radius:18px;padding:16px 18px;background:${COLORS.greenTint};color:${COLORS.ink}}
</style></head><body>
<h1>Rocco logo options</h1><p>Site type (Raleway 600, the header's tracking) as outlines. The raccoon is public/icon.svg, only placed or recoloured.</p>
${row("1. Wordmark: rocco", "rocco-wordmark")}${row("2. Wordmark with domain: rocco.works", "rocco-works")}${row("3. Lockup: raccoon + rocco", "rocco-lockup")}${row("4. Mark: raccoon only", "rocco-mark")}
<h2>Avatar test: the mark at 400, 96 and 48 px, cropped to a circle as the platforms do</h2>
<div class="av">${["rocco-avatar-green.svg", "rocco-avatar-light.svg", "rocco-avatar-night.svg"].map((n) => [400, 96, 48].map((s, i) => `<div><img src="${u(n)}" width="${i === 0 ? 150 : s}" height="${i === 0 ? 150 : s}">${i === 0 ? n.replace("rocco-avatar-", "").replace(".svg", "") : `${s}px`}</div>`).join("")).join("")}
<div><img src="${pathToFileURL(path.join(REPO_DIR, "public/rocco-avatar.png")).href}" width="48" height="48">current 48px</div></div>
<h2>One colour in white</h2><div class="row" style="grid-template-columns:repeat(2,1fr)">${cell("rocco-lockup-mono-white.svg", COLORS.accent, "on the primary blue")}${cell("rocco-mark-mono-white.svg", COLORS.green, "on green")}</div>
<h2>Recommended</h2><div class="row" style="grid-template-columns:1fr 1fr"><div class="pick"><b>Avatars:</b> rocco-avatar-green. The face fills the circle and still reads at 48px on the site's green.</div><div class="pick"><b>Banners and headers:</b> rocco-lockup-light (rocco-lockup-dark on dark). The raccoon carries recognition, the word carries the name.</div></div>
</body></html>`;
const sheetHtml = path.join(SHEET_DIR, "contact-sheet.html");
fs.writeFileSync(sheetHtml, sheet);
await page.setViewportSize({ width: 1612, height: 900 });
await page.goto(pathToFileURL(sheetHtml).href, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: path.join(SHEET_DIR, "contact-sheet.png"), fullPage: true });
await page.setViewportSize({ width: 48, height: 48 });
await browser.close();

// ── The kit people download from /brand ────────────────────────────────────────────────────────────────────
fs.writeFileSync(path.join(OUT, "rocco-colors.json"), JSON.stringify({ colors: COLORS, roles: ROLES, fonts: FONTS, radii: RADII, formats: FORMATS, type: TYPE }, null, 2));
fs.writeFileSync(path.join(OUT, "README.txt"), `Rocco brand kit (rocco.works/brand)

Avatar: rocco-avatar-green (the raccoon face on green).
Banners and headers: rocco-lockup-light, or rocco-lockup-dark on dark backgrounds.
One colour: the -mono files (ink) and -mono-white files.
Fonts: Raleway (headlines, wordmark) and Inter (text). Both are free on Google Fonts.
Colours and sizes: rocco-colors.json.

Please don't redraw, stretch or recolour the raccoon beyond these files, and don't put the logo next to
Amazon's in a way that suggests a partnership. Rocco is not affiliated with Amazon.
Questions: hello@rocco.works
`);
const zip = path.join(REPO_DIR, "public", "brand", "rocco-brand-kit.zip");
fs.rmSync(zip, { force: true });
execFileSync("zip", ["-q", "-r", "-X", zip, "logos", "rocco-hero.png", "rocco-wave.png", "rocco-judge.png", "rocco-party.png"], { cwd: path.join(REPO_DIR, "public", "brand") });
console.log(`${files.length} logo files in public/brand/logos/, kit ${(fs.statSync(zip).size / 1024).toFixed(0)} KB, sheet ${path.relative(REPO_DIR, path.join(SHEET_DIR, "contact-sheet.png"))}`);
