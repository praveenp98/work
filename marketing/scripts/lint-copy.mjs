#!/usr/bin/env node
/**
 * Copy lint for every marketing asset. Run from the repo root:
 *
 *   node marketing/scripts/lint-copy.mjs            lint marketing/ and public/downloads/
 *   node marketing/scripts/lint-copy.mjs a.md b.md  lint only these files
 *   node marketing/scripts/lint-copy.mjs --self-test  prove each rule fires
 *
 * Exits 1 on any failure. Skips marketing/BRIEF.md and this file (they quote the banned phrases),
 * marketing/out/ (renders) and node_modules.
 *
 * Fails on:
 *   em-dash          the U+2014 character, anywhere
 *   guarantee-30     "30-day money-back", "30-day guarantee", "30 day money" (the guarantee is 7 days)
 *   free-plan        "free plan" offered as a feature ("no free plan" and the "is there a free plan?" question pass)
 *   trusted-by       "trusted by"
 *   testimonial      testimonial text outside the hidden proof slot (see PROOF SLOT below)
 *   plugs-into       "plugs into Claude"
 *   dollar           any $ amount that is not in marketing/config/offer.ts, the sample account, or $770/$35
 *   sample-label     a file that shows the sample account (its name or its numbers) without the words "sample account"
 *
 * PROOF SLOT: real, permissioned customer proof goes between these two markers and nowhere else. The slot ships
 * hidden until Praveen fills it with proof a seller agreed to in writing.
 *   <!-- proof-slot:start -->  ...  <!-- proof-slot:end -->        (markdown, html)
 *   the same two marker words inside a JSX comment                 (tsx)
 *
 * One-line escape hatch for code, never for copy: put  lint-allow: <reason>  on the line. Every use is printed.
 * Placeholders like {{REAL_NUMBER}} are listed at the end so they can go in the task summary.
 */
import fs from "node:fs";
import path from "node:path";
import { loadConfig, MARKETING_DIR, REPO_DIR } from "./load-config.mjs";

