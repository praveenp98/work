import type { Action } from "./store/types";

/**
 * Honest money (buyer feedback, Nov 19). Two kinds of "saved":
 *  - measured: real before/after numbers on the same target with sales holding (bid / budget cuts that lowered spend).
 *  - estimated: spend avoided by blocking a search term, assuming it would have kept spending at its old daily rate.
 * Every place that shows savings says which is which.
 */
export type Basis = "measured" | "estimated";

export const basisOf = (a: Action): Basis => a.result?.basis ?? (a.proposal.kind === "negative" ? "estimated" : "measured");

export function savingsOf(actions: Action[]): { measured: number; estimated: number; total: number } {
  let measured = 0, estimated = 0;
  for (const a of actions) {
    const v = a.result?.savedEstimate ?? 0;
    if (!v) continue;
    if (basisOf(a) === "measured") measured += v; else estimated += v;
  }
  return { measured, estimated, total: measured + estimated };
}

const $ = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

/** "$120 measured + ~$300 spend avoided (est.)" — or just one side when the other is zero. */
export function savedPhrase(s: { measured: number; estimated: number }): string {
  const m = s.measured > 0 ? `${$(s.measured)} saved (measured)` : "";
  const e = s.estimated > 0 ? `~${$(s.estimated)} spend avoided (est.)` : "";
  return [m, e].filter(Boolean).join(" + ");
}
