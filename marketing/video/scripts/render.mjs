#!/usr/bin/env node
/**
 * npm run render -- --spec specs/demo.json --format all
 *
 *   --spec <file>        a spec JSON (see specs/demo.json and src/spec.ts)
 *   --format <list>      all | 9x16 | 4x5 | 16x9, or a comma list. Default: all
 *   --draft              half resolution, for a quick look
 *   --poster-only        only the poster PNGs
 *   --stills [0.85]      no video: one PNG per scene (taken 85% of the way through it) for a fast visual check,
 *                        in marketing/out/video/stills/
 *   --concurrency <n>    browser tabs to render with (default: Remotion picks)
 *
 * Writes marketing/out/video/<spec id>-<format>.mp4 and a poster <spec id>-<format>.png.
 * Bundles once, then renders each format from the same bundle.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import { makeWebpackOverride } from "../webpack-override.mjs";
import { prepare } from "./prepare.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const VIDEO_DIR = path.resolve(HERE, "..");
const OUT_DIR = path.resolve(VIDEO_DIR, "..", "out", "video");
const FORMATS = ["9x16", "4x5", "16x9"];
const SCENE_TYPES = ["hook", "ui", "phone", "changelog", "compare", "stat", "footage", "end"];
const UI_PIECES = ["connect", "morning", "job", "approve", "tidy", "changelog-row", "skip", "before-rocco", "pricing"];

const argv = process.argv.slice(2);
const arg = (name, fallback) => { const i = argv.indexOf(`--${name}`); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : fallback; };
const flag = (name) => argv.includes(`--${name}`);
const die = (msg) => { console.error(`\n✖ ${msg}\n`); process.exit(1); };

const specArg = arg("spec");
if (!specArg) die("Which spec? Example: npm run render -- --spec specs/demo.json --format all");
const specPath = [path.resolve(process.cwd(), specArg), path.resolve(VIDEO_DIR, specArg)].find((p) => fs.existsSync(p));
if (!specPath) die(`Spec not found: ${specArg}`);
let spec;
try { spec = JSON.parse(fs.readFileSync(specPath, "utf8")); } catch (e) { die(`${specArg} is not valid JSON: ${e.message}`); }

const formatArg = arg("format", "all");
const formats = formatArg === "all" ? FORMATS : formatArg.split(",").map((f) => f.trim());
for (const f of formats) if (!FORMATS.includes(f)) die(`Unknown format "${f}". Use all, or any of ${FORMATS.join(", ")}.`);

// ── Check the spec before spending minutes on a render ────────────────────────────────────────────────────
const errors = [], warnings = [];
if (!spec.id || !/^[a-zA-Z0-9-]+$/.test(spec.id)) errors.push(`"id" is required (letters, digits and dashes): it names the output files.`);
if (!Array.isArray(spec.scenes) || !spec.scenes.length) errors.push(`"scenes" must be a list with at least one scene.`);
const fps = spec.fps ?? 30;
(spec.scenes ?? []).forEach((s, i) => {
  const at = `scene ${i + 1} (${s.type})`;
  if (!SCENE_TYPES.includes(s.type)) return errors.push(`${at}: unknown type. Use one of ${SCENE_TYPES.join(", ")}.`);
  if (!(s.duration > 0)) errors.push(`${at}: "duration" (seconds) is required.`);
  const p = s.props ?? {};
  if (s.type === "stat" && !String(p.source ?? "").trim()) errors.push(`${at}: a stat needs a "source" line. No source, no number.`);
  if (s.type === "stat" && !p.value) errors.push(`${at}: "value" is required.`);
  if (s.type === "hook" && !(Array.isArray(p.lines) && p.lines.length >= 1 && p.lines.length <= 2)) errors.push(`${at}: "lines" must be one or two lines.`);
  if (s.type === "ui" && !UI_PIECES.includes(p.piece)) errors.push(`${at}: "piece" must be one of ${UI_PIECES.join(", ")}.`);
  if (s.type === "end" && !p.cta) errors.push(`${at}: "cta" is required ("comment rocco", "link in bio", "rocco.works/x").`);
  if (s.type === "footage") {
    if (!/^footage\//.test(p.src ?? "")) errors.push(`${at}: "src" must be a file in footage/, e.g. "footage/day7-face.mp4".`);
    if (!["A", "B", "C"].includes(p.shot)) errors.push(`${at}: "shot" must be A (face cam), B (screen recording) or C (desk clip).`);
  }
  if (!s.caption && !spec.captions) warnings.push(`${at}: no caption. Most people watch with the sound off.`);
});
if (errors.length) die(`${path.basename(specPath)} has ${errors.length} problem(s):\n  - ${errors.join("\n  - ")}`);

const seconds = spec.scenes.reduce((n, s) => n + s.duration, 0);
if (seconds < 25 || seconds > 60) warnings.push(`total length is ${seconds.toFixed(1)}s. The brief asks for 25 to 60 seconds.`);

// ── Look at the files the spec points to ───────────────────────────────────────────────────────────────────
const onDisk = (rel) => fs.existsSync(path.join(VIDEO_DIR, rel));
const resolved = { missing: [...new Set(spec.scenes.filter((s) => s.type === "footage").map((s) => s.props.src))].filter((f) => !onDisk(f)) };
for (const f of resolved.missing) warnings.push(`${f} is not on disk: that scene renders as a labelled slot.`);
if (spec.music) {
  resolved.musicOk = onDisk(spec.music.src);
  if (!resolved.musicOk) warnings.push(`${spec.music.src} is not on disk: rendering without music.`);
}
if (spec.captions?.src) {
  if (!onDisk(spec.captions.src)) die(`Captions file not found: marketing/video/${spec.captions.src}`);
  const { parseSrt, parseCaptionJson } = await import("../src/captions.ts");
  const body = fs.readFileSync(path.join(VIDEO_DIR, spec.captions.src), "utf8");
  Object.assign(resolved, /\.json$/i.test(spec.captions.src) ? parseCaptionJson(JSON.parse(body)) : { cues: parseSrt(body) });
}
for (const w of warnings) console.warn(`! ${w}`);

// ── Bundle once, render each format ────────────────────────────────────────────────────────────────────────
const t0 = Date.now();
const secs = (ms) => `${(ms / 1000).toFixed(1)}s`;
await prepare();
console.log(`Bundling…`);
const serveUrl = await bundle({ entryPoint: path.join(VIDEO_DIR, "src", "index.ts"), webpackOverride: makeWebpackOverride(VIDEO_DIR), publicDir: path.join(VIDEO_DIR, "public") });
const bundleMs = Date.now() - t0;
console.log(`Bundled in ${secs(bundleMs)}`);

fs.mkdirSync(OUT_DIR, { recursive: true });
const browserExecutable = process.env.REMOTION_CHROME_EXECUTABLE || undefined; // only if Remotion can't download its own Chrome
const chromiumOptions = { gl: process.env.REMOTION_GL || undefined };
const concurrency = arg("concurrency") ? Number(arg("concurrency")) : undefined;
const scale = flag("draft") ? 0.5 : 1;
const logLevel = flag("verbose") ? "verbose" : "error";
const report = [];

for (const format of formats) {
  const inputProps = { spec, layout: format, resolved };
  const composition = await selectComposition({ serveUrl, id: `Video-${format}`, inputProps, browserExecutable, chromiumOptions, logLevel });
  const base = path.join(OUT_DIR, `${spec.id}-${format}`);
  const row = { format, size: `${composition.width}x${composition.height}`, frames: composition.durationInFrames };

  const posterScene = Math.min(spec.poster?.scene ?? 0, spec.scenes.length - 1);
  const before = spec.scenes.slice(0, posterScene).reduce((n, s) => n + Math.round(s.duration * fps), 0);
  const posterFrame = Math.min(composition.durationInFrames - 1, before + Math.round((spec.poster?.at ?? 1) * fps));
  let t = Date.now();
  await renderStill({ composition, serveUrl, output: `${base}.png`, frame: posterFrame, inputProps, imageFormat: "png", scale, browserExecutable, chromiumOptions, logLevel });
  row.poster = secs(Date.now() - t);

  if (flag("stills")) {
    const frac = Number(arg("stills", "0.85"));
    const dir = path.join(OUT_DIR, "stills");
    fs.mkdirSync(dir, { recursive: true });
    t = Date.now();
    let start = 0;
    for (const [i, s] of spec.scenes.entries()) {
      const len = Math.max(1, Math.round(s.duration * fps));
      const output = path.join(dir, `${spec.id}-${format}-${String(i + 1).padStart(2, "0")}-${s.type}.png`);
      await renderStill({ composition, serveUrl, output, frame: Math.min(composition.durationInFrames - 1, start + Math.round(len * frac)), inputProps, imageFormat: "png", scale, browserExecutable, chromiumOptions, logLevel });
      start += len;
    }
    row.stills = `${spec.scenes.length} in ${secs(Date.now() - t)}`;
  } else if (!flag("poster-only")) {
    t = Date.now();
    let last = -1;
    await renderMedia({
      composition, serveUrl, codec: "h264", outputLocation: `${base}.mp4`, inputProps, scale, concurrency, browserExecutable, chromiumOptions, logLevel,
      onProgress: ({ progress }) => { const pct = Math.floor(progress * 10) * 10; if (pct !== last) { last = pct; process.stdout.write(`\r${format}  ${String(pct).padStart(3)}%`); } },
    });
    process.stdout.write("\n");
    row.video = secs(Date.now() - t);
    row.mb = (fs.statSync(`${base}.mp4`).size / 1e6).toFixed(1);
  }
  report.push(row);
}

console.log(`\n${spec.id}: ${seconds.toFixed(1)}s of video, ${fps} fps`);
console.table(report);
console.log(`Bundle ${secs(bundleMs)} · total ${secs(Date.now() - t0)}\nFiles in ${path.relative(process.cwd(), OUT_DIR) || "."}/`);