const TEXT_EXT = new Set([".md", ".mdx", ".txt", ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json", ".html", ".htm", ".css", ".csv", ".yml", ".yaml", ".svg", ".srt", ".vtt"]);
const SKIP_DIRS = new Set(["node_modules", "out", ".git", ".next", "dist", "build", ".remotion"]);
const SKIP_FILES = new Set([path.join(MARKETING_DIR, "BRIEF.md"), path.join(MARKETING_DIR, "scripts", "lint-copy.mjs")]);
const EM_DASH = String.fromCharCode(0x2014);

const { OFFER_DOLLAR_AMOUNTS, SAMPLE_DOLLAR_AMOUNTS, SAMPLE } = await loadConfig();
const key = (n) => String(Math.round(n * 100) / 100);
const SAMPLE_ONLY = new Set(SAMPLE_DOLLAR_AMOUNTS.map(key));
const ALLOWED = new Set([...OFFER_DOLLAR_AMOUNTS.map(key), ...SAMPLE_ONLY]);
for (const n of OFFER_DOLLAR_AMOUNTS) SAMPLE_ONLY.delete(key(n)); // an offer amount never needs the sample label

// $1,190  $119/mo  $ 35  $1.20  $100K  $2.5k   (not ${var}, which has no digit after the $)
const DOLLAR = /\$\s?(\d{1,3}(?:,\d{3})+|\d+)(\.\d+)?(?:\s?([kKmM])\b)?/g;
const amountOf = (m) => {
  let n = Number(`${m[1].replace(/,/g, "")}${m[2] ?? ""}`);
  if (m[3]) n *= /k/i.test(m[3]) ? 1_000 : 1_000_000;
  return n;
};

const PHRASES = [
  { rule: "guarantee-30", re: /30[\s-]?days?[\s-]+(?:money|guarantee|refund)|30[\s-]?days?[\s-]+(?:full[\s-]+)?money[\s-]?back/i, why: "the guarantee is 7 days" },
  { rule: "trusted-by", re: /trusted\s+by/i, why: "no social proof we can't back" },
  { rule: "plugs-into", re: /plugs?\s+in\s?to\s+claude/i, why: "old positioning: Rocco needs no Claude or other AI" },
];
// "free plan" passes only when the same sentence says there isn't one.
const FREE_PLAN = /free\s+plan/gi;
const FREE_PLAN_NEGATED = /\b(?:no|not|isn['’]?t|there['’]?s no|without|never|is there)\b[^.!?\n]*$/i;
const TESTIMONIAL = [
  /\btestimonials?\b/i,
  /\b(?:customer|seller|user|client)\s+reviews?\b/i,
  /\bwhat\s+(?:our\s+)?(?:sellers|customers|users|clients|brands)\s+(?:say|are saying|think)\b/i,
  /\b(?:loved|used|chosen)\s+by\s+\d/i,
  /★{3,}|⭐{3,}|\b[45](?:\.\d)?\s*(?:\/\s*5|out of 5|stars?)\b/i,
  /["”][,.]?\s*(?:[-–~]|&mdash;|&ndash;)\s*[A-Z][a-z]+/, // "great tool" - Jane, founder
];
const SLOT_START = /proof-slot:start/;
const SLOT_END = /proof-slot:end/;
const SAMPLE_LABEL = /sample account/i;
const PLACEHOLDER = /\{\{[A-Z0-9_]+\}\}/g;

function lintText(text, file) {
  const fails = [], allows = [], placeholders = [];
  const lines = text.split("\n");
  let inSlot = false, usesSample = text.includes(SAMPLE.brand) || text.includes(SAMPLE.brand.replace("&", "&amp;"));
  const fail = (line, rule, msg) => fails.push({ file, line, rule, msg });

  lines.forEach((raw, i) => {
    const n = i + 1;
    if (SLOT_START.test(raw)) inSlot = true;
    const allowed = /lint-allow:\s*\S/.test(raw);
    if (allowed) allows.push({ file, line: n, text: raw.trim().slice(0, 140) });
    for (const p of raw.match(PLACEHOLDER) ?? []) placeholders.push({ file, line: n, name: p });

    // Never allowed, even with lint-allow.
    if (raw.includes(EM_DASH)) fail(n, "em-dash", "em dash (U+2014): use a comma, period, colon or \"to\"");
    for (const p of PHRASES) if (p.re.test(raw)) fail(n, p.rule, `"${raw.match(p.re)[0]}": ${p.why}`);
    for (const m of raw.matchAll(FREE_PLAN)) {
      if (!FREE_PLAN_NEGATED.test(raw.slice(0, m.index))) fail(n, "free-plan", "\"free plan\" offered as a feature: there is no free plan");
    }
    if (!inSlot) for (const re of TESTIMONIAL) if (re.test(raw)) { fail(n, "testimonial", `"${raw.match(re)[0].trim()}": testimonial text outside the proof slot`); break; }

    if (!allowed) {
      for (const m of raw.matchAll(DOLLAR)) {
        const k = key(amountOf(m));
        if (!ALLOWED.has(k)) fail(n, "dollar", `${m[0].trim()} is not in offer.ts or the sample account. Use a config value or a {{PLACEHOLDER}}`);
        else if (SAMPLE_ONLY.has(k)) usesSample = true;
      }
    }
    if (SLOT_END.test(raw)) inSlot = false;
  });

  if (inSlot) fail(lines.length, "testimonial", "proof-slot:start has no proof-slot:end");
  if (usesSample && !SAMPLE_LABEL.test(text)) fail(1, "sample-label", `shows ${SAMPLE.brand} or its numbers without the words "sample account"`);
  return { fails, allows, placeholders };
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) walk(p, out); }
    else if (TEXT_EXT.has(path.extname(e.name).toLowerCase()) && !SKIP_FILES.has(p) && e.name !== "package-lock.json") out.push(p);
  }
  return out;
}

