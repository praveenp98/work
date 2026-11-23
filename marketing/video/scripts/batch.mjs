#!/usr/bin/env node
/**
 * One base spec, many hooks. For every row of a CSV, swap the first scene's hook and the end card's CTA, then
 * render it like any other spec.
 *
 *   npm run batch -- --spec specs/demo-30s.json --batch batches/demo-hooks.csv --format 9x16
 *   npm run batch -- --spec specs/demo-30s.json --batch batches/demo-hooks.csv --only h02,h05 --format all
 *   add --stills for one PNG per scene instead of video (fast check of every hook)
 *
 * CSV columns: id, line1, line2, highlight (words to print in blue, space separated), spoken (the caption for
 * the hook scene), cta. Output: marketing/out/video/<spec id>-<row id>-<format>.mp4
 * A spec whose first scene is not a hook gets the hook added in front (3 seconds).
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const arg = (n, d) => { const i = argv.indexOf(`--${n}`); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : d; };
const specPath = arg("spec"), batchPath = arg("batch");
if (!specPath || !batchPath) { console.error("Usage: npm run batch -- --spec specs/x.json --batch batches/x.csv [--only id,id] [--format all] [--stills]"); process.exit(1); }

/** Small CSV reader: commas, double quotes, "" for a quote inside quotes. */
function csv(text) {
  const rows = []; let row = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c; }
    else if (c === '"') q = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(cell); cell = ""; if (row.some((x) => x !== "")) rows.push(row); row = []; }
    else cell += c;
  }
  if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
  const [head, ...body] = rows;
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h.trim(), (r[i] ?? "").trim()])));
}

const base = JSON.parse(fs.readFileSync(specPath, "utf8"));
const only = arg("only")?.split(",").map((s) => s.trim());
const rows = csv(fs.readFileSync(batchPath, "utf8")).filter((r) => r.id && (!only || only.includes(r.id)));
if (!rows.length) { console.error("No rows to render."); process.exit(1); }
const tmpDir = path.resolve(HERE, "..", "..", "out", "video", "_batch");
fs.mkdirSync(tmpDir, { recursive: true });
const pass = argv.filter((a, i) => !["--spec", "--batch", "--only"].includes(a) && !["--spec", "--batch", "--only"].includes(argv[i - 1]));

let failed = 0;
for (const r of rows) {
  const spec = structuredClone(base);
  spec.id = `${base.id}-${r.id}`;
  const hook = { type: "hook", duration: 3, caption: r.spoken, props: { lines: [r.line1, r.line2].filter(Boolean), highlight: r.highlight ? r.highlight.split(/\s+/) : [] } };
  if (spec.scenes[0]?.type === "hook") spec.scenes[0] = { ...spec.scenes[0], caption: r.spoken || spec.scenes[0].caption, props: { ...spec.scenes[0].props, lines: hook.props.lines, highlight: hook.props.highlight } };
  else spec.scenes.unshift(hook);
  const end = spec.scenes.findLast((s) => s.type === "end");
  if (end && r.cta) { end.props = { ...end.props, cta: r.cta }; end.caption = (end.caption ?? "").replace(/link in bio|comment rocco|rocco\.works/i, r.cta); }
  const file = path.join(tmpDir, `${spec.id}.json`);
  fs.writeFileSync(file, JSON.stringify(spec, null, 1));
  console.log(`\n── ${spec.id}: "${r.line1} ${r.line2}" · ${r.cta}`);
  const res = spawnSync(process.execPath, [path.join(HERE, "render.mjs"), "--spec", file, ...pass], { stdio: "inherit" });
  if (res.status !== 0) failed++;
}
console.log(`\n${rows.length - failed} of ${rows.length} rendered.`);
process.exit(failed ? 1 : 0);
