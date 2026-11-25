/** Shared output shapes so every analyzer can be shown on the web, in MCP, and saved to memory. */
export type Severity = "high" | "medium" | "low" | "win";

export interface Finding {
  severity: Severity;
  title: string;
  detail: string;
  /** Rocco's one-liner. */
  line?: string;
  /** Money at stake per month (waste or missed sales), 0 if not measurable. */
  valueMonthly: number;
  /** Running-out findings: what to send (one-tap restock plan). */
  restock?: { sku: string; asin: string; available: number; daily: number; suggest: number };
}

export type ProposalKind = "negative" | "harvest" | "bid" | "budget" | "placement" | "ads_down" | "structure";

export interface Metrics {
  spendPerDay: number;
  salesPerDay: number;
  clicksPerDay: number;
  ordersPerDay: number;
  acos: number; // -1 when no sales
}

/** A concrete change Rocco proposes. Codes (N1, H1, B1, G1, S1, F1) are what the user approves. */
export interface Proposal {
  code: string;
  kind: ProposalKind;
  campaign: string;
  adGroup: string;
  target: string; // search term, keyword/target, SKU/ASIN, or campaign
  matchType?: string;
  current?: number; // current bid/budget/CPC
  proposed?: number; // new bid/budget
  reason: string;
  valueMonthly: number;
  before?: Metrics;
  undo: string;
  /** Amazon IDs when known (data pulled through the Ads API), so the change can be applied by Amazon's connector. */
  ids?: { campaignId?: string; adGroupId?: string; keywordId?: string; /** ads Rocco paused (low stock), for undo */ adIds?: string[] };
  /** Bid moves as a % so the AI can apply them to the live bid. */
  changePct?: number;
}

export interface Analysis {
  reportType: string;
  headline: string;
  findings: Finding[];
  proposals: Proposal[];
  stats: Record<string, number | string>;
}

export const r2 = (n: number) => Math.round(n * 100) / 100;

/** Amazon titles run 150+ chars ("Journal: Weight Loss Journal. Food Journals for…"). Keep the product's own name. */
export function shortName(title: string, max = 48): string {
  const t = title.trim();
  const head = t.split(/\s*[:|–—]\s+|\.\s+|\s+-\s+/)[0] ?? t;
  const s = head.length >= 8 ? head : t;
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(" ") > 20 ? cut.lastIndexOf(" ") : max).trim()}…`;
}

const RANK: Record<Severity, number> = { high: 0, medium: 1, win: 2, low: 3 };
/** Most urgent first, duplicates (same title, e.g. two SKUs of one product) merged. Used before findings are saved. */
export function sortFindings<T extends { severity: Severity; title: string }>(fs: T[]): T[] {
  const seen = new Set<string>();
  return [...fs].sort((a, b) => RANK[a.severity] - RANK[b.severity]).filter((f) => (seen.has(f.title) ? false : (seen.add(f.title), true)));
}
