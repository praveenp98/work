/** SEO/AEO guides. Body blocks render in app/guides/[slug]. `**bold**` is supported in text. */
export type Block = { h2: string } | { p: string } | { ul: string[] } | { ol: string[] };

export interface Guide {
  slug: string;
  title: string;
  description: string;
  tool: { slug: string; cta: string };
  updated: string;
  body: Block[];
  faq: { q: string; a: string }[];
}

export const GUIDES: Guide[] = [
  {
    slug: "amazon-negative-keywords",
    title: "How to find negative keywords on Amazon (the 10-click rule)",
    description: "A simple, safe method to find Amazon PPC negative keywords from your search term report: thresholds, match types, junk intent, and the mistakes that cut good traffic.",
    tool: { slug: "ad-roast", cta: "Find my negatives automatically" },
    updated: "2026-11-17",
    body: [
      { p: "Negative keywords stop your ads from showing for searches that don't buy. They are the fastest way to cut waste on Amazon, and most accounts are missing dozens of them." },
      { h2: "Step 1: pull the right report" },
      { p: "In Amazon Ads, open **Measurement & Reporting → Sponsored ads reports**, create a **Sponsored Products → Search term** report, time unit **Summary**, last **30–60 days**. Every row is a real search that triggered your ad." },
      { h2: "Step 2: apply the 10-click rule" },
      { p: "A search term with **10 or more clicks and zero orders** is a negative candidate. If your conversion rate is around 10%, you'd expect one order in 10 clicks; zero orders after 10 clicks is a strong signal." },
      { ul: ["Low conversion rate (under 5%) or price over $50: use 15–20 clicks instead.", "Obvious junk intent (free, how to, DIY, used, repair, manual): negate after 5–8 clicks.", "Product (ASIN) search terms starting with B0: use **negative product targeting**, not a negative keyword."] },
      { h2: "Step 3: choose the match type" },
      { p: "Use **negative exact** by default: it blocks just that search. Use **negative phrase** only when a junk word repeats across many terms (for example \"free\" or \"for dogs\" when you sell for cats)." },
      { h2: "Step 4: add it in the right place" },
      { p: "Add the negative in the **ad group where it spent money**. If the same term is your own exact keyword somewhere, don't negate it there: lower the bid or pause that keyword instead." },
      { h2: "Mistakes that cost sales" },
      { ul: ["Negating after 2–3 clicks: you'll cut terms that would have converted.", "Negating your brand or your own ASINs by accident.", "Never re-checking: new junk terms appear every week, especially in Q4."] },
    ],
    faq: [
      { q: "How many clicks before adding a negative keyword on Amazon?", a: "A safe default is 10 clicks with zero orders. Raise it to 15–20 for low conversion rates or high prices, and lower it to 5–8 for obvious junk intent." },
      { q: "Negative exact or negative phrase?", a: "Negative exact by default. Negative phrase only for a junk word that repeats across many search terms." },
      { q: "How often should I add negative keywords?", a: "Weekly in Q4, every two weeks the rest of the year." },
    ],
  },
  {
    slug: "amazon-black-friday-ppc-checklist-2026",
    title: "Amazon Black Friday PPC checklist 2026",
    description: "A day-by-day Amazon PPC checklist for Black Friday (Nov 27, 2026) and Cyber Monday (Nov 30): what to do before, during and after peak week.",
    tool: { slug: "bfcm-surge-plan", cta: "Build my day-by-day surge plan" },
    updated: "2026-11-17",
    body: [
      { p: "Black Friday is **Friday, November 27, 2026** and Cyber Monday is **November 30**. Traffic and conversion rates rise, CPCs rise with them. The sellers who win aren't the ones who spend the most; they're the ones who spend it on the right search terms." },
      { h2: "Before (Nov 17–25)" },
      { ol: ["Run a search term audit and add negatives for terms with clicks and no orders.", "Harvest converting search terms from auto and broad into exact campaigns so winners have their own budget.", "Check stock: no budget increases on SKUs with under 21 days of cover.", "Confirm coupons and deals clear your breakeven after all fees.", "Set peak-day budgets the night before, not on the morning of."] },
      { h2: "During (Nov 26–30)" },
      { ol: ["Raise bids only on proven winners, max +20% per step.", "Check budgets 3–4 times on Black Friday and Cyber Monday. Out of budget by noon = no evening sales.", "Tolerate ACoS up to breakeven on winners on peak days only.", "Cut anything with 10+ clicks today and no orders."] },
      { h2: "After (Dec 1–5)" },
      { ol: ["Pull bids back toward normal.", "Run a post-mortem audit on the peak week: what you spent, what sold, what leaked.", "Keep winners funded through mid-December for gifting traffic."] },
    ],
    faq: [
      { q: "When is Black Friday 2026?", a: "Friday, November 27, 2026. Cyber Monday is November 30." },
      { q: "How much should I raise my Amazon ad budget for Black Friday?", a: "Many sellers roughly double their daily budget on Black Friday and Cyber Monday, with smaller steps the week before. Scale it to your margin and stock." },
    ],
  },
  {
    slug: "why-is-my-acos-so-high",
    title: "Why is my ACoS so high? 7 causes and fixes",
    description: "The seven most common reasons Amazon ACoS is high, how to spot each one in your search term report, and what to change.",
    tool: { slug: "ad-roast", cta: "Diagnose my ACoS free" },
    updated: "2026-11-17",
    body: [
      { p: "High ACoS means you spend a lot of ad money per dollar of ad sales. It's almost always a few specific problems, not \"Amazon is expensive\"." },
      { h2: "The 7 usual causes" },
      { ol: ["**Search terms with clicks and no sales.** Fix: negative exact after ~10 clicks.", "**Junk intent** (free, how to, used). Fix: negate early.", "**Broad and auto campaigns with no negatives.** Fix: weekly search term review.", "**Bids above what your margin allows.** Fix: new bid = bid × target ÷ actual ACoS, max ±20% per step.", "**Winners stuck in auto campaigns** competing with junk for budget. Fix: harvest them into exact.", "**Weak listing** (price, reviews, images) so clicks don't convert. Fix the listing before raising bids.", "**Peak-season CPCs** in November and December. Fix: raise bids only on proven winners."] },
      { h2: "Is your ACoS actually too high?" },
      { p: "Compare it to your **breakeven ACoS**: (price − fees − product cost) ÷ price. Above breakeven, every ad sale loses money. Below target, you may have room to grow." },
    ],
    faq: [
      { q: "What is a good ACoS on Amazon?", a: "One below your breakeven ACoS, and near your target for profit campaigns. It depends entirely on your margin." },
      { q: "Why did my ACoS go up in November?", a: "CPCs rise with Black Friday competition. Check whether profit dropped, not just ACoS, and avoid raising bids on unproven terms." },
    ],
  },
  {
    slug: "how-to-read-amazon-search-term-report",
    title: "How to read your Amazon search term report",
    description: "What every column in the Amazon Sponsored Products search term report means, which ones matter, and what to do with them.",
    tool: { slug: "ad-roast", cta: "Let Rocco read it for me" },
    updated: "2026-11-17",
    body: [
      { p: "The search term report shows the actual searches shoppers typed before clicking your ad. It's the single most useful report in Amazon Ads." },
      { h2: "How to download it" },
      { p: "Amazon Ads → **Measurement & Reporting → Sponsored ads reports → Create report** → Sponsored Products → **Search term** → Summary → last 30–60 days." },
      { h2: "The columns that matter" },
      { ul: ["**Targeting**: the keyword or target you bid on.", "**Match type**: exact, phrase, broad, or \"-\" for auto and product targets.", "**Customer search term**: what the shopper actually typed. This is the gold.", "**Clicks / Spend**: how much traffic and money it took.", "**7 Day Total Sales / Orders**: what it earned within 7 days of the click.", "**ACoS**: spend ÷ sales."] },
      { h2: "Three questions to ask every row" },
      { ol: ["Clicks with no orders? → negative.", "Orders at good ACoS but not your exact keyword yet? → harvest.", "Sells, but ACoS way above target? → lower the bid."] },
    ],
    faq: [
      { q: "What's the difference between targeting and customer search term?", a: "Targeting is what you bid on. Customer search term is what the shopper typed. One keyword can match hundreds of searches." },
      { q: "How far back should the report go?", a: "30–60 days gives enough clicks to judge without mixing in old seasons." },
    ],
  },
  {
    slug: "amazon-coupons-black-friday",
    title: "Amazon coupons for Black Friday: the margin math nobody does",
    description: "How Amazon coupons affect your real profit per unit after referral, FBA and coupon fees, and how to pick a discount that doesn't lose money.",
    tool: { slug: "coupon-calculator", cta: "Check my coupon margin" },
    updated: "2026-11-17",
    body: [
      { p: "A coupon badge can lift click-through rate in search. But a 20% coupon usually cuts profit per unit by far more than 20%, because fixed costs don't shrink." },
      { h2: "What shrinks and what doesn't" },
      { ul: ["**Shrinks with the discount:** referral fee and percentage-based coupon fees (charged on the discounted price).", "**Doesn't shrink:** product cost, FBA fee, ad cost per unit, fixed coupon fees."] },
      { h2: "A quick example" },
      { p: "A $40 product with $10 cost, 15% referral and a $6 FBA fee makes about $18 before ads. A 20% coupon drops the price to $32: referral falls to $4.80, but product and FBA costs stay. Profit falls to roughly $11 before ads and coupon fees: a 20% discount cut profit by about 40%." },
      { h2: "How to choose the discount" },
      { ol: ["Find the deepest discount where profit per unit is still positive, with ad costs included.", "Stay well above it in peak week, when CPCs rise.", "Ask how many extra units the coupon must sell to earn what full price would. If that lift is unrealistic, go smaller."] },
      { p: "Amazon's coupon fee structure has changed over time. Check the current fees in Seller Central before you run the numbers." },
    ],
    faq: [
      { q: "Is the Amazon referral fee charged before or after the coupon?", a: "On the price the customer pays, after the coupon." },
      { q: "What's the best coupon size for Black Friday?", a: "The biggest one that still leaves a healthy profit per unit after all fees and ad costs. For many products that's 10–20%, not 30%+." },
    ],
  },
  {
    slug: "breakeven-acos-vs-target-acos",
    title: "Breakeven ACoS vs target ACoS (with examples)",
    description: "What breakeven ACoS and target ACoS mean, how to calculate both, and how to use them to set Amazon bids.",
    tool: { slug: "breakeven-acos", cta: "Calculate mine" },
    updated: "2026-11-17",
    body: [
      { p: "**Breakeven ACoS** is the ACoS at which an ad sale makes exactly zero profit. **Target ACoS** is the ACoS that keeps the profit you actually want." },
      { h2: "Formulas" },
      { ul: ["Breakeven ACoS = (price − referral fee − FBA fee − product cost − other costs) ÷ price", "Target ACoS = breakeven ACoS − the profit margin you want to keep", "Max CPC = price × ACoS × conversion rate"] },
      { h2: "Example" },
      { p: "Price $30, referral $4.50, FBA $5.50, product cost $7.00 → profit before ads $13 → breakeven ACoS ≈ 43%. Want to keep 10%? Target ≈ 33%. At a 10% conversion rate, max CPC at target ≈ $1.00." },
      { h2: "How to use them" },
      { ul: ["Search terms above breakeven lose money on every sale: lower bids or negate.", "Terms under target with room to grow: raise bids carefully (max +20% per step).", "Launch campaigns can run above target on purpose, for a limited time."] },
    ],
    faq: [{ q: "Should my target ACoS be the same for every product?", a: "No. Each product has its own margin, so each has its own breakeven and target." }],
  },
  {
    slug: "amazon-ppc-bid-optimization-formula",
    title: "The Amazon PPC bid formula (and the ±20% rule)",
    description: "A simple, safe bid optimization formula for Amazon Sponsored Products, with caps that stop bids from swinging wildly.",
    tool: { slug: "ad-roast", cta: "Get my bid changes" },
    updated: "2026-11-17",
    body: [
      { h2: "The formula" },
      { p: "**New bid = current bid × (target ACoS ÷ actual ACoS)**, capped at **±20%** per change." },
      { ul: ["Actual ACoS 60%, target 30% → formula says −50% → capped at −20%.", "Actual ACoS 15%, target 30% → formula says +100% → capped at +20%.", "Zero orders after 10+ clicks → −20%, or negate the search term."] },
      { h2: "Why cap it?" },
      { p: "Amazon's auction is noisy. One good or bad week can make a target look better or worse than it is. Stepping 20% at a time, re-checking after 7 days, and stepping again gets you to the right bid without overshooting." },
      { h2: "When not to touch a bid" },
      { ul: ["Fewer clicks than your threshold: not enough data.", "Change under 5%: noise.", "Out-of-stock or suppressed products: fix the listing first."] },
    ],
    faq: [{ q: "How often should I change Amazon bids?", a: "Weekly for active campaigns, after at least 7 days of data since the last change. More often during Black Friday week." }],
  },
  {
    slug: "amazon-keyword-harvesting",
    title: "Keyword harvesting: move winners out of auto campaigns",
    description: "How to find converting search terms in Amazon auto, broad and phrase campaigns, and move them into exact match without cannibalizing yourself.",
    tool: { slug: "ad-roast", cta: "Find my hidden winners" },
    updated: "2026-11-17",
    body: [
      { p: "Auto and broad campaigns are discovery tools. When they find a search term that sells, it should get its own exact-match keyword, its own bid and its own budget." },
      { h2: "The rule" },
      { p: "Harvest a search term when it has **2+ orders** at **ACoS under your target** and isn't already an exact keyword." },
      { h2: "How to do it" },
      { ol: ["Add the term as an **exact** keyword in a manual exact campaign (or a product target if it's an ASIN).", "Start the bid at roughly its average CPC × 1.1.", "Add the same term as a **negative exact** in the auto/broad ad group it came from, so the two don't compete."] },
      { h2: "Why it matters in Q4" },
      { p: "Winners stuck in auto campaigns share budget with junk. On Black Friday, that budget can run out early and your best search term stops showing." },
    ],
    faq: [{ q: "Should I negate the harvested term in the auto campaign?", a: "Yes, as negative exact in the source ad group, so your exact campaign gets that traffic at the bid you chose." }],
  },
  {
    slug: "amazon-ads-bulk-file-upload",
    title: "How to upload an Amazon Ads bulk file (step by step)",
    description: "How Amazon Ads bulk operations work: download your bulk file, add changes, upload, and check errors. Safe for beginners.",
    tool: { slug: "ad-roast", cta: "Get an upload-ready bulk file" },
    updated: "2026-11-17",
    body: [
      { p: "Bulk operations let you change hundreds of keywords, negatives and bids with one spreadsheet instead of clicking through every campaign." },
      { h2: "Steps" },
      { ol: ["Amazon Ads → **Bulk operations** → create and download a spreadsheet for your Sponsored Products campaigns (last 30–60 days).", "Each row is an entity (campaign, ad group, keyword, negative keyword, product target) with IDs.", "To change something, set **Operation** to Update (or Create for new negatives/keywords) and edit the value, for example the Bid.", "Upload the file in Bulk operations and wait for processing.", "Download the results file and fix any rows with errors."] },
      { h2: "Safety tips" },
      { ul: ["Keep a copy of the original file so you can undo changes.", "Upload a small batch first.", "Never change bids by more than 20% in one go."] },
      { p: "Rather skip spreadsheets? Rocco connects to Amazon Ads directly and makes the changes you approve for you, one tap per job, with every change logged and undoable." },
    ],
    faq: [{ q: "Can a bulk upload break my campaigns?", a: "It can make many changes at once, so review every row and keep the original file. Errors are reported per row and those rows are skipped." }],
  },
  {
    slug: "amazon-ads-mcp-claude-chatgpt",
    title: "Amazon Ads in Claude and ChatGPT: MCP connectors explained",
    description: "What Amazon's Ads MCP server does, who can use it, what it can't do, and the guardrails to insist on before AI touches your ads.",
    tool: { slug: "ad-roast", cta: "Try the roast on the web" },
    updated: "2026-11-17",
    body: [
      { p: "MCP (Model Context Protocol) lets AI assistants like Claude and ChatGPT use outside tools. Amazon launched an Ads MCP server in open beta in early 2026, so AI can pull Amazon Ads data and make changes." },
      { h2: "The catch" },
      { p: "Amazon's connector works through the **Amazon Ads API**, so you need API access. Many small sellers and freelancers don't have it. And even with it, the connector gives your AI **access**, not **judgment**: it can change a bid, but it doesn't know which bid should change, by how much, or what's safe." },
      { h2: "Two ways to use AI on Amazon ads" },
      { ul: ["**Do it yourself in Claude or ChatGPT:** with Ads API access, add Amazon's connector, then ask the right questions every day and decide each change yourself.", "**Hire an AI manager:** Rocco connects to Seller Central and Amazon Ads directly (no API approval, no connector setup), checks the account daily, lists today's jobs, makes the ones you approve in Amazon and checks each a week later."] },
      { h2: "Guardrails to insist on" },
      { ul: ["Nothing changes without your explicit approval of a specific list.", "Bid moves capped at ±20% per step.", "A change log so every change can be undone."] },
    ],
    faq: [
      { q: "Do I need Amazon Ads API access to use AI on my ads?", a: "For Amazon's own connector in Claude or ChatGPT, yes. Rocco doesn't need it: you sign in to Amazon Ads once and Rocco connects through an approved Amazon partner." },
      { q: "Is it safe to let AI change my Amazon ads?", a: "Only with approval steps, caps and a change log. Never give an AI blanket permission to change bids and budgets." },
    ],
  },
];

export const guideBySlug = (s: string) => GUIDES.find((g) => g.slug === s);
