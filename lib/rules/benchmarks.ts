/**
 * Anonymized benchmarks across Rocco workspaces: where this account sits vs. everyone else.
 * Only aggregate percentiles are shown, and only once enough accounts exist (MIN_ACCOUNTS).
 */
export const MIN_ACCOUNTS = 10;

/** Metrics compared per report type. higherIsBetter decides the wording. */
export const BENCH_METRICS: Record<string, { key: string; label: string; higherIsBetter: boolean; unit: string }[]> = {
  sp_search_term: [
    { key: "leakPct", label: "ad spend leaking", higherIsBetter: false, unit: "%" },
    { key: "acosPct", label: "ACoS", higherIsBetter: false, unit: "%" },
  ],
  business_report: [
    { key: "conversionPct", label: "conversion rate", higherIsBetter: true, unit: "%" },
    { key: "tacosPct", label: "TACoS", higherIsBetter: false, unit: "%" },
  ],
};

export interface BenchLine { label: string; value: number; median: number; betterThanPct: number; n: number; unit: string }

/** Share of other accounts this value beats (0–100). */
export function betterThan(value: number, others: number[], higherIsBetter: boolean): number {
  if (!others.length) return 0;
  const beaten = others.filter((o) => (higherIsBetter ? value > o : value < o)).length;
  return Math.round((beaten / others.length) * 100);
}

const median = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

export function benchmark(kind: string, mine: Record<string, number | string>, peers: Record<string, number | string>[]): { lines: BenchLine[]; n: number; ready: boolean } {
  const metrics = BENCH_METRICS[kind] ?? [];
  const lines: BenchLine[] = [];
  let n = 0;
  for (const m of metrics) {
    const v = Number(mine[m.key]);
    const others = peers.map((p) => Number(p[m.key])).filter((x) => Number.isFinite(x));
    n = Math.max(n, others.length);
    if (!Number.isFinite(v) || others.length < MIN_ACCOUNTS) continue;
    lines.push({ label: m.label, value: Math.round(v * 10) / 10, median: Math.round(median(others) * 10) / 10, betterThanPct: betterThan(v, others, m.higherIsBetter), n: others.length, unit: m.unit });
  }
  return { lines, n, ready: lines.length > 0 };
}
