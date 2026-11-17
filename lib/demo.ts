import fs from "node:fs";
import path from "node:path";
import Papa from "papaparse";
import { SITE } from "./site";
import { MemoryStore } from "./store/memory";
import { dailyNumbers } from "./text/daily";
import { buildBrief, createWorkspace, runAnalysis } from "./workspace";

/**
 * A sample brand Rocco can show anyone in seconds, before Amazon is plugged in.
 * Same engine as real accounts, run on the public sample reports (public/samples).
 */
const FILES = ["sp-search-term-report.csv", "restock-inventory.csv", "business-report.csv"];

async function sample(name: string): Promise<string | null> {
  const local = path.join(process.cwd(), "public", "samples", name);
  if (fs.existsSync(local)) return fs.readFileSync(local, "utf8");
  const res = await fetch(`${SITE.url}/samples/${name}`).catch(() => null);
  return res?.ok ? res.text() : null;
}

let cached: { text: string; codes: string[]; at: number } | null = null;

/** Morning numbers for the demo brand, as Rocco would text them. */
export async function demoMorning(now = new Date()): Promise<{ text: string; codes: string[] }> {
  if (cached && Date.now() - cached.at < 3600_000) return cached;
  const store = new MemoryStore();
  const { ws } = await createWorkspace(store);
  ws.licensed = true;
  for (const f of FILES) {
    const csv = await sample(f);
    if (csv) await runAnalysis(store, ws, "Demo brand", Papa.parse<unknown[]>(csv, { skipEmptyLines: true }).data);
  }
  const b = await buildBrief(store, ws, now);
  const text = dailyNumbers(b, { now }).replace("☀️ Rocco's numbers", "☀️ Demo brand · Rocco's numbers");
  const codes = (b.perBrand[0]?.open ?? []).sort((x, y) => y.valueMonthly - x.valueMonthly).slice(0, 3).map((p) => p.code);
  cached = { text, codes, at: Date.now() };
  return cached;
}
