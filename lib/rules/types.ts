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
  ids?: { campaignId?: string; adGroupId?: string; keywordId?: string };
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
