#!/usr/bin/env node
/**
 * WCAG AA contrast check for every text/background pair in marketing/brand/tokens.ts (TEXT_PAIRS).
 * Normal text needs 4.5:1, large text (24px and up, or 19px bold) needs 3:1. Exits 1 if any pair fails.
 *
 *   node marketing/scripts/contrast.mjs          table in the terminal
 *   node marketing/scripts/contrast.mjs --json   machine-readable (the /brand page uses the same maths)
 */
import path from "node:path";
import { pathToFileURL } from "node:url";
import { MARKETING_DIR } from "./load-config.mjs";

const { TEXT_PAIRS, contrast: ratio } = await import(pathToFileURL(path.join(MARKETING_DIR, "brand", "tokens.ts")).href);

const rows = TEXT_PAIRS.map((p) => { const r = ratio(p.text, p.on); const need = p.size === "large" ? 3 : 4.5; return { pair: p.name, text: p.text, on: p.on, size: p.size, ratio: Math.round(r * 100) / 100, needs: need, AA: r >= need ? "pass" : "FAIL" }; });
if (process.argv.includes("--json")) console.log(JSON.stringify(rows, null, 1)); else console.table(rows);
const bad = rows.filter((r) => r.AA === "FAIL");
if (bad.length) { console.error(`${bad.length} pair(s) fail AA.`); process.exit(1); }
if (!process.argv.includes("--json")) console.log(`All ${rows.length} pairs pass AA.`);
