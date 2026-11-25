import { PLAN } from "./pricing";
import { GUARANTEE_DAYS, GUARANTEE_MS } from "./guarantee";

export { GUARANTEE_DAYS };

/**
 * Partner program (docs/PARTNERSHIPS.md): copy for /partners, /partners/agencies, /partners/tools,
 * /partners/communities and the /p/<code> landing page, plus the pure rules behind referral tracking.
 * Rendered by components/partners/*. Storage and server logic live in lib/partner-db.ts.
 *
 * Copy rules: plain words, no invented numbers or results, no partner names or logos until Praveen approves them
 * and they agree, no claimed partnerships that don't exist, self-serve only (no services, no calls), never link the
 * "Could I Fire My Agency?" tool from a partner page.
 */

/** Share of the seller's first payment paid to the partner. */
export const PARTNER_SHARE = 0.2; // Praveen confirmed 20% (Nov 25, 2026)
/** How long a referral cookie lasts. */
export const COOKIE_DAYS = 60;
export const PARTNER_COOKIE = "rocco_partner";
export const PARTNER_PARAM = "partner";

export type PartnerType = "agency" | "tool" | "community" | "other";
export const PARTNER_TYPES: { id: PartnerType; label: string }[] = [
  { id: "agency", label: "Amazon ads freelancer or agency" },
  { id: "tool", label: "Seller tool, prep center, 3PL or freight forwarder" },
  { id: "community", label: "Community, newsletter or YouTube channel" },
  { id: "other", label: "Something else" },
];
export const REACH_BANDS = ["Under 10", "10 to 50", "50 to 250", "250 to 1,000", "Over 1,000"] as const;

// ── Money (computed from the real prices and the constant, never typed in) ─────────────────────────────────
const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
export const sharePct = (share = PARTNER_SHARE) => `${Math.round(share * 100)}%`;
export const payoutFor = (amountUsd: number, share = PARTNER_SHARE) => Math.round(amountUsd * share * 100) / 100;
export const EXAMPLE = {
  yearly: usd(PLAN.annualCents / 100),
  monthly: usd(PLAN.monthlyCents / 100),
  yearlyPayout: usd(payoutFor(PLAN.annualCents / 100)),
  monthlyPayout: usd(payoutFor(PLAN.monthlyCents / 100)),
};
export const OFFER_LINE = `${sharePct()} of the seller's first payment: ${EXAMPLE.yearlyPayout} on a yearly plan (${EXAMPLE.yearly}), ${EXAMPLE.monthlyPayout} on a monthly plan (${EXAMPLE.monthly}).`;
export const PAYOUT_LINE = `Paid by Praveen (Rocco's founder) by Wise or PayPal, once the seller is past the ${GUARANTEE_DAYS}-day money-back guarantee and hasn't asked for a refund.`;

// ── Codes, cookie, payouts (pure, tested in lib/partners.test.ts) ───────────────────────────────────────────
/** A partner code: 3 to 24 lowercase letters, digits or single hyphens inside. */
export const CODE_RE = /^[a-z0-9](?:[a-z0-9-]{1,22}[a-z0-9])$/;
export function cleanCode(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const c = raw.trim().toLowerCase();
  return CODE_RE.test(c) && !c.includes("--") ? c : null;
}

/** A code made from the partner's name, unique among `taken`. */
export function makeCode(name: string, taken: Iterable<string>, rand: () => number = Math.random): string {
  const used = new Set(taken);
  let base = name.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 18).replace(/-+$/g, "");
  if (base.length < 3) base = `partner${base}`.slice(0, 18);
  if (!used.has(base) && cleanCode(base)) return base;
  for (let i = 0; i < 50; i++) {
    const c = `${base}-${Math.floor(10 + rand() * 90)}`;
    if (!used.has(c) && cleanCode(c)) return c;
  }
  return `${base}-${Date.now().toString(36).slice(-4)}`;
}

/**
 * Which code the visitor's cookie should hold after this visit. First partner wins: an existing valid cookie is
 * never replaced. A new code only counts when it belongs to an approved partner. Null = set nothing.
 */
export function cookieToSet(existing: string | null | undefined, incoming: string | null | undefined, approved: boolean): string | null {
  if (cleanCode(existing)) return null;
  const c = cleanCode(incoming);
  return c && approved ? c : null;
}

export const readPartnerCookie = (cookieHeader: string | null | undefined) => cleanCode(decodeURIComponent(cookieHeader?.match(/(?:^|;\s*)rocco_partner=([^;]+)/)?.[1] ?? ""));

