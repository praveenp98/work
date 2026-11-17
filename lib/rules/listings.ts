import type { ListingRow } from "../parsers/listings";
import type { Analysis, Finding } from "./types";

/**
 * Listing health: a suppressed or inactive listing sells nothing and any ads on it burn money.
 * This is the "is anything on fire" check a senior manager does first thing every morning.
 */
const BAD = /suppress|inactive|incomplete|blocked|stranded|closed|not buyable|discoverable(?!.*buyable)/i;

export function isProblem(r: ListingRow): boolean {
  const s = r.status.toLowerCase();
  if (/^active$|buyable/.test(s) && !r.issue) return false;
  return BAD.test(r.status) || (!!r.issue && !/^active$/i.test(r.status));
}

export function analyzeListings(rows: ListingRow[]): Analysis {
  const problems = rows.filter(isProblem);
  const findings: Finding[] = problems.slice(0, 40).map((r) => {
    const label = r.name ? `${r.name.slice(0, 50)} (${r.sku})` : r.sku;
    const suppressed = /suppress/i.test(r.status + " " + r.issue);
    return {
      severity: "high",
      title: `${label}: ${suppressed ? "suppressed" : r.status.toLowerCase() || "has an issue"}`,
      detail: `${r.issue || "Amazon isn't showing this listing to shoppers."} Fix it in Seller Central → Inventory → Fix your products, and pause its ads until it's live again.`,
      line: suppressed ? "This listing is invisible. Any ads on it are paying for nothing." : undefined,
      valueMonthly: 0,
    };
  });
  const suppressed = problems.filter((r) => /suppress/i.test(r.status + " " + r.issue)).length;
  return {
    reportType: "listing_health",
    headline: problems.length
      ? `${problems.length} listing${problems.length === 1 ? "" : "s"} not selling: ${suppressed ? `${suppressed} suppressed` : "inactive or incomplete"}.`
      : `All ${rows.length} listings look healthy.`,
    findings,
    proposals: [],
    stats: {
      listings: rows.length,
      problems: problems.length,
      suppressed,
      worst: problems[0] ? `${problems[0].sku}${problems[0].issue ? ` (${problems[0].issue.slice(0, 60)})` : ""}` : "",
    },
  };
}
