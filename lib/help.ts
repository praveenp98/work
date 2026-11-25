import { PLAN, PRICE } from "./pricing";

/**
 * Help center (/help): one article per question customers actually ask (docs/SUPPORT.md lists the predicted tickets).
 * Plain, exact steps. Server-rendered with FAQPage JSON-LD, listed in the sitemap, llms.txt and /llms-full.txt so
 * Claude, ChatGPT, Perplexity and Google can read and quote them. Update when a flow changes.
 */
export interface HelpArticle {
  slug: string;
  section: "Getting started" | "Daily work" | "Team & reminders" | "Billing" | "Trust & safety" | "Troubleshooting";
  q: string;
  short: string; // the direct answer, 1-3 sentences
  steps?: string[];
  more?: string[];
  updated: string;
}

const U = "2026-11-22";
const G = PLAN.guaranteeDays;

export const HELP: HelpArticle[] = [
  // Getting started
  {
    slug: "what-happens-after-i-pay", section: "Getting started", updated: U,
    q: "What happens after I hire Rocco?",
    short: "You land on your Rocco page and connect Amazon (about 2 minutes). Rocco starts reading right away; your first jobs usually show up within a few hours, sometimes minutes.",
    steps: ["Pay on the secure Dodo checkout (yearly or monthly).", "You're sent back to your Rocco page. Tap Connect Amazon.", "Sign in to Seller Central (Amazon's own page), then pick your Amazon Ads account on the second step.", "Wait on the page: it opens today's jobs by itself when the first data is in."],
    more: ["Amazon keeps sending older history for a day or two in the background. Rocco only needs the last 30 days to start.", "Bookmark your Rocco page, or sign in with Google at rocco.works any time to get back to it."],
  },
  {
    slug: "connect-amazon", section: "Getting started", updated: U,
    q: "How do I connect Seller Central and Amazon Ads?",
    short: "Tap Connect Amazon on your Rocco page and sign in on Amazon's own page with the Seller Central primary user (or a user with all permissions), then choose your Amazon Ads account. Rocco never sees your password.",
    steps: ["Open your Rocco page and tap Connect Amazon.", "Choose your marketplace and sign in to Seller Central as the primary user (or a user with full permissions).", "On the second step, sign in to Amazon Ads and pick the advertising account for that brand.", "You come back to Rocco automatically. That's it."],
    more: ["The connection runs through DataDoe, an Amazon-approved data partner. Rocco reads reports through it and makes only the changes you approve.", "Several brands or marketplaces? Use \"+ Connect another Amazon account\" at the bottom of your dashboard. Each one gets its own tab."],
  },
  {
    slug: "skip-amazon-ads", section: "Getting started", updated: U,
    q: "Do I need to connect Amazon Ads?",
    short: "Seller Central alone gives you restock, listing and Buy Box jobs. The ad jobs (blocking wasted searches, bids, budgets, new exact campaigns) need Amazon Ads. Skipped it? Tap \"Connect Amazon Ads\" next to the account on your Rocco page any time.",
  },
  {
    slug: "first-jobs-not-showing", section: "Troubleshooting", updated: U,
    q: "I connected Amazon but don't see any jobs yet",
    short: "Amazon sends the first reports in batches, so it can take a few hours after connecting. Your Rocco page keeps checking and opens your jobs by itself; you can also tap Check now (once an hour).",
    steps: ["Keep the Rocco page open, or come back later: it refreshes when data lands.", "Tap Check now to ask for the latest reports (once an hour).", "Still nothing after 24 hours? Make sure you connected Amazon Ads too (step two of Connect). Without Ads, there are no ad jobs.", "Then email human@rocco.works with your brand name."],
  },
  {
    slug: "connect-errors", section: "Troubleshooting", updated: U,
    q: "Amazon sign-in failed or said I don't have permission",
    short: "Sign in as the Seller Central primary user, or a user with all permissions, and pick the Amazon Ads account on the second step. If you closed the window early, nothing changed: tap Connect Amazon again for a fresh link.",
    steps: ["\"Doesn't have full permissions\": ask the account owner to connect, or give your user all permissions in Seller Central → Settings → User Permissions.", "\"Link was already used or expired\": tap Connect Amazon for a new one. Links are single use.", "\"Ads didn't connect\": tap Connect Amazon again and choose your Ads account on the second step.", "\"Already connected to another Rocco\": that account belongs to a different team. Email human@rocco.works from the owner's email and we'll move it."],
  },
  // Daily work
  {
    slug: "what-approve-does", section: "Daily work", updated: U,
    q: "What happens when I tap Approve?",
    short: "Rocco checks the change with Amazon first (a dry run), then makes it in your account, logs it in your change log, and measures the result a week later. Nothing changes until you approve.",
    steps: ["Tap Approve on a job (or Approve all).", "Rocco dry-runs each change with Amazon. If Amazon would reject it, nothing is sent and you see why.", "The change is made and logged with who approved it.", "About a week later the change log shows whether it worked, using your real numbers."],
    more: ["What Rocco can change: negative keywords, bids, daily budgets, new exact-match campaigns from proven searches, campaign names, portfolios and pausing idle campaigns.", "What Rocco only flags with exact steps: restock, listing problems and lost Buy Box. You do those in Seller Central."],
  },
  {
    slug: "undo-a-change", section: "Daily work", updated: U,
    q: "How do I undo a change Rocco made?",
    short: "Every change is in your change log with the old value. Tidy changes have an Undo button on the Tidy page. For a bid, budget or negative, change it back in Amazon Ads (the old value is in the log) or email human@rocco.works and we'll reverse it.",
  },
  {
    slug: "skip-a-fix", section: "Daily work", updated: U,
    q: "What does Skip do, and why does Rocco ask why?",
    short: "Skip hides the fix and asks one tap: already done, not my strategy, too risky, numbers look off, or not now. Rocco learns from it: say \"not my strategy\" twice for a kind of fix and it stops suggesting it.",
  },
  {
    slug: "how-results-are-measured", section: "Daily work", updated: U,
    q: "How does Rocco measure if a change worked?",
    short: "About a week after a change, Rocco compares the same target's numbers before and after (spend, sales, ACoS, clicks) from your own reports, and marks it worked, no effect, worse, or needs more data. Estimates are labeled as estimates until they're measured.",
  },
  {
    slug: "tidy-campaigns", section: "Daily work", updated: U,
    q: "What does Tidy your campaigns do?",
    short: "It scans your campaigns and proposes one naming system (SP | Product | Targeting | Keyword), one portfolio per product, and pausing campaigns with no impressions in 30 days. You preview every change, pick what to apply, and can undo it.",
  },
  {
    slug: "change-log", section: "Daily work", updated: U,
    q: "Where can I see everything Rocco changed?",
    short: "Your change log (dashboard → Change log) lists every change: what, when, who approved it and where, and the result a week later. \"Before Rocco\" shows what was changed in your ads before you hired Rocco, from Amazon's own history.",
  },
  {
    slug: "what-rocco-does-not-do", section: "Daily work", updated: U,
    q: "What doesn't Rocco do?",
    short: "Rocco doesn't edit listings, images, A+ content or prices, run coupons or deals, or change Sponsored Brands or Display campaigns. For restock it creates the FBA shipment plan in Amazon; you box and ship. For those it tells you exactly what to do in Seller Central. Ask Rocco only answers questions about your Amazon business.",
  },
  {
    slug: "autonomy", section: "Daily work", updated: "2026-11-24",
    q: "Can Rocco make changes without me approving each one?",
    short: "Only if you choose it. Dashboard → How much I do on my own: 1) Approve every move (default), 2) Inside guardrails: Rocco makes money-saving changes himself each morning (blocks wasted searches, lowers bids, cuts losing budgets), 3) Fully autonomous: every one-tap change, raises too. New campaigns and restock always wait for you.",
    steps: ["Open your Rocco → Goals card → How much I do on my own.", "Pick a level and tap Save goals.", "Each morning's message says what was made on its own; every change is in the change log with one-tap undo."],
    more: ["Guardrails always apply: bids move at most ±20% per step, at most 25 automatic changes a day, things your team skipped twice never auto-apply.", "Switch back to Approve every move anytime."],
  },
  {
    slug: "undo-a-change", section: "Daily work", updated: "2026-11-24",
    q: "How do I undo a change Rocco made?",
    short: "Change log → ↩ Undo on the change. Bids and budgets go back to their old value in Amazon right away. Negatives and new campaigns show exact steps to reverse them by hand. You can also tick \"Undo automatically if it got worse\" in the Goals card.",
    steps: ["Open your Rocco → Change log.", "Tap ↩ Undo next to the change and confirm."],
    more: ["Automatic undo runs after the 7-day check, only for changes that made things worse, and says so in the log."],
  },
  {
    slug: "which-ai", section: "Trust & safety", updated: "2026-11-24",
    q: "Which AI does Rocco use?",
    short: "Anthropic's Claude Opus 5.5. It reads your account's numbers, ranks today's jobs and writes the reason for each, answers your questions on the dashboard, iMessage, WhatsApp and Slack, and reads screenshots you send. The money math (bid limits, break-even, budget caps, restock quantities) runs on fixed, tested rules, so the AI never invents a number, and changes only happen when you approve them (or inside the autopilot level you chose). It's on every plan; no AI subscription of your own needed.",
    more: ["Rocco only answers Amazon questions (it's scoped to your account and Amazon selling).", "Your data is sent to the model only to answer you and rank your jobs; it isn't used to train models (Anthropic's API terms)."],
  },
  {
    slug: "profit-per-product", section: "Daily work", updated: "2026-11-25",
    q: "How does Rocco show profit per product?",
    short: "Your Rocco page → Products & profit. For each product over the last 30 days: sales, units, Amazon fees, ad spend, your product cost, profit, margin and break-even ACoS. Profit comes from Amazon via DataDoe with fees, refunds and ad spend already netted. Add your cost per unit once (and inbound shipping per unit if you like); Rocco applies it back 6 months.",
    steps: ["Open Products & profit from your Rocco page.", "Products marked 'before cost' need a cost: type the cost per unit (and shipping per unit) and tap Save product costs.", "Profit updates with the next data pull (tomorrow morning, or Check connection now)."],
    more: ["Break-even ACoS = margin before ads. Bids and budgets above it lose money on every sale.", "Profit counts shipped orders, so the last day or two fill in as orders ship."],
  },
  {
    slug: "listing-changes", section: "Daily work", updated: "2026-11-25",
    q: "Can Rocco change my listings and A+ content?",
    short: "Yes, with your approval, from Products & profit → Listing. Rocco adds words from searches that already sell to your backend search terms, lets you edit the title and bullets with suggestions, fixes the issues Amazon flags on a listing, and drafts text-only A+ content you edit and send for Amazon's review. Amazon checks every change before it goes live, and title, bullet and keyword changes can be undone in one tap.",
    steps: ["Products & profit → Listing → next to a product.", "Backend search terms: review the before/after, then Update search terms in Amazon.", "Title and bullets: edit the text (Rocco shows which selling words are missing), then Save. Change one thing at a time on your best sellers and give it two weeks.", "A+: Draft A+ with Rocco, edit every word, Send to Amazon for review (usually within 7 days)."],
    more: ["Needs DataDoe's Listings and A+ actions switched on and the account connected with read & write access.", "A+ needs Brand Registry; Rocco never replaces A+ you already have and keeps to text (add images in Seller Central).", "Attribute fixes for listing issues can't be undone automatically; Amazon validates the value first."],
  },
  {
    slug: "set-your-strategy", section: "Daily work", updated: "2026-11-24",
    q: "How do I tell Rocco my strategy?",
    short: "Right after you connect Amazon (while the first data loads), Rocco asks for your strategy: what matters most (profit, balance or growth), target ACoS, margin before ads (sets break-even), a monthly ad budget limit, what never to cut, products with a different goal, how much Rocco does on its own, and anything it should know. It says the plan back in plain English, and every job follows it.",
    steps: ["On your Rocco page, find \"You set the strategy. I do the work.\" (or \"Set my strategy\" on the dashboard).", "Pick the main goal; the target ACoS fills in (change it if you like).", "Optional: margin, budget limit, never-cut words (brand name, brand-defense or launch campaigns), product exceptions, notes.", "Tap Set my strategy. Your plan shows on the dashboard; tap Edit any time."],
    more: ["Budget limit: Rocco won't propose budget raises that push total daily budgets past it, even for winners. It tells you instead.", "Never cut: searches and campaigns containing these words are never blocked or cut.", "Your notes are read by Rocco before every answer, in the app and by text."],
  },
  {
    slug: "goals-per-product", section: "Daily work", updated: "2026-11-24",
    q: "Can I set different goals for different products?",
    short: "Yes. Goals card → Goal per product: pick a word from the product's campaign names and choose Profit (target ACoS −20%), Balance, or Growth (+30%, to buy rank). Rocco's bids, harvests, budgets and result checks follow it.",
    more: ["Tip: Tidy your campaigns first so every campaign name contains the product."],
  },
  {
    slug: "budget-alerts", section: "Daily work", updated: "2026-11-24",
    q: "What's the midday budget alert?",
    short: "Around 1 PM in your marketplace, if a profitable campaign is on pace to run out of budget hours before midnight, Rocco messages your team (iMessage, WhatsApp or Slack) with the campaign, spend so far, when it runs dry and its ACoS. One message per account per day, only if reminders are on.",
  },
  // Team & reminders
  {
    slug: "add-teammates", section: "Team & reminders", updated: U,
    q: "How do I add my team or hand Rocco to someone else?",
    short: "Dashboard → Your team → type their email → Add, and send them the message shown. They sign in with Google using that email and land on the same Rocco. To hand over: once they've signed in, tap Make owner.",
    steps: ["Owner: add the teammate's email in Your team.", "Teammate: rocco.works → Sign in → Google with that email.", "Hand over: tap Make owner next to them. You stay on as a member (and can leave).", "Remove someone: tap Remove. Rocco also makes a new private link so their copy stops working."],
    more: ["Members see and approve jobs, ask Rocco, and see the change log. Only the owner manages people.", "Billing stays on the card that paid."],
  },
  {
    slug: "reminders-and-approve-by-text", section: "Team & reminders", updated: U,
    q: "How do reminders on iMessage, WhatsApp or Slack work?",
    short: "Pick where (iMessage, WhatsApp or Slack), how often (mornings with work, or Mondays) and what the message says: a one-line nudge to come look (recommended), today's top 3 jobs, or approve by text. No work that day means no message.",
    steps: ["On your Rocco page, open \"Ping me\" (or \"Nudge me when there's work\").", "Choose where, how often and what the message says. A live preview shows the exact message.", "Tap Save & connect and send the first message from your phone (iMessage/WhatsApp), or add Rocco to Slack.", "Approve by text unlocks after you've reviewed your jobs on the site once, so you never approve something you haven't seen."],
    more: ["Turn reminders off any time on your Rocco page, or reply STOP."],
  },
  {
    slug: "ask-rocco-by-text", section: "Team & reminders", updated: U,
    q: "Can I text Rocco questions on iMessage, WhatsApp or Slack?",
    short: "Yes. Text Rocco like you'd text your Amazon manager: \"why did sales drop yesterday?\", \"is the 3-pack about to stock out?\", \"what's wasting money in Kitchen – Exact?\". Rocco answers in seconds from your connected account's real numbers, reads screenshots you send, and when a fix fits, gives you its code so you can reply YES.",
    steps: ["Connect once: on your Rocco page open \"Ping me\", pick iMessage or WhatsApp and send the first message from your phone, or tap Add to Slack.", "Ask anything about your Amazon account in plain words. In Slack, @Rocco in a channel or DM Rocco.", "Send a screenshot of Seller Central, Amazon Ads or another tool and Rocco reads the numbers off it.", "To approve a suggested fix, reply YES and its code (e.g. YES G1). Rocco makes the change in Amazon and checks it a week later."],
    more: ["Rocco only answers Amazon questions and never invents numbers: if the data isn't connected yet, it says what it needs.", "A chat reply never changes your account by itself. Only a YES with a code does, and only once approve by text is on.", "Everyone on your team can text Rocco; every approval is logged with who sent it."],
  },
  // Billing
  {
    slug: "plans-and-pricing", section: "Billing", updated: U,
    q: "How much does Rocco cost?",
    short: `${PRICE.line} One plan covers your whole team and 3 Amazon accounts (each marketplace counts as one); each extra account is +$49 a month.`,
    more: ["The price is flat: the same for every team, whatever you spend on ads."],
  },
  {
    slug: "refund", section: "Billing", updated: U,
    q: "How do I get a refund?",
    short: `${G}-day money-back guarantee: if you don't like the fixes Rocco gives you in your first ${G} days, email human@rocco.works from the email you paid with and you get a full refund. No call, no forms.`,
    more: [`Why ${G} days: Rocco measures each change about a week after it is made, so you see at least one measured result before you decide.`],
  },
  {
    slug: "cancel", section: "Billing", updated: U,
    q: "How do I cancel?",
    short: "Use the link in your Dodo receipt email, or email human@rocco.works from the email you paid with. You won't be charged again and Rocco keeps working until the end of the period you paid for.",
  },
  {
    slug: "invoice", section: "Billing", updated: U,
    q: "Where's my invoice or receipt?",
    short: "Dodo Payments emails a receipt after every payment, with an invoice you can download. Need it with a company name or tax ID? Reply to that email or write to human@rocco.works.",
  },
  // Trust & safety
  {
    slug: "is-it-safe", section: "Trust & safety", updated: U,
    q: "Is it safe to connect my Amazon account?",
    short: "You sign in on Amazon's own page; Rocco never sees your password. Data comes only from Amazon's official APIs (no scraping). Nothing changes without your approval unless you switch on autopilot (Inside guardrails or Fully autonomous) yourself; every change is checked with Amazon first, logged and undoable, and there are daily safety limits on changes.",
    more: ["Remove access any time: Seller Central → Settings → User Permissions → Manage your apps, and in Amazon Ads → Settings → app access.", "Rocco is an independent tool, not affiliated with Amazon."],
  },
  {
    slug: "data-and-privacy", section: "Trust & safety", updated: U,
    q: "What data does Rocco keep?",
    short: "Only what it needs to find fixes and measure them: ads, sales, stock and campaign reports from your account, the changes you approved and their results. It isn't sold or shared. Delete everything by emailing human@rocco.works.",
  },
  // Troubleshooting
  {
    slug: "sign-in-problems", section: "Troubleshooting", updated: U,
    q: "I can't get back to my Rocco or Google sign-in loops",
    short: "Go to rocco.works → Sign in → choose the Google account you signed up with. If you land on an empty Rocco, you used a different Google account: sign out and pick the right one.",
    steps: ["Safari: allow pop-ups/cookies for rocco.works, or try Chrome.", "Joined as a teammate? Use exactly the email the owner added.", "Still stuck? Email human@rocco.works from your signup email."],
  },
  {
    slug: "approve-failed", section: "Troubleshooting", updated: U,
    q: "An approval failed. What now?",
    short: "Rocco checks every change with Amazon first, so a failed approval means nothing was changed. The job shows Amazon's reason and the exact manual steps. Common causes: the campaign or keyword was changed or archived since this morning, or Amazon needs you to reconnect.",
    steps: ["Read the reason on the job card.", "If it says reconnect: tap Reconnect on your dashboard (same account and history).", "Otherwise make the change by hand with the steps shown, or wait for tomorrow's fresh jobs."],
  },
  {
    slug: "currency-and-marketplaces", section: "Troubleshooting", updated: U,
    q: "Which marketplaces work?",
    short: "Every Amazon marketplace that Seller Central and Amazon Ads support: US, Canada, Mexico, UK, Germany, France, Italy, Spain, India, Japan, Australia and more. Connect each one; each gets its own tab and shows money in that marketplace's currency.",
  },
  {
    slug: "remove-or-swap-account", section: "Daily work", updated: U,
    q: "How do I remove or swap an Amazon account?",
    short: "Dashboard → Amazon accounts → Remove (owner only). Rocco stops reading it; its change log stays. Removed within a day of connecting (wrong account)? The slot frees right away. Otherwise it frees after 30 days. Need another slot now? Add an account for $49/month.",
  },
];

export const helpBySlug = (slug: string) => HELP.find((h) => h.slug === slug);
export const HELP_SECTIONS: HelpArticle["section"][] = ["Getting started", "Daily work", "Team & reminders", "Billing", "Trust & safety", "Troubleshooting"];

/** One article as plain Markdown (for /llms-full.txt and AI assistants). */
export function helpMarkdown(h: HelpArticle, base: string): string {
  return [`## ${h.q}`, `${base}/help/${h.slug}`, "", h.short, ...(h.steps?.length ? ["", ...h.steps.map((s, i) => `${i + 1}. ${s}`)] : []), ...(h.more?.length ? ["", ...h.more.map((m) => `- ${m}`)] : [])].join("\n");
}