/** Tag a team with the partner who sent it. First partner wins, and never after the team has paid. */
export function attachPartner<T extends { partner?: string; licensed?: boolean; hiredAt?: string }>(ws: T, code: string | null | undefined): boolean {
  const c = cleanCode(code);
  if (!c || ws.partner || ws.licensed || ws.hiredAt) return false;
  ws.partner = c;
  return true;
}

export type PayoutStatus = "due" | "paid" | "void";
export interface ReferralLike { paid_at: string; guarantee_ends_at: string; refunded: boolean; payout_status: PayoutStatus }
export const guaranteeEnds = (paidAt: Date | string) => new Date(new Date(paidAt).getTime() + GUARANTEE_MS).toISOString();
/** A payout is due once the guarantee window has fully passed, the seller hasn't refunded, and it isn't paid yet. */
export const payoutDue = (r: ReferralLike, now = new Date()) => r.payout_status === "due" && !r.refunded && new Date(r.guarantee_ends_at).getTime() <= now.getTime();

// ── Page copy ──────────────────────────────────────────────────────────────────────────────────────────────
export interface QA { q: string; a: string }
export interface Block { t: string; d: string }
export interface ToolLink { href: string; name: string; note: string }

/** Free tools partners can point people to. Never the "Could I Fire My Agency?" tool. */
export const FREE_TOOLS: Record<"leak" | "health" | "roast" | "overpaying" | "agencyAudit" | "watch" | "breakeven", ToolLink> = {
  leak: { href: "/free/amazon-money-leak-detector", name: "Money Leak Detector", note: "Every avoidable dollar in the ads and stock reports, priced per month." },
  health: { href: "/free/amazon-health-check", name: "Financial Health Check", note: "A 0 to 100 score with TACoS, ACoS against break-even, conversion and waste." },
  roast: { href: "/free/roast-my-amazon-account", name: "Roast My Amazon Account", note: "Honest about the numbers, never about the seller. Good for a members thread." },
  overpaying: { href: "/free/am-i-overpaying-amazon", name: "Am I Overpaying?", note: "Ad costs and fees against typical ranges." },
  agencyAudit: { href: "/free/amazon-agency-audit", name: "The Agency Audit", note: "Before and after for an account you manage: ACoS, waste, sales and what is still running." },
  watch: { href: "/free/rocco-watches-your-business", name: "Rocco Watches Your Business", note: "Every alert Rocco would have sent this week." },
  breakeven: { href: "/tools/breakeven-acos", name: "Breakeven ACoS Calculator", note: "The ACoS where ads stop making money." },
};

export const ROCCO_DOES: Block[] = [
  { t: "Ads, every morning", d: "Blocks searches that waste money, moves bids within fixed limits, shifts budget to campaigns that sell, and turns searches that convert into exact campaigns." },
  { t: "Seller Central", d: "Warns before a stockout and drafts the restock, flags suppressed listings and Buy Box losses with the steps to fix them." },
  { t: "You stay in charge", d: "Three modes: approve every move (the default), let Rocco act inside guardrails you set, or fully autonomous. Every change is checked with Amazon first, logged and can be undone." },
];

export const HOW_IT_WORKS: Block[] = [
  { t: "Apply", d: "Two minutes, on this page. No call." },
  { t: "Get your link", d: "Praveen reads every application. Once you're approved you get a code and a page at rocco.works/p/your-code." },
  { t: "Share it your way", d: "In a post, a newsletter, a client email or a video description. Sellers who arrive through your link are tagged to you for 60 days." },
  { t: "Get paid", d: PAYOUT_LINE },
];

export const LINK_RULES = [
  "Your Rocco link is a referral link. Mark it rel=\"sponsored\" wherever you post it (Google's rule for paid and affiliate links), and say you earn a share if a seller hires Rocco.",
  "Rocco never pays for a followed link, a review or a post. You earn only when a seller you sent pays and stays past the guarantee.",
  "Any link from rocco.works to a partner's site is marked rel=\"sponsored\" too, because there is a commission between us.",
  "Your name only appears on rocco.works once you're approved and have said yes to it.",
];

export const BASE_FAQ: QA[] = [
  { q: "How much do I earn?", a: `${OFFER_LINE} One payout per seller, on their first payment.` },
  { q: "When and how am I paid?", a: `${PAYOUT_LINE} You get a note with the seller's plan and the amount.` },
  { q: "Does it cost anything to join?", a: "No. No fees, no paid posts, no retainers, no minimums." },
  { q: "How is a sale tracked to me?", a: `Your link (rocco.works/p/your-code, or any rocco.works page with ?partner=your-code) sets a first-party cookie for ${COOKIE_DAYS} days. If the seller hires Rocco in that time, the code goes into the checkout and the sale is tagged to you. If two partners send the same seller, the first one wins.` },
  { q: "What if the seller refunds?", a: `Then there is no payout for that seller. That's why payouts wait until the ${GUARANTEE_DAYS}-day money-back guarantee has passed.` },
  { q: "Do I have to do anything for the seller?", a: "No. Rocco is self-serve software: the seller signs up, connects Amazon and runs it. You refer; you never have to set it up or support it." },
  { q: "Who decides if I'm accepted?", a: "Praveen reads every application. The best fit is anyone with an audience of US Amazon sellers who already run ads. You'll get an email either way." },
];