function selfTest() {
  const D = "$";
  const cases = [
    ["em-dash", `fast${EM_DASH}and blunt`],
    ["guarantee-30", "30-day money-back guarantee"],
    ["guarantee-30", "a 30 day money back promise"],
    ["guarantee-30", "30-day guarantee"],
    ["free-plan", "Start on the free plan today"],
    ["trusted-by", "Trusted by sellers everywhere"],
    ["plugs-into", "Rocco plugs into Claude"],
    ["testimonial", "\"Saved my Q4\" - Jane, founder"],
    ["testimonial", "What sellers say"],
    ["testimonial", "Rated 4.9 out of 5"],
    ["dollar", `only ${D}79 a month`],
    ["dollar", `we made ${D}12,400 last week`],
    ["dollar", `${D}5k saved`],
    ["sample-label", `${SAMPLE.brand}: 4 jobs waiting`],
    ["sample-label", `Rocco has saved you ${D}1,284`],
  ];
  const clean = [
    `${D}1,190 a year or ${D}119 a month. ${D}99/mo billed yearly, save ${D}238.`,
    `1 hour a day at ${D}35 an hour is ${D}770 a month.`,
    `Prices go up every 5 hires: +${D}10 a month, +${D}100 a year. Extra accounts +${D}49/mo.`,
    "7-day money-back guarantee. No free plan: reading an account costs money.",
    "Is there a free plan? No.",
    `Sample account: ${SAMPLE.brand}, 4 jobs worth ~${D}1,240/mo. Bid ${D}1.20 to ${D}0.95.`,
    `the ${D}100K Ship or Die hackathon`,
    "<!-- proof-slot:start -->\n\"Saved my Q4\" - Jane, founder\n<!-- proof-slot:end -->",
    "const a = `${price}/mo`;",
  ];
  let bad = 0;
  for (const [rule, text] of cases) {
    const hit = lintText(text, "self-test").fails.some((f) => f.rule === rule);
    if (!hit) { bad++; console.error(`SELF-TEST FAIL  expected ${rule} on: ${text}`); }
  }
  for (const text of clean) {
    const f = lintText(text, "self-test").fails;
    if (f.length) { bad++; console.error(`SELF-TEST FAIL  expected clean, got ${f.map((x) => x.rule).join(", ")} on: ${text}`); }
  }
  console.log(bad ? `self-test: ${bad} wrong` : `self-test: ${cases.length} bad lines caught, ${clean.length} good lines passed`);
  process.exit(bad ? 1 : 0);
}

const args = process.argv.slice(2);
if (args.includes("--self-test")) selfTest();

const files = args.length ? args.map((a) => path.resolve(a)) : [...walk(MARKETING_DIR), ...walk(path.join(REPO_DIR, "public", "downloads"))];
const rel = (f) => path.relative(REPO_DIR, f);
let fails = [], allows = [], placeholders = [];
for (const f of files) {
  const r = lintText(fs.readFileSync(f, "utf8"), rel(f));
  fails = fails.concat(r.fails); allows = allows.concat(r.allows); placeholders = placeholders.concat(r.placeholders);
}

for (const f of fails) console.error(`FAIL  ${f.file}:${f.line}  [${f.rule}]  ${f.msg}`);
if (allows.length) { console.log(`\nlint-allow used on ${allows.length} line(s) (dollar check skipped there):`); for (const a of allows) console.log(`  ${a.file}:${a.line}  ${a.text}`); }
if (placeholders.length) { console.log(`\nPlaceholders still open (${placeholders.length}):`); for (const p of placeholders) console.log(`  ${p.name}  ${p.file}:${p.line}`); }
console.log(`\n${files.length} file(s) checked, ${fails.length} failure(s).`);
process.exit(fails.length ? 1 : 0);
