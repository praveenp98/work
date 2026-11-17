import type { Analysis } from "./types";

const PENALTY = { high: 7, medium: 3, low: 1, win: 0 } as const;

/** One account-wide 0–100 score from all analyzed reports (100 = nothing for Rocco to do). */
export function accountScore(analyses: Analysis[]) {
  const findings = analyses.flatMap((a) => a.findings);
  const penalty = findings.reduce((t, f) => t + PENALTY[f.severity], 0);
  const score = Math.max(5, Math.min(100, 100 - penalty));
  const atStake = findings.filter((f) => f.severity !== "win").reduce((t, f) => t + f.valueMonthly, 0);
  const grade = score >= 90 ? "A" : score >= 75 ? "B" : score >= 60 ? "C" : score >= 40 ? "D" : "F";
  const proposals = analyses.flatMap((a) => a.proposals).sort((x, y) => y.valueMonthly - x.valueMonthly);
  return { score, grade, atStakeMonthly: Math.round(atStake), high: findings.filter((f) => f.severity === "high").length, proposals };
}