export interface PartnerPageCopy {
  slug: "" | "agencies" | "tools" | "communities";
  type: PartnerType;
  path: string;
  nav: string;
  metaTitle: string;
  metaDescription: string;
  kicker: string;
  h1: string;
  sub: string;
  gets: Block[];
  steps?: Block[];
  tools?: ToolLink[];
  toolsTitle?: string;
  toolsNote?: string;
  faq: QA[];
  applyTitle: string;
}

export const HUB: PartnerPageCopy = {
  slug: "",
  type: "agency",
  path: "/partners",
  nav: "Overview",
  metaTitle: "Partner program: earn a share of every seller you send",
  metaDescription: `Send US Amazon sellers to Rocco and earn ${sharePct()} of their first payment, paid after the ${GUARANTEE_DAYS}-day guarantee. For ads freelancers, agencies, seller tools and community owners. No fees.`,
  kicker: "Rocco partner program",
  h1: "Send sellers to Rocco. Earn a share of every sale.",
  sub: `For people US Amazon sellers already trust: ads freelancers and agencies, seller tools, community and newsletter owners. ${OFFER_LINE}`,
  gets: [
    { t: "One simple offer", d: OFFER_LINE },
    { t: "Paid by hand, after the guarantee", d: PAYOUT_LINE },
    { t: "Nothing up front", d: "No fees, no paid posts, no retainers. You earn when a seller you sent pays and stays." },
    { t: "Something useful to share", d: "Free tools your audience can use today, no sign-up: leak checks, a health score, an agency before and after." },
  ],
  faq: BASE_FAQ,
  applyTitle: "Apply to be a partner",
};

