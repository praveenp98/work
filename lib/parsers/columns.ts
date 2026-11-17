import { normHeader } from "./normalize";

/**
 * Find columns by header synonyms. Matches against both the normalized header
 * (lowercase, bracket text removed) and the raw lowercase header, so "(Child) ASIN"
 * can be told apart from "(Parent) ASIN".
 */
export function findColumns<F extends string>(header: unknown[], spec: Record<F, string[]>): Partial<Record<F, number>> {
  const norm = header.map(normHeader);
  const raw = header.map((h) => String(h ?? "").trim().toLowerCase().replace(/\s+/g, " "));
  const out: Partial<Record<F, number>> = {};
  const used = new Set<number>();
  for (const f of Object.keys(spec) as F[]) {
    for (const s of spec[f]) {
      let idx = raw.findIndex((h, i) => !used.has(i) && h === s);
      if (idx < 0) idx = norm.findIndex((h, i) => !used.has(i) && h === s);
      if (idx < 0) idx = norm.findIndex((h, i) => !used.has(i) && h.startsWith(s + " "));
      if (idx >= 0) { out[f] = idx; used.add(idx); break; }
    }
  }
  return out;
}

export function headerRowWith<F extends string>(table: unknown[][], spec: Record<F, string[]>, required: F[]): number {
  for (let i = 0; i < Math.min(10, table.length); i++) {
    const c = findColumns(table[i] ?? [], spec);
    if (required.every((f) => c[f] !== undefined)) return i;
  }
  return -1;
}
