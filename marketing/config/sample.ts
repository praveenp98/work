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
    brief: "Two searches are burning money with no orders. Cut them before Black Friday.",
    jobs: [
      { icon: "✂️", title: "Block 6 searches that waste money", detail: "Clicks, no orders. “free cutting board”, “plastic mat” +4", value: "~$310/mo", amount: 310, button: "Approve all 6", pick: true },
      { icon: "🌱", title: "New exact campaign: 3 proven searches", detail: "Already selling at 14% ACoS. Own campaign, own budget.", value: "+$420/mo", amount: 420, button: "Create campaign", pick: false },
      { icon: "💰", title: "Raise 2 budgets on profitable campaigns", detail: "Out of budget by 2 PM at 19% ACoS.", value: "+$510/mo", amount: 510, button: "Approve all 2", pick: false },
      { icon: "🚚", title: "Restock 1 product before it runs out", detail: "Cutting Board Large: 11 days of stock left", value: "", amount: 0, button: "Show me how", pick: false },
    ],
  },

  roi: { saved: 1284, timesCost: 13 }, // "Rocco has saved you $1,284 · 13x what I cost"

  changeLog: [
    { icon: "✂️", title: "Blocked “free yoga mat”", detail: "Approved by Sam on iMessage · Nov 18", status: "✅ worked · $212/mo less wasted" },
    { icon: "📉", title: "Bid $1.20 → $0.95 on “bamboo sheets queen”", detail: "Approved on the dashboard · Nov 20", status: "⏳ checking Nov 27" },
    { icon: "🌱", title: "New exact campaign from 4 proven searches", detail: "Approved in Slack · Nov 21", status: "⏳ checking Nov 28" },
    { icon: "💰", title: "Budget $40 → $55 on “Sheets · Exact”", detail: "Undone by you · Nov 21", status: "↩️ reverted" },
  ],
  lessWastedMonthly: 212,

  beforeRocco: "Before Rocco: 214 changes in 90 days, 61% made by budget rules, no bid changed by hand since August. Starting with bids.",

  messages: [
    { from: "rocco", text: "☀️ Bamboo & Co: 4 jobs waiting, worth ~$1,240/mo. Approve them here: rocco.works/me" },
    { from: "you", text: "YES N1 G2" },
    { from: "rocco", text: "Done in Amazon ✅ N1, G2. I'll check the results in a week." },
  ],
} as const;

/** Dollar amounts that exist only in the sample account. A file that uses one must also say "sample account". */
export const SAMPLE_DOLLAR_AMOUNTS: readonly number[] = [1240, 1284, 212, 310, 420, 510, 1.2, 0.95, 40, 55];