export const PARTNER_PAGES: PartnerPageCopy[] = [
  {
    slug: "agencies",
    type: "agency",
    path: "/partners/agencies",
    nav: "Agencies",
    metaTitle: "For Amazon ads freelancers and agencies",
    metaDescription: "Rocco does the daily account work (negatives, bids, budgets, stock checks) so you can take on more clients. You keep the client and the strategy. Try it on one client account.",
    kicker: "For Amazon ads freelancers and agencies",
    h1: "Rocco does the daily account work. You keep the client and the strategy.",
    sub: "Negatives, bids, budgets and stock checks, every morning, inside the rules you set. Fewer hours per account means room for more clients.",
    gets: [
      { t: "More clients, same hours", d: "Rocco lays out each account's daily jobs, ranked by money, with the reason. You approve them, or let Rocco act inside guardrails you set." },
      { t: "You stay the strategist", d: "Set the goal, target ACoS, budget ceiling and what never to touch per account. The client relationship and the strategy stay yours." },
      { t: "Try it on one client account", d: `Once you're approved, ask for a ${GUARANTEE_DAYS}-day trial on one of your client accounts, with that client's permission. If it doesn't save you time in those two weeks, walk away.` },
      { t: "Or refer and earn", d: `${OFFER_LINE} For sellers you don't manage yourself.` },
    ],
    steps: [
      { t: "Apply below", d: "Tell us how many US sellers you work with." },
      { t: "Trial on one client", d: "With the client's permission, connect their Seller Central and Amazon Ads with Amazon's own sign-in." },
      { t: "Approve the first jobs", d: "See what Rocco finds, approve what you agree with, skip the rest with a reason so it learns your style." },
    ],
    toolsTitle: "Free client reporting",
    toolsNote: "Run these on a client's reports and send them the result. Reports are read in the browser and never uploaded.",
    tools: [FREE_TOOLS.agencyAudit, FREE_TOOLS.leak, FREE_TOOLS.breakeven],
    faq: [
      { q: "Will Rocco take my clients?", a: "No. Rocco is software the account owner or their manager runs. There is no Rocco agency, no account managers, no calls. You keep the client." },
      { q: "Does Rocco change things without asking?", a: "Only if you choose that. The default is approve every move. You can switch an account to act inside your guardrails, or fully autonomous. Every change is checked with Amazon first, logged and can be undone." },
      { q: "How many accounts can I run?", a: "One plan covers 3 Amazon accounts (each marketplace counts as one). Extra accounts can be added from the dashboard." },
      { q: "How does the client trial work?", a: `After approval, email human@rocco.works with the account you want to try. You need the client's permission to connect their account. The trial runs ${GUARANTEE_DAYS} days.` },
      ...BASE_FAQ.filter((x) => /earn|paid|cost/i.test(x.q)),
    ],
    applyTitle: "Apply as an agency or freelancer",
  },
  {
    slug: "tools",
    type: "tool",
    path: "/partners/tools",
    nav: "Seller tools",
    metaTitle: "For seller tools, prep centers, 3PLs and freight forwarders",
    metaDescription: `Non-competing seller tools and service providers: write a guide with Rocco, swap spots on each other's partner pages, and earn ${sharePct()} of the first payment of every seller you send.`,
    kicker: "For seller tools, prep centers, 3PLs and freight forwarders",
    h1: "Your customers sell on Amazon. Rocco runs the daily ads and stock work.",
    sub: "If you don't compete with Rocco (ads management), we can help each other's customers. Three things on offer.",
    gets: [
      { t: "A guide written together", d: "One useful guide for sellers that uses both products, written with you and published on both sites. Plain, checked, no inflated claims." },
      { t: "A spot on each other's partner pages", d: "Once we've both agreed, a listing on Rocco's partner page, linked with rel=\"sponsored\" because there's a referral between us." },
      { t: "The referral share", d: OFFER_LINE },
    ],
    steps: [
      { t: "Apply below", d: "Tell us what you make and who uses it." },
      { t: "Agree what to share", d: "By email: the guide topic and where each side links. No calls needed." },
      { t: "Publish and share", d: "Each side posts on its own site and sends its own audience." },
    ],
    faq: [
      { q: "Who counts as non-competing?", a: "Anyone whose main product isn't Amazon ads management: profit and accounting tools, review and inventory tools, prep centers, 3PLs, freight forwarders, product research tools." },
      { q: "Do you list partners publicly?", a: "Only after you're approved and have agreed to be listed. Links to partner sites are marked rel=\"sponsored\"." },
      ...BASE_FAQ.filter((x) => /earn|paid|tracked/i.test(x.q)),
    ],
    applyTitle: "Apply as a seller tool or service",
  },
  {
    slug: "communities",
    type: "community",
    path: "/partners/communities",
    nav: "Communities",
    metaTitle: "For seller communities, newsletters and YouTube channels",
    metaDescription: `Give your members a free money leak check for their Amazon account, and earn ${sharePct()} of the first payment of every seller who hires Rocco through you.`,
    kicker: "For community, newsletter and YouTube owners",
    h1: "Give your members a free money leak check.",
    sub: "Free tools your members can run on their own Amazon reports today, no sign-up. If some of them later hire Rocco through your link, you earn a share.",
    gets: [
      { t: "A free perk for members", d: "Point members to the free tools below. They drop in the reports they already download from Amazon and see where money leaks. Reports are read in their browser." },
      { t: "Your own page", d: "Once approved, rocco.works/p/your-code says you recommend Rocco and lists the free tools, so your link always lands on something useful." },
      { t: "The referral share", d: OFFER_LINE },
    ],
    toolsTitle: "The money leak check",
    toolsNote: "All free, no sign-up, reports read in the browser. Share any of these with your members.",
    tools: [FREE_TOOLS.leak, FREE_TOOLS.health, FREE_TOOLS.roast, FREE_TOOLS.overpaying, FREE_TOOLS.watch],
    faq: [
      { q: "Do my members have to buy anything?", a: "No. The free tools are free with no sign-up. Rocco itself is a paid plan; you earn only if a member hires it." },
      { q: "Can I post the tools without being a partner?", a: "Yes. They're public. Being a partner just means sales through your link are tracked to you." },
      { q: "How should I mark the link?", a: "As a referral: rel=\"sponsored\" on websites, and a plain note in posts and video descriptions that you earn a share." },
      ...BASE_FAQ.filter((x) => /earn|paid|refund/i.test(x.q)),
    ],
    applyTitle: "Apply as a community or creator",
  },
];

export const ALL_PARTNER_PAGES = [HUB, ...PARTNER_PAGES];
export const partnerPage = (slug: string) => PARTNER_PAGES.find((p) => p.slug === slug);

/** /p/<code>: the landing page a partner shares. */
export const LANDING = {
  h1: (name: string) => `${name} recommends Rocco`,
  sub: "Rocco is an AI Amazon manager. Connect Seller Central and Amazon Ads once. Every morning Rocco lays out today's jobs, ranked by money, and makes the changes in Amazon.",
  tools: [FREE_TOOLS.leak, FREE_TOOLS.health, FREE_TOOLS.roast, FREE_TOOLS.breakeven],
  hireNote: `${EXAMPLE.yearly} a year or ${EXAMPLE.monthly} a month, ${GUARANTEE_DAYS}-day money-back guarantee.`,
};
