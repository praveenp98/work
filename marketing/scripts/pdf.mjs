#!/usr/bin/env node
/**
 * HTML to PDF for lead magnets, with the site's fonts and the offer filled in from marketing/config/offer.ts.
 *
 *   node marketing/scripts/pdf.mjs marketing/pdf/bfcm-checklist-2026.html public/downloads/bfcm-checklist-2026.pdf
 *   node marketing/scripts/pdf.mjs <in.html> <out.pdf> --png     also writes page images to marketing/out/pdf/
 *
 * In the HTML, {{offer:price.from}} style tokens are replaced with values from OFFER (same idea as video specs),
 * so a PDF never carries a typed price. Paths in the HTML are relative to the HTML file.
 * Needs Playwright (any install that `require("playwright")` can find) for the Chromium that prints the page.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { loadConfig, MARKETING_DIR } from "./load-config.mjs";

const [src, out, ...flags] = process.argv.slice(2);
if (!src || !out) { console.error("Usage: node marketing/scripts/pdf.mjs <in.html> <out.pdf> [--png]"); process.exit(1); }
const { OFFER, LINKS } = await loadConfig();
const roots = { offer: OFFER, links: LINKS };
const html = fs.readFileSync(src, "utf8").replace(/\{\{(offer|links):([a-zA-Z0-9_.]+)\}\}/g, (_, root, p) => {
  const v = p.split(".").reduce((o, k) => (o && typeof o === "object" ? o[k] : undefined), roots[root]);
  if (typeof v !== "string" && typeof v !== "number") throw new Error(`Token {{${root}:${p}}} is not in marketing/config/offer.ts`);
  return String(v);
});

const buildDir = path.join(MARKETING_DIR, "out", "pdf");
fs.mkdirSync(buildDir, { recursive: true });
fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
const tmp = path.join(buildDir, `_${path.basename(src)}`);
fs.writeFileSync(tmp, html.replace("<head>", `<head><base href="${pathToFileURL(path.resolve(path.dirname(src)) + path.sep).href}">`));

let chromium;
try { ({ chromium } = createRequire(import.meta.url)("playwright")); } catch { console.error("Playwright not found. Install it once: npm i -g playwright && npx playwright install chromium"); process.exit(1); }
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(pathToFileURL(tmp).href, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.pdf({ path: out, format: "A4", printBackground: true, preferCSSPageSize: true });
await browser.close();
const pages = (fs.readFileSync(out, "latin1").match(/\/Type\s*\/Page[^s]/g) ?? []).length;
console.log(`${out}: ${pages} page(s), ${(fs.statSync(out).size / 1024).toFixed(0)} KB`);

if (flags.includes("--png")) {
  const base = path.join(buildDir, path.basename(out, ".pdf"));
  try { execFileSync("pdftoppm", ["-png", "-r", "80", out, base]); console.log(`page images: ${path.relative(process.cwd(), base)}-*.png`); }
  catch { console.warn("pdftoppm not found (poppler): skipped the page images."); }
}
