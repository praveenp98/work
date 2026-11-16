# PRD: AI Junior Account Manager for Amazon Brands

Working name: **[Brand TBD]** (see section 14 for name rules; shortlisted: SellerMedic, AdLeak, ListingDoc)
Built for: Ship or Die $100K Hackathon (Nov 16 – Dec 16, 2026), then as an ongoing SaaS
Owner: Praveen · Status: Draft v2 · Nov 16, 2026
Handover: Claude Code works from this file plus `CLAUDE.md` and `docs/PROGRESS.md`

---

## 1. One-line pitch
**"Upload one Amazon report, or connect your ads account, and get the fix in 60 seconds."**
A self-serve web app that does the daily jobs of a junior Amazon account manager across **ads (including Rufus ads), listings and account health**. No agency retainer, no hire.

## 2. Why this, why now
- **Margins are being squeezed.** In a 2026 seller survey, nearly half of sellers named marketplace fees as their biggest margin concern and 46% named ad costs. A new 3.5% fuel and logistics surcharge was added this year.
- **Rufus ads switched on without sellers noticing.** Sponsored Prompts (ads shown inside Rufus, Amazon's AI shopping assistant) moved from beta to general availability in the US on March 25, 2026, billed per click. All active Sponsored Products and Sponsored Brands campaigns were auto-enrolled with no opt-out. Amazon writes the prompts from your product data, and advertisers can see which prompts drove clicks and pause individual prompts at the ad-group level. Sponsored Prompts are under 1% of clicks but cost about $0.31 per click vs $0.50–0.70 for regular ads. **Most sellers are paying for them and have never looked.**
- **AI now runs Amazon ads.** Amazon's official Ads MCP Server entered open beta on Feb 2, 2026, letting Claude, ChatGPT and Gemini pull reports and change campaigns. Amazon also added an Agent Policy to the Business Solutions Agreement (effective March 4, 2026) governing how AI interacts with Seller Central. Sellers want AI to run ads, but need guardrails and someone to set it up safely.
- **Naming:** Amazon renamed Rufus to **Alexa for Shopping** on May 13, 2026; sellers and the ads console still say "Rufus" / "Sponsored Prompts". Use both in copy and SEO. Competitors: see `docs/COMPETITORS.md`.
- **Rufus changed listings too.** Rufus answers shopper questions using reviews, A+ content and Q&A, and a 75-character title limit applies in most categories since July 27, 2026.
- **Algorithmic suspensions.** Accounts and listings can be suspended with no initial human review.
- **Help is expensive.** PPC-only agencies cost $5K–15K a month and full-service $8K–25K. An in-house team costs $200K–350K a year. A reported 67% of agency clients are unhappy with the strategic guidance.
- **Demand signal:** an estimated 40–80 new US seller-side Amazon account manager jobs are posted per day, at $70K–140K.
- **Founder advantage:** I already do this by hand for clients (ad rules, negatives, harvesting, bids, inventory and account guard, Claude prompts). This product packages that know-how as self-serve software.

## 3. Hackathon eligibility guardrails (must follow)
- **New brand, new domain, new product.** Do NOT reuse the ShelfPilot or FBAmz names, the fb-amz.com domain, agency branding or the agency's Stripe history for this product.
- **Self-serve software only.** No done-for-you service, consulting or "we manage it." Agencies and client services are excluded.
- **No payments before Nov 16** on the new product. Agency clients may buy it as normal new customers, but no recycled or prepaid agency money.
- **Profit = money in − refunds, chargebacks, payment fees and paid marketing.** AI/API, hosting, domains and software are NOT deducted. **Annual upfront plans count in full.**
- **Paid marketing reduces the score.** Treat the bought lead database, paid ads, and probably affiliate commissions as marketing cost. Log every rupee or dollar so costs are "clearly attributed." Email-sending software is probably "software" (not deducted), but confirm in the full rules.
- Payments: Razorpay (INR, UPI) and Polar/Stripe (USD) both count via TrustMRR. **Install the hackathon traffic tracker before any traffic.**

## 4. Target users
| Segment | Profile | What they buy |
|---|---|---|
| **US/UK private-label brands ($1M–15M on Amazon)** ⭐ primary for outbound | Owner or one in-house manager covering ads, catalog and account health; often unhappy with an agency | Pro / Brand annual |
| **In-house Amazon and PPC managers** | Overloaded; want AI to do the grunt work safely | Pro annual, company card |
| **Small agencies and freelancers** (US, India, Philippines) | Manage 5–50 accounts | Agency annual + white-label |
| **Smaller sellers ($10K–500K/month)** | Do it themselves | One-off fixes, Pro annual |
| **Indian sellers (Amazon.in, Global Selling)** | Price-sensitive, UPI | INR plans via Razorpay |

## 5. Product map (3 pillars, 1 account manager)

### Pillar A: ADS 📈 (the money pillar for brands)
| # | Tool | Input | Output | Tier |
|---|---|---|---|---|
| A1 | **Ad Waste Finder** ⭐ | Search-term report | Wasted-$ total, negatives, harvest list, bids (±20% cap), **upload-ready bulk sheet** | Free summary / Paid full |
| A2 | **Rufus Ads (Sponsored Prompts) Auditor** ⭐ new | Sponsored Prompts report + campaign report | Proof you're auto-enrolled, prompt-level spend and conversions, "pause these prompts" list, which product-data gaps cause bad prompts, prompt-friendly listing fixes | Paid (hook: "You're already paying for Rufus ads. Here's what they're doing.") |
| A3 | **Campaign Launch Builder** | ASIN + seed keywords + budget + target ACoS | Full launch structure (SP auto, broad, phrase, exact, SB, product targeting, brand defense, negatives) as a bulk sheet | Paid |
| A4 | **Placement and Budget Optimizer** | Placement report + campaign budgets | Top-of-search / product-page modifier changes, budget moves from losers to capped winners | Paid |
| A5 | **Dayparting Analyzer** | Hourly performance report | Hours that waste money, schedule suggestions | Paid |
| A6 | **Brand Defense Checker** | Search-term + targeting reports | Competitors bidding on your brand, defense campaign bulk sheet | Paid |
| A7 | **Profit-aware Bidding (TACoS)** | Ads reports + settlement/fees | Bids based on true margin per SKU, not just ACoS | Pro |
| A8 | **AI Ads Copilot (Connect mode)** | Amazon Ads API / Ads MCP connection (OAuth) | Chat with your ads ("show campaigns wasting spend"), daily auto-checks, **every change queued for approval**, full change log + undo | Pro / Brand (v1.1, needs API approval) |
| A9 | **Weekly Ads Brief** | Any of the above | Email: spend, ACoS/TACoS, what changed, what to approve | Pro |

### Pillar B: LISTINGS AND RUFUS VISIBILITY 🤖
| # | Tool | Tier |
|---|---|---|
| B1 | **Rufus Readiness Check**: simulated shopper questions, score 0–100, 75-char title rewrite, bullets, Q&A, A+ text (labeled as a *simulation*) | Free score / Paid fixes |
| B2 | Title checker (75-char, banned words, keyword coverage) | Free mini-tool |
| B3 | Bullet and description rewriter | Free mini-tool |
| B4 | Backend search-terms generator + byte counter | Free mini-tool |
| B5 | Policy-risk scanner ("FDA approved", "best", medical claims) | Free mini-tool |
| B6 | Review insight summarizer (top complaints → listing/product fixes) | Free mini-tool |
| B7 | Competitor listing gap compare | Free mini-tool |
| B8 | A+ content and Q&A generator | Paid |

### Pillar C: ACCOUNT HEALTH AND PROFIT 🛡️
| # | Tool | Tier |
|---|---|---|
| C1 | **Appeal / Plan of Action Writer** (root cause → corrective → preventive, document checklist, tone check) | Paid ($79) |
| C2 | FBA fee and profit calculator with the 3.5% surcharge | Free mini-tool |
| C3 | ACoS / TACoS / break-even calculator | Free mini-tool |
| C4 | **Profit Leak Finder** (settlement report → true profit per SKU + actions) | Paid |
| C5 | Restock planner (days of stock left, reorder qty = velocity × (lead days + check-in days) × safety − (available + inbound)) | Paid |
| C6 | Stranded / aged inventory fee fixer | Paid |
| C7 | FBA reimbursement finder + claim text | Paid |
| C8 | Buyer message and review-request templates (policy-safe) | Free |

**Rule for adding tools:** each tool must either bring in traffic (free + SEO page) or help sell an annual plan (paid). Otherwise skip it.

## 6. User flow
1. Visitor lands on a tool page (SEO, AI search, cold email link or reel).
2. Upload a report or paste text. No signup for the free result.
3. Free result shows the pain (wasted $, Rufus prompt spend, score).
4. Email capture, then checkout (Razorpay in India, Polar elsewhere).
5. Unlock full outputs and downloads (bulk sheet XLSX, PDF report, POA DOCX).
6. Share card + "run this every week" → annual plan.
7. Brand/Agency plans: "Connect Amazon Ads" (v1.1) → daily copilot with approvals.

## 7. Pricing (built for profit scoring: annual counts in full)
| Plan | Price | Includes |
|---|---|---|
| Free | $0 | All mini-tools; Ad Waste summary; Rufus score |
| Single fix | $29 (₹1,499) | One full report from any paid tool |
| Appeal Pro | $79 (₹3,999) | Full POA + 2 revisions + doc checklist |
| **Pro annual** | $299/yr (₹14,999) | 1 brand, all upload tools, weekly brief |
| **Brand annual** ⭐ (outbound target) | $1,499/yr | Up to 3 brands/marketplaces, Ads Copilot connect mode, approvals, change log, priority support by email |
| **Agency annual** | $2,499/yr | 25 workspaces, white-label PDF reports, CSV exports |

- Show monthly equivalents crossed out to make annual the default.
- 7-day refund window, clearly stated.
- **Profit path to ~$40K in 30 days (outbound-heavy):** 12 Brand × $1,499 = ~$18K · 5 Agency × $2,499 = ~$12.5K · 25 Pro × $299 = ~$7.5K · 40 Appeal × $79 = ~$3.2K · 60 Single × $29 = ~$1.7K → **~$43K revenue**, minus fees and logged marketing costs.

## 8. Go-to-market engine

### 8.1 Outbound email to Amazon brands (high-ticket)
**Hard constraint:** a brand-new sending domain needs **2–3 weeks of warmup** before real volume. Gmail, Yahoo and Microsoft enforce SPF, DKIM, DMARC, one-click unsubscribe, spam complaints under 0.3% (aim under 0.1%) and bounces under 2%. Domains can only be registered from Nov 16, so **start warmup tonight or tomorrow.**

**Setup (Nov 16–17)**
- Main brand domain = website only. **Never cold-email from it.**
- Buy 2–3 secondary sending domains (e.g. `get[brand].com`, `try[brand].com`) with 2–3 inboxes each (Google Workspace or Microsoft 365)
- SPF, DKIM, DMARC on each; custom tracking domain; one-click unsubscribe
- Start automated warmup immediately (Instantly / Smartlead / similar)

**Lead data**
- Bought lead database of Amazon brands (US/UK first). Filter: brands with active Amazon storefronts, roles = Founder, CEO, Head of eCommerce, Amazon Manager, PPC Manager
- Apollo (connected in Claude) is an alternative or enrichment source. Its credits are a cost to log
- **Verify every email before sending** (bounces must stay under 2%)
- **Exclude EU/UK contacts unless the GDPR basis is clear.** Follow US CAN-SPAM: honest subject lines, physical address, working unsubscribe
- Log the database price as marketing cost

**Sending schedule**
| Dates | Volume | Why |
|---|---|---|
| Nov 17–23 | 0 cold; warmup only. Personal emails/DMs to warm contacts from your own inbox | Protect reputation |
| Nov 24–30 | 10–20 per inbox per day | Ramp; watch bounces and complaints |
| Dec 1–16 | 30–50 per inbox per day (≈300–450/day across ~9 inboxes) | ≈4,000–6,000 emails total |

Expected: 2–6% reply → roughly 100–300 replies → target **15–25 annual plans**.

**Message angle (personalized per brand):**
- Subject: "[Brand] is already paying for Rufus ads"
- Body: the auto-enrollment fact, plus "we found $X of waste in similar brands," plus a **free 60-second Ad Waste + Rufus Ads audit link**. No call needed; self-serve.
- Follow-ups (2): a short case-style number, then "want the bulk sheet?"
- AI-personalize the first line from the brand's storefront/category (Claude), with human spot-checks

### 8.2 Deep SEO + AI search (AEO/GEO)
Goal: rank on Google and **get cited by ChatGPT, Claude, Perplexity and Gemini** for Amazon seller questions.
- **Technical:** server-rendered Next.js, fast Core Web Vitals, clean URLs, XML sitemap, Google Search Console **and Bing Webmaster Tools** (some AI search tools draw on Bing), IndexNow, robots.txt allowing GPTBot, ClaudeBot and PerplexityBot, `/llms.txt` + `/llms-full.txt`
- **Structured data:** SoftwareApplication, FAQPage, HowTo, Organization, BreadcrumbList on every page
- **Page types (programmatic + hand-written):**
  - One landing page per tool (~25 pages): "Amazon search term report analyzer", "Amazon Sponsored Prompts report explained", "Amazon POA generator", "Amazon 75 character title checker", "FBA fee calculator 2026"
  - Problem pages: "How to turn off / control Rufus Sponsored Prompts", "Amazon 3.5% fuel surcharge explained", "Amazon Agent Policy for AI tools"
  - Comparison pages: "[Big tool] alternatives for small brands", "Agency vs AI tool for Amazon PPC"
  - Glossary (ACoS, TACoS, placement modifiers, Sponsored Prompts, etc.), each with a definition box AI can quote
- **Content style for AI citation:** direct answer in the first 2 sentences, dated facts with sources, tables, FAQ blocks, author box (founder's agency experience)
- **Authority:** TrustMRR listing (Marc says it gives a 40+ DR backlink), launch directories, Product Hunt, Indie Hackers, guest answers in seller communities, "best Amazon tools 2026" listicle outreach
- **Timing:** indexing takes 1–3 weeks, so ship the tool pages by Nov 20. SEO mostly pays off after the contest; outbound and warm network carry the 30 days.

### 8.3 Warm and social (free, starts day 1)
- Personal messages to past and current clients, seller friends, agency contacts (warm, not mass DM)
- Daily build-in-public posts (X, LinkedIn, Instagram) with real anonymized numbers
- Seller communities: lead with free value
- Agencies as partners via the Agency plan (modest referral fee; log it as a cost)

## 9. Tech plan
| Layer | Choice |
|---|---|
| App | Next.js (App Router) on Vercel; server-rendered tool and SEO pages |
| Auth + DB | Supabase (Postgres, auth, storage with 24h auto-delete for uploads) |
| Parsing | SheetJS / PapaParse; report-type auto-detection by header row |
| Rules engine | TypeScript port of the existing ad rules (negatives, harvest, bid formula, guardrails, budget shifts, restock formula) |
| AI | Claude API: term relevance, rewrites, POA, briefs, outreach first lines. AI costs aren't deducted from contest profit |
| Ads connect (v1.1) | Amazon Ads API via Login with Amazon OAuth; optional Amazon Ads MCP Server. **Read-only by default**, writes only after user approval; respect Amazon's Agent Policy |
| Outputs | XLSX bulk sheets, PDF reports (white-label for agencies), PNG share cards |
| Payments | Razorpay + Polar → TrustMRR |
| Email | Transactional: Resend/Postmark from the main domain. Cold: separate domains + sending tool |
| Analytics | Hackathon tracker + events (upload → result → checkout → paid) + UTM per channel |
| SEO | next-sitemap, JSON-LD components, llms.txt generator, IndexNow ping on deploy |

**Data model:** `users`, `workspaces`, `brands`, `runs` (tool, report_type, result_json), `orders`, `credits`, `connections` (ads API tokens, encrypted), `approvals` (queued change, status), `change_log` (applied change, undo payload), `leads` (outbound, never mixed with users), `marketing_costs` (date, channel, amount, note).

## 10. 30-day build and launch plan
| Days | Product | Growth |
|---|---|---|
| **Nov 16–17** | Brand, domain, Razorpay/Polar + TrustMRR, tracker, legal pages, landing page | Buy sending domains, set up inboxes, **start warmup**; buy and verify the lead DB; Day 1 post |
| **Nov 18–20** | **A1 Ad Waste Finder** + B2/C2/C3 mini-tools + SEO page template | Warm outreach (50 personal emails/DMs); Search Console + Bing; sitemap, llms.txt |
| **Nov 21–24** | **A2 Rufus Ads Auditor** + **B1 Rufus Readiness** + **C1 Appeal Writer** | 10 SEO pages live; write the cold sequences; start sending at 10–20 per inbox per day from Nov 24 |
| **Nov 25–30** | A3 Launch Builder, A4 Placement/Budget, Pro/Brand/Agency plans, white-label PDF | Black Friday/Cyber Monday angle: "stop peak-season ad waste"; comparison + problem pages |
| **Dec 1–7** | A6 Brand Defense, A9 Weekly Brief, C4 Profit Leak | Full outbound volume; reply handling within hours; case-study posts |
| **Dec 8–12** | A8 Ads Copilot connect mode (only if the API app is approved) or C7 Reimbursements | Double down on the best-converting subject line and segment |
| **Dec 13–16** | Polish, bug fixes, refund-proof onboarding | "Lock 2026 pricing" annual push; final build-in-public story; reconcile TrustMRR + marketing-cost log |

## 11. Success metrics
- Tool page → upload: 15%+ · Free → paid: 5–8% (Ad Waste), 15%+ (Appeal)
- Cold email: bounce under 2%, complaints under 0.1%, reply 2–6%, reply → audit 40%, audit → annual 15%
- Annual plans ≥ 70% of revenue · refunds under 5%
- SEO: pages indexed, impressions, AI citations (check monthly by asking ChatGPT/Perplexity/Claude target questions)
- **North star: verified profit on TrustMRR minus logged marketing costs**

## 12. Risks and mitigations
| Risk | Mitigation |
|---|---|
| Looks like a rebranded agency | New brand, self-serve, no services, clean payment history |
| Cold email burns domains / spam complaints | Separate sending domains, warmup, verification, low volume, real personalization, easy unsubscribe |
| Lead DB cost eats profit | Buy only a targeted segment; log the cost; stop if replies stay under 1% after 1,000 sends |
| Amazon ToS / Agent Policy | Uploads + official APIs only; no scraping; human approval before changes; follow the Agent Policy |
| Wrong ad changes hurt accounts | ±20% caps, read-only default, approval queue, change log with undo, disclaimers |
| Rufus claims overstated | Base A2 on the advertiser's actual Sponsored Prompts report; label B1 as a simulation |
| Ads API approval delay | Upload mode works without it; Connect mode is v1.1 |
| Crowded PPC tools | Position on instant fixes + Rufus ads + India pricing + agency white-label, not a full PPC platform |

## 13. Out of scope (hackathon)
Done-for-you management, calls/consulting, scraping extensions, auto-applying changes without approval, Walmart/Shopify/TikTok Shop.

## 14. Name and brand rules
- No "Amazon", "Rufus", "FBA" or "Sponsored Prompts" in the brand or domain. Using them in descriptions ("for Amazon sellers") is fine.
- Don't reuse ShelfPilot or FBAmz.
- Checked Nov 16 (not owned): sellermedic.com, adleak.com and listingdoc.com are taken. sellermedic.net and adleak.net were available ($19). Also check .app / .co / .ai at Cloudflare, Porkbun or Namecheap. **Don't buy through the Shopify connector** (it attaches domains to an unrelated store).

## 15. Open questions
- Final brand name + domain
- Does the new business need its own Amazon Ads API developer app? (Yes, probably, to keep the businesses separate; apply on day 1.)
- Do lead databases, sending tools and affiliate commissions count as "paid marketing"? Check the full rules.
- Which lead database (coverage of Amazon brands, verified emails, price)?
- INR vs USD anchoring for Indian brands exporting to the US

---
*Related: `100k-hackathon-ideas.md` · `CLAUDE.md` (handover) · `docs/PROGRESS.md` (history log)*
