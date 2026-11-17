/**
 * AEO answers: one question per page, the direct answer first (what AI answer engines and "People also ask" quote),
 * then steps, details and an FAQ. Rendered at /answers/[slug] with FAQPage + HowTo JSON-LD, listed in the
 * sitemap and llms.txt. Keep answers factual and conservative; say "check in Seller Central" over guessing.
 */
export interface Answer {
  slug: string;
  q: string; // the question, as people type or ask it
  short: string; // 40-70 word direct answer
  steps?: string[];
  details: string[];
  faq: { q: string; a: string }[];
  ask: string; // what to text Rocco about this
  topic: "AI & connectors" | "Ads" | "Listings" | "Inventory";
  updated: string;
}

export const ANSWERS: Answer[] = [
  {
    slug: "connect-amazon-seller-central-to-claude",
    topic: "AI & connectors",
    q: "How do I connect Amazon Seller Central to Claude?",
    short: "Add Amazon's official Selling Partner connector in Claude: Settings → Connectors → Browse connectors → search \"Amazon Selling Partner\" → Connect, then sign in to Seller Central. Claude can then read sales, traffic, inventory and listings, and asks you before any change. It's in beta and US stores come first.",
    steps: ["Open Claude (web or desktop) → Settings → Connectors.", "Click Browse connectors and search \"Amazon Selling Partner\".", "Click Connect and sign in with your Seller Central login (Amazon's own page; Claude never sees your password).", "In a new chat, turn the connector on from the tools menu and ask: \"How did my sales do last week?\"", "Optional: add Rocco (rocco.works/mcp/login) next to it so Claude knows what to pull, what to fix and what happened last time."],
    details: ["The connector is Amazon's, not a third-party scraper, so it follows Amazon's permissions: you approve each action it takes in your account.", "Ads data (search terms, bids, budgets) comes from a separate Amazon Ads connector, which needs Amazon Ads API access."],
    faq: [
      { q: "Is the Seller Central connector free?", a: "Amazon's connector is Amazon's product; you need a Claude plan that supports connectors. Rocco is free to add next to it." },
      { q: "Does it work outside the US?", a: "Amazon is rolling it out US stores first. Other marketplaces can still use Rocco with exported reports or by texting reports to Rocco." },
    ],
    ask: "how did my sales do last week?",
    updated: "2026-11-17",
  },
  {
    slug: "connect-amazon-ads-to-claude-chatgpt",
    topic: "AI & connectors",
    q: "How do I connect Amazon Ads to Claude or ChatGPT?",
    short: "Add Amazon's Ads MCP server as a custom connector: https://advertising-ai.amazon.com/mcp for North America (-eu or -fe for Europe and Far East). Sign in with your Amazon Ads account. It needs Amazon Ads API access; until that's approved, export reports or text them to Rocco instead.",
    steps: ["In Claude: Settings → Connectors → Add custom connector. In ChatGPT: Settings → Apps & Connectors → Advanced → Developer mode → Create.", "Paste your region's URL: advertising-ai.amazon.com/mcp (NA), advertising-ai-eu.amazon.com/mcp (EU, UK, India, Middle East), advertising-ai-fe.amazon.com/mcp (Japan, Australia, Singapore).", "Sign in with the Amazon Ads account that has API access.", "Ask: \"Rocco, morning check\" with Rocco connected, or \"show me search terms with spend and no sales\"."],
    details: ["Amazon's Ads connector can pull reports and apply changes. Rocco adds the judgment: which terms to negate, which to harvest, bid moves capped at ±20%, and a log that checks a week later whether each change worked."],
    faq: [
      { q: "What if I don't have Amazon Ads API access?", a: "Apply in the Amazon Ads developer console. Meanwhile download the search term report (Sponsored ads reports → Search term) and give it to Rocco in Claude or by text." },
      { q: "Can ChatGPT apply changes to my ads?", a: "Only through a connector that can write, and only what you approve. Rocco never changes your account on its own." },
    ],
    ask: "which search terms are wasting money?",
    updated: "2026-11-17",
  },
  {
    slug: "what-is-amazon-ads-mcp-server",
    topic: "AI & connectors",
    q: "What is the Amazon Ads MCP server?",
    short: "It's Amazon's official connector that lets AI apps like Claude and ChatGPT read and manage Amazon Ads through the Model Context Protocol (MCP). It's in open beta, uses your Amazon Ads login, and requires Amazon Ads API access. It gives the AI access; it doesn't decide what to change.",
    details: ["MCP is a standard way for AI apps to use outside tools. Amazon publishes two: Amazon Ads (advertising-ai.amazon.com/mcp) and Amazon Selling Partner for Seller Central.", "Access alone isn't strategy. Rocco is an MCP connector built to sit next to Amazon's: it tells the AI what to pull, finds the fixes, keeps a change log and grades each change a week later."],
    faq: [
      { q: "Is the Amazon Ads MCP server safe?", a: "It signs you in through Amazon, so the AI app never sees your password. Write actions should always be approved by you; Rocco only proposes coded changes you approve." },
      { q: "Do I need to code to use it?", a: "No. Paste the URL into your AI app's connector settings and sign in." },
    ],
    ask: "what would you change in my ads today?",
    updated: "2026-11-17",
  },
  {
    slug: "use-helium-10-with-claude",
    topic: "AI & connectors",
    q: "Can I use Helium 10 with Claude?",
    short: "Yes. Helium 10 has an official MCP connector (on its Diamond plan) that gives Claude its keyword and market data. Add it next to Amazon's connectors and Rocco: Rocco checks Helium 10 rank and search volume before cutting a keyword, and uses competitor keywords to fill listing gaps.",
    steps: ["Turn on the MCP connector in your Helium 10 account settings and add it in Claude.", "Add Amazon's Seller Central connector and Rocco (rocco.works/mcp/login).", "Ask: \"Rocco, morning check\". Rocco tells Claude when to use Helium 10 (rank checks, reverse-ASIN on top competitors)."],
    details: ["Helium 10 shows the market (search volume, rank, competitors). Amazon's connectors show your account. Rocco is the manager that decides what to do with both."],
    faq: [{ q: "Do I need Helium 10 to use Rocco?", a: "No. Rocco works with Amazon's connectors or exported reports alone. Helium 10 (or SellerSprite) adds market context when you have it." }],
    ask: "should I cut this keyword or keep it?",
    updated: "2026-11-17",
  },
  {
    slug: "can-ai-manage-amazon-ppc",
    topic: "AI & connectors",
    q: "Can AI manage my Amazon PPC?",
    short: "Yes, with guardrails. Today AI apps can pull your Amazon Ads data through Amazon's connectors, find wasted spend, and propose negatives, harvests, bid and budget changes. The safe setup: the AI proposes coded changes, you approve them, and every change is logged and checked a week later so bad moves get undone.",
    details: ["What AI does well: reading thousands of search terms daily, spotting money-burners early, and never forgetting what was changed and why.", "What you should keep: margin targets, brand terms you never negate, and the final yes. Rocco works exactly this way, from Claude, ChatGPT or iMessage."],
    faq: [{ q: "Will AI overspend my budget?", a: "Not if changes are capped and approved. Rocco caps bid moves at ±20% per step and never applies anything you didn't approve." }],
    ask: "run a morning check on my ads",
    updated: "2026-11-17",
  },
  {
    slug: "what-is-a-good-acos-on-amazon",
    topic: "Ads",
    q: "What is a good ACoS on Amazon?",
    short: "A good ACoS is below your breakeven ACoS, which equals your profit margin before ad spend. If you keep 35% after product cost, fees and shipping, any ACoS under 35% is profitable. Many brands target 20-30%; launches run higher on purpose, and mature hero products often run lower.",
    steps: ["Take your price, subtract product cost, Amazon fees and shipping: that's profit before ads.", "Divide by price: that's your breakeven ACoS.", "Set your target below it (for example breakeven minus 5-10 points) and judge campaigns against that, not an industry average."],
    details: ["ACoS = ad spend ÷ ad sales. It ignores organic sales your ads help create; TACoS (ad spend ÷ total sales) shows the whole-account picture."],
    faq: [
      { q: "Is 30% ACoS good?", a: "If your margin before ads is above 30%, yes, it's profitable. If your margin is 25%, 30% ACoS loses money on every ad sale." },
      { q: "Why is my ACoS high?", a: "Usually a few search terms spending with no sales, bids too high on broad or auto, or a listing that doesn't convert. See our guide: why is my ACoS so high." },
    ],
    ask: "what's my ACoS vs my breakeven?",
    updated: "2026-11-17",
  },
  {
    slug: "how-to-lower-acos-fast",
    topic: "Ads",
    q: "How do I lower my ACoS fast?",
    short: "Cut the waste first: add negative exact keywords for search terms with 10+ clicks and no sales, lower bids up to 20% on keywords above target, and move budget to campaigns that are profitable but run out of budget. Those three usually cut ACoS within a week without losing good sales.",
    steps: ["Download the search term report (last 30-60 days).", "Negate search terms with 10+ clicks and 0 orders (adjust to your conversion rate).", "Lower bids up to 20% on keywords above your target ACoS; raise up to 20% on winners well below it.", "Harvest converting search terms into exact-match keywords.", "Re-check in 7 days and undo anything that hurt sales."],
    details: ["Avoid cutting all broad and auto campaigns at once: they find new winners. Trim, don't stop."],
    faq: [{ q: "How long before ACoS drops?", a: "Negatives work from the next click. Expect a visible change within 7 days and a fair read after 2 weeks." }],
    ask: "how do I get my ACoS down this week?",
    updated: "2026-11-17",
  },
  {
    slug: "how-many-clicks-before-negating-a-keyword",
    topic: "Ads",
    q: "How many clicks before I add a negative keyword on Amazon?",
    short: "Negate a search term after it gets about 1.5 to 2 times the clicks you'd normally need for one sale, with zero orders. At a 10% conversion rate that's 15-20 clicks; at 5% it's 30-40. Rocco's default is 10 clicks with no orders, which you can raise per brand.",
    steps: ["Find your average conversion rate (orders ÷ clicks) for the campaign.", "Clicks needed for one sale ≈ 1 ÷ conversion rate.", "Negate terms with 1.5-2× that many clicks and no orders, as negative exact.", "Never negate brand terms or hero keywords: protect them."],
    details: ["Expensive clicks justify a lower threshold; cheap long-tail terms can be given more room."],
    faq: [{ q: "Negative exact or negative phrase?", a: "Start with negative exact on the specific search term. Use negative phrase only for a clearly irrelevant word (for example \"free\" or a competitor's brand)." }],
    ask: "which search terms should I negate?",
    updated: "2026-11-17",
  },
  {
    slug: "what-is-tacos-amazon",
    topic: "Ads",
    q: "What is TACoS on Amazon?",
    short: "TACoS (total advertising cost of sales) is ad spend divided by total sales, ads plus organic. It shows whether ads are growing the whole business. A falling TACoS while sales grow means ads are building organic rank; a rising TACoS means you're buying sales you'd otherwise lose.",
    details: ["Example: $1,000 ad spend, $4,000 ad sales and $10,000 total sales → ACoS 25%, TACoS 10%.", "Find total sales in the Business Report (Detail Page Sales and Traffic). Rocco computes TACoS automatically when it has both reports."],
    faq: [{ q: "What's a good TACoS?", a: "Commonly 5-15% for established brands; higher during launches. Watch the trend more than the number." }],
    ask: "what's my TACoS trend?",
    updated: "2026-11-17",
  },
  {
    slug: "amazon-top-of-search-placement-bid-adjustment",
    topic: "Ads",
    q: "Should I raise the Top of Search bid adjustment on Amazon?",
    short: "Raise it only if the placement report shows Top of Search converts better and has an ACoS below your target. Increase in steps (for example +20-50%), check a week later, and lower it on placements above breakeven. Amazon allows up to +900%, but big jumps usually just inflate CPC.",
    steps: ["Download the placement report (Sponsored Products → Placement, last 30 days).", "Compare ACoS and conversion for Top of Search, Rest of Search and Product Pages per campaign.", "Raise the adjustment where Top of Search beats your target; lower bids or adjustments where it's above breakeven."],
    details: ["If a hero keyword's organic rank is slipping, it can be worth keeping Top of Search spend even at a higher ACoS for a while."],
    faq: [{ q: "Why did my CPC double?", a: "A higher placement adjustment multiplies your bid for that placement. Check recent changes; Rocco keeps a log of every change for exactly this." }],
    ask: "should I change my top of search adjustments?",
    updated: "2026-11-17",
  },
  {
    slug: "how-to-fix-suppressed-listing-amazon",
    topic: "Listings",
    q: "How do I fix a suppressed listing on Amazon?",
    short: "Go to Seller Central → Inventory → Fix your products (or filter Manage All Inventory by \"Search Suppressed\"), open the listing and fix the reason Amazon shows: usually a main image without a pure white background, a missing required attribute, a title that's too long, or a price error. It reappears once Amazon re-checks it.",
    steps: ["Seller Central → Inventory → Fix your products (or Manage All Inventory → filter Search Suppressed).", "Open the listing and read the issue Amazon lists.", "Fix it (image, attribute, title length, price) and save.", "Pause ads on that SKU until it's live again: suppressed listings can't sell.", "Check back in 15 minutes to a few hours."],
    details: ["Rocco's morning text leads with \"🚨 listings not selling\" when it sees a suppressed or inactive listing, with Amazon's reason."],
    faq: [{ q: "How long does a suppressed listing take to come back?", a: "Usually minutes to a few hours after the fix; up to 24-48 hours for some catalog changes." }],
    ask: "are any of my listings suppressed?",
    updated: "2026-11-17",
  },
  {
    slug: "why-am-i-losing-the-buy-box",
    topic: "Listings",
    q: "Why am I losing the Buy Box on Amazon?",
    short: "Usually price (another seller is cheaper including shipping), fulfillment (they offer Prime/FBA and you don't), stock (you ran out or are low), or account metrics (late shipment, cancellations, order defects). Check the Featured Offer (Buy Box) % in the Business Report and the offer listing for the ASIN.",
    steps: ["Business Report → Detail Page Sales and Traffic by Child Item → Featured Offer (Buy Box) %.", "For ASINs under ~90%, open the offer listing and compare landed price and fulfillment.", "Check stock and your account health metrics.", "Lower ad spend on ASINs you don't hold the Buy Box for: ads there can pay for someone else's sale."],
    details: ["Rocco flags any ASIN with 100+ sessions and Buy Box under 90% in the morning text."],
    faq: [{ q: "Can I win the Buy Box without being the cheapest?", a: "Yes. Prime/FBA, strong metrics and being in stock often win at a slightly higher price." }],
    ask: "where am I losing the Buy Box?",
    updated: "2026-11-17",
  },
  {
    slug: "how-much-inventory-to-send-to-amazon-fba",
    topic: "Inventory",
    q: "How much inventory should I send to Amazon FBA?",
    short: "Send enough to cover daily sales through your restock lead time plus a safety buffer: units = daily sales × (lead time days + safety days) − (available + inbound). For example 12/day × (30 + 14) − 300 on hand = 228 units. Watch storage limits and send more before peaks.",
    steps: ["Daily sales = units sold last 30 days ÷ 30.", "Lead time = days from ordering to units being available at Amazon.", "Safety days = 14-21 (more before Q4).", "Units to send = daily × (lead + safety) − (available + inbound)."],
    details: ["Rocco reads the Restock Inventory report and texts you when a SKU has under 14 days of cover, and suggests lowering ad pressure on it until stock lands."],
    faq: [{ q: "What happens if I run out?", a: "You lose sales and organic rank, and ads on that SKU stop. It can take weeks to recover rank." }],
    ask: "what should I restock this week?",
    updated: "2026-11-17",
  },
  {
    slug: "amazon-search-term-report-where-to-find",
    topic: "Ads",
    q: "Where do I find the Amazon search term report?",
    short: "In Amazon Ads (advertising.amazon.com): Measurement & Reporting → Sponsored ads reports → Create report → Sponsored Products → Search term → Summary, last 30-60 days → Run report → Download. It lists every customer search that triggered your ads, with clicks, spend and sales.",
    steps: ["Amazon Ads console → Measurement & Reporting → Sponsored ads reports.", "Create report → Sponsored Products → Search term → Summary.", "Pick last 30-60 days and run it.", "Download the CSV/XLSX, then give it to Rocco (in Claude, on rocco.works, or texted)."],
    details: ["With Amazon's Ads connector in Claude, Rocco pulls the same data without downloads."],
    faq: [{ q: "Why are some search terms ASINs?", a: "Those are product-page placements: shoppers saw your ad on that product's page. Treat them like any search term." }],
    ask: "here's my search term report, what should I fix?",
    updated: "2026-11-17",
  },
];

export const answerBySlug = (s: string) => ANSWERS.find((a) => a.slug === s);
