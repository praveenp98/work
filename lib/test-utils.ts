import fs from "node:fs";
import path from "node:path";
import Papa from "papaparse";

export function loadFixture(name: string): unknown[][] {
  const text = fs.readFileSync(path.join(__dirname, "..", "fixtures", name), "utf8");
  return Papa.parse<unknown[]>(text, { skipEmptyLines: true }).data;
}
