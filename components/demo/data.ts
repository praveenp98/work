/** Demo account for /demo and the demo film. Fictional brand, realistic numbers. Labeled "Demo data" everywhere. */
export const BRAND = { name: "Bamboo & Co.", market: "US", checked: "6:02 AM" };

export type JobState = "open" | "checking" | "making" | "done";
export interface DemoJob {
  id: string; ic: string; title: string; why: string; value: number; kind: "auto" | "create" | "restock"; undo: boolean;
  items: { label: string; detail: string; v?: string }[]; btn: string; making: string; done: string; pick?: boolean;
}

export const JOBS: DemoJob[] = [
  { id: "neg", ic: "✂️", title: "Block 6 searches that waste money", why: "Clicks, no orders, past the attribution lag. Blocking them saves ~$310/mo.", value: 310, kind: "auto", undo: false, pick: true,
    items: [{ label: "“free cutting board”", detail: "38 clicks · $41.20 · 0 orders", v: "$118" }, { label: "“plastic cutting mat”", detail: "27 clicks · $30.10 · 0 orders", v: "$86" }, { label: "“wood glue”", detail: "19 clicks · $17.40 · 0 orders", v: "$50" }],
    btn: "Approve all 6", making: "Making 6 changes in Amazon…", done: "Done in Amazon: 6 changes" },
  { id: "camp", ic: "🌱", title: "New exact campaign: 3 proven searches", why: "Already selling at 14% ACoS inside auto. Their own campaign, own budget, own bid.", value: 420, kind: "create", undo: false,
    items: [{ label: "“bamboo cutting board set”", detail: "11 orders · 12% ACoS", v: "$190" }, { label: "“large wooden cutting board”", detail: "7 orders · 15% ACoS", v: "$140" }, { label: "“cutting board with juice groove”", detail: "5 orders · 16% ACoS", v: "$90" }],
    btn: "Create campaign", making: "Creating the campaign in Amazon…", done: "Campaign live: SP | Cutting Board | Exact" },
  { id: "bud", ic: "💰", title: "Raise 2 budgets on profitable campaigns", why: "Out of money by 2 PM at 19% ACoS. Every afternoon is lost sales.", value: 510, kind: "auto", undo: true,
    items: [{ label: "SP | Cutting Board | Exact", detail: "$40 → $50/day", v: "$320" }, { label: "SP | Serving Tray | Phrase", detail: "$25 → $31/day", v: "$190" }],
    btn: "Approve both", making: "Making 2 changes in Amazon…", done: "Done in Amazon: 2 changes" },
  { id: "bid", ic: "📉", title: "Lower 4 bids that overspend", why: "Above your 30% target ACoS. −20% max per step.", value: 240, kind: "auto", undo: true,
    items: [{ label: "“bamboo board”", detail: "$1.42 → $1.14 · ACoS 48%", v: "$96" }, { label: "“kitchen board”", detail: "$1.10 → $0.92 · ACoS 41%", v: "$64" }],
    btn: "Approve all 4", making: "Making 4 changes in Amazon…", done: "Done in Amazon: 4 changes" },
  { id: "stock", ic: "🚚", title: "Restock 2 products before they run out", why: "Running out costs sales and ranking. I create the shipment plan in Amazon; you box it.", value: 0, kind: "restock", undo: false,
    items: [{ label: "Cutting Board Large", detail: "9 days of stock · 6.1/day", v: "365 units" }, { label: "Serving Tray", detail: "12 days of stock · 2.4/day", v: "145 units" }],
    btn: "Create shipment plan · 510 units", making: "Creating the shipment plan in Amazon…", done: "Plan created in Amazon: “Rocco restock Nov 24”" },
];

export const TERMS = [
  { term: "bamboo cutting board", clicks: 1284, spend: 1412, orders: 171, acos: 18.2, act: "Keep · on goal", tone: "ok" },
  { term: "bamboo cutting board set", clicks: 212, spend: 198, orders: 39, acos: 12.1, act: "Harvest to exact", tone: "win" },
  { term: "large wooden cutting board", clicks: 166, spend: 171, orders: 22, acos: 15.0, act: "Harvest to exact", tone: "win" },
  { term: "bamboo board", clicks: 402, spend: 571, orders: 26, acos: 48.3, act: "Bid $1.42 → $1.14", tone: "warn" },
  { term: "cutting board", clicks: 866, spend: 1039, orders: 88, acos: 29.4, act: "Keep · on goal", tone: "ok" },
  { term: "free cutting board", clicks: 38, spend: 41.2, orders: 0, acos: null, act: "Block", tone: "bad" },
  { term: "plastic cutting mat", clicks: 27, spend: 30.1, orders: 0, acos: null, act: "Block", tone: "bad" },
  { term: "b0c7xk2l1q", clicks: 21, spend: 26.9, orders: 0, acos: null, act: "Block (competitor page)", tone: "bad" },
];

export const LOG = [
  { code: "N3", what: "Blocked “plastic cutting board” (negative exact)", who: "Approved by Sam", when: "Nov 12", res: "Worked: saved $96 in 7 days, sales unchanged", tone: "win" },
  { code: "G1", what: "Budget $30 → $40/day on SP | Cutting Board | Exact", who: "Made automatically (inside guardrails)", when: "Nov 13", res: "Worked: +$412 sales at 18% ACoS", tone: "win" },
  { code: "B2", what: "Bid $0.95 → $1.10 on “serving tray bamboo”", who: "Approved by Priya", when: "Nov 14", res: "Made things worse (ACoS 41%): undone automatically", tone: "undo" },
  { code: "H1", what: "New exact campaign: 4 proven searches", who: "Approved by Sam", when: "Nov 15", res: "Flat so far: checking again Nov 29", tone: "flat" },
];

export const SAVED = { total: 3412, times: 15 };
