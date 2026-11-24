/**
 * The site's sample account, "Bamboo & Co". These numbers are made up for the demo and are the ONLY account
 * numbers a marketing asset may show. Every frame, image or page that shows any of them carries SAMPLE.label,
 * visibly. Source: components/home/HeroDashboard.tsx, components/home/LogDemo.tsx, app/page.tsx (as live on
 * rocco.works, Nov 22, 2026). Never mix in numbers from a real account.
 */
export const SAMPLE = {
  label: "Sample account",
  brand: "Bamboo & Co",
  marketplace: "US",

  morning: {
    checkedAt: "6:02 AM",
    jobsCount: 4,
    worthMonthly: 1240, // "4 jobs today, worth ~$1,240/mo"
    footOpen: "Sample account · nothing changes until you approve",
    brief: "Two searches are burning money with no orders. Cut them before Black Friday.",
    jobs: [
      { icon: "✂️", title: "Block 6 searches that waste money", detail: "Clicks, no orders. “free cutting board”, “plastic mat” +4", value: "~$310/mo", amount: 310, button: "Approve all 6", making: "Making 6 changes…", done: "✓ Done · 6 changes", changes: 6, pick: true },
      { icon: "🌱", title: "New exact campaign: 3 proven searches", detail: "Already selling at 14% ACoS. Own campaign, own budget.", value: "+$420/mo", amount: 420, button: "Create campaign", making: "Creating in Amazon…", done: "✓ Campaign live", changes: 1, pick: false },
      { icon: "💰", title: "Raise 2 budgets on profitable campaigns", detail: "Out of budget by 2 PM at 19% ACoS.", value: "+$510/mo", amount: 510, button: "Approve all 2", making: "Making 2 changes…", done: "✓ Done · 2 changes", changes: 2, pick: false },
      { icon: "🚚", title: "Restock 1 product before it runs out", detail: "Cutting Board Large: 11 days of stock left", value: "", amount: 0, button: "Show me how", making: "", done: "", changes: 0, pick: false },
    ],
  },

  roi: { saved: 1284, timesCost: 13 }, // "Rocco has saved you $1,284 · 13x what I cost"

  /** `wait` shows first; `done` (when set) is what it flips to. Same rows as components/home/LogDemo.tsx. */
  changeLog: [
    { icon: "✂️", title: "Blocked “free yoga mat”", detail: "Approved by Sam on iMessage · Nov 18", wait: "⏳ checking Nov 25", done: "✅ worked · $212/mo less wasted" },
    { icon: "📉", title: "Bid $1.20 → $0.95 on “bamboo sheets queen”", detail: "Approved on the dashboard · Nov 20", wait: "⏳ checking Nov 27", done: "" },
    { icon: "🌱", title: "New exact campaign from 4 proven searches", detail: "Approved in Slack · Nov 21", wait: "⏳ checking Nov 28", done: "" },
    { icon: "💰", title: "Budget $40 → $55 on “Sheets · Exact”", detail: "Undone by you · Nov 21", wait: "↩️ reverted", done: "" },
  ],
  lessWastedMonthly: 212,

  beforeRocco: "Before Rocco: 214 changes in 90 days, 61% made by budget rules, no bid changed by hand since August. Starting with bids.",

  /**
   * Tidy campaigns. The site has no public tidy demo, so these campaign names are illustrative (made up for the
   * sample account, no metrics). The naming system and the copy around it are the product's own
   * (components/dash/TidyClient.tsx): SP | Product | Targeting | Keyword, one portfolio per product.
   */
  tidy: {
    system: "SP | Product | Targeting | Keyword",
    product: "Cutting Board Large",
    rows: [
      { old: "Campaign 4 - copy (2)", next: "SP | Cutting Board Large | Exact | bamboo cutting board", tag: "Exact", tagClass: "exact" },
      { old: "CB large AUTO new", next: "SP | Cutting Board Large | Auto", tag: "Auto", tagClass: "auto" },
      { old: "test broad DO NOT PAUSE", next: "SP | Cutting Board Large | Broad | cutting board", tag: "Broad", tagClass: "broad" },
      { old: "Q4 push - phrase", next: "SP | Cutting Board Large | Phrase | wood cutting board", tag: "Phrase", tagClass: "phrase" },
    ],
  },

  messages: [
    { from: "rocco", text: "☀️ Bamboo & Co: 4 jobs waiting, worth ~$1,240/mo. Approve them here: rocco.works/me" },
    { from: "you", text: "YES N1 G2" },
    { from: "rocco", text: "Done in Amazon ✅ N1, G2. I'll check the results in a week." },
  ],
} as const;

/** Dollar amounts that exist only in the sample account. A file that uses one must also say "sample account". */
export const SAMPLE_DOLLAR_AMOUNTS: readonly number[] = [1240, 1284, 212, 310, 420, 510, 1.2, 0.95, 40, 55];
