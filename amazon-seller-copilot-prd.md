# PRD: AI Junior Account Manager for Amazon Sellers

Working name: **[Brand TBD]** (see section 12 for name rules)
Built for: Ship or Die $100K Hackathon (Nov 16 – Dec 16, 2026), then as an ongoing SaaS
Owner: Praveen · Status: Draft v1 · Nov 16, 2026

---

## 1. One-line pitch
**"Upload one Amazon report or paste one notice, and get the fix in 60 seconds."**
A self-serve web app that does the daily jobs of a junior Amazon account manager: shows where ad money is wasted, gets listings ready for Rufus (Amazon's AI shopping assistant), and drafts suspension appeals. No agency retainer, no API approval wait.

## 2. Why this, why now
- **Margins are being squeezed.** In a 2026 seller survey, nearly half of sellers named marketplace fees as their biggest margin concern and 46% named ad costs. A new 3.5% fuel and logistics surcharge was added this year.
- **Rufus changed how shoppers find products.** Shoppers ask Rufus questions, and it answers using reviews, A+ content and Q&A. Amazon has also enforced a 75-character title limit in most categories since July 27, 2026.
- **Suspensions now happen by algorithm.** Listings and accounts can be suppressed or suspended with no initial human review. Appeal agencies charge hundreds to thousands of dollars.
- **Help is too expensive.** PPC-only agencies cost $5K–15K a month and full-service $8K–25K. An in-house team costs $200K–350K a year in salaries. A reported 67% of sellers using agencies are unhappy with the strategic guidance.
- **Proof of demand:** an estimated 40–80 new US seller-side Amazon account manager jobs are posted per day, paying $70K–140K. The job exists; we sell the software version of its routine tasks.
- **Founder advantage:** I already run this work by hand for clients (ShelfPilot/FBAmz setup kit: ad rules, negatives, harvesting, account guard). The rules and prompts exist; this product packages them as self-serve software.

## 3. Hackathon eligibility guardrails (must follow)
- **New brand, new domain, new product.** Do NOT reuse the ShelfPilot or FBAmz names, the fb-amz.com domain, or agency branding. Domain history is checked on the Wayback Machine.
- **Self-serve software only.** No done-for-you service, calls or "we'll manage it for you." Agencies, consulting and client services are excluded.
- **No payments before Nov 16** on the new product. Existing agency clients may buy it as normal new customers, but no recycled or prepaid agency money and no discounts tied to agency contracts.
- **Profit scoring:** refunds, chargebacks, payment fees and paid marketing come off. AI/API, hosting and tool costs do NOT. Annual upfront plans count in full.
- **Payments:** Razorpay (INR, UPI) and Polar/Stripe (USD) both count via TrustMRR. Install the hackathon traffic tracker before sending any traffic.

## 4. Target users
| Segment | Size / profile | What they buy |
|---|---|---|
| **Small-to-mid private-label sellers** ($10K–500K/month, 1–30 SKUs, owner does Amazon themselves) | Largest group; no agency, no in-house hire | One-off fixes, Pro annual |
| **In-house Amazon managers** at $1M–15M brands | One person covering ads, catalog and account health | Pro annual, paid by the company |
| **Small agencies and freelancers** (US, India, Philippines) | Manage 5–50 seller accounts | Agency annual with white-label reports |
| **Indian sellers on Amazon.in / exporting via Global Selling** | Price-sensitive, UPI | INR plans via Razorpay |

## 5. Core jobs to be done (MVP = 3 tools)

### Tool 1: Ad Waste Finder 💸 (the hook: shows money lost)
**Input:** the Sponsored Products search-term report (CSV/XLSX) from Ads Console, plus target ACoS.
**Output in under 60 seconds:**
- "You wasted **$X in the last 30 days** on N search terms": a big shareable number
- Negative keyword list (exact/phrase) using the rules from my existing kit (e.g. 15+ clicks with 0 orders, adjusted for conversion rate)
- Harvest list: converting search terms to move into exact-match campaigns
- Bid suggestions: new bid = current × (target ACoS ÷ actual ACoS), capped at ±20%
- **A ready-to-upload bulk sheet** (the step people actually pay for)
- AI relevance check on terms (relevant / irrelevant / competitor brand), using prompt P1 from the kit

**Free tier:** shows the wasted-$ total and the top 5 terms. **Paid:** the full lists and the bulk sheet.

### Tool 2: Rufus Readiness Check 🤖 (the trend hook)
**Input:** paste a listing (title, bullets, description, A+ text, top review snippets) or upload a category listing report / flat file. *No scraping of Amazon.*
**Output:**
- **Rufus Readiness Score (0–100)** with a share card
- Simulated shopper questions ("Does it fit a cup holder?", "Is it safe for kids?") and whether the listing answers each one clearly
- Title rewrite in **75 characters or less** with keywords kept, plus bullets that answer the top 10 shopper questions
- Suggested Q&A entries and A+ module text
- Flags: claims that risk policy trouble (e.g. "FDA approved", "best", unsupported medical claims)

**Honesty rule:** label the score as a *simulation* of how AI shopping assistants read a listing, not Rufus's actual ranking.

### Tool 3: Appeal / Plan of Action Writer 🛡️ (the panic buy)
**Input:** paste the Amazon notice (suspension, listing removal, IP complaint, inauthentic claim, late shipment, etc.) and answer 5–8 guided questions.
**Output:**
- Plan of Action in Amazon's expected structure: **root cause → corrective actions taken → preventive measures**
- A checklist of supporting documents (invoices, LOAs, supplier info) specific to the violation type
- Tone check that removes blame, excuses and admissions beyond what's needed
- A version for Account Health support email and a short version for the appeal form

**Disclaimers:** not legal advice, no guarantee of reinstatement, and the user submits it themselves.

### v1.1 (week 3+, only if MVP converts)
- **Profit Leak Finder:** upload the settlement report and get true profit per SKU after fees, ads and the new surcharge, with actions (raise price, move to merchant fulfillment, kill the SKU)
- **Daily account guard via SP-API / Ads API:** automated version of the kit's workflows. API approval takes days to weeks, so it isn't a launch dependency.
- **Weekly email brief** (prompt P2/P4 from the kit)

## 6. User flow
1. Land on a tool page (each tool also works as an SEO landing page: "Amazon search term report analyzer", "Amazon POA template generator", "Amazon 75 character title checker").
2. Upload or paste, with no signup for the free result.
3. See the free result: the wasted-$ number, the Rufus score or the POA outline.
4. Paywall: email, then checkout (Razorpay for India, Polar for everyone else).
5. Unlock the full output and downloads (bulk sheet XLSX, POA DOCX/TXT, rewritten listing).
6. Prompt to share the score card or wasted-$ card ("I found $1,240 of wasted ad spend in 60 seconds").
7. Upsell: "Run this every week" → Pro annual.

## 7. Pricing (built for profit scoring)
| Plan | Price | Includes |
|---|---|---|
| Free | $0 | Wasted-$ total + top 5 terms; Rufus score; POA outline |
| **Single fix** | $29 (₹1,499) | One full report from any one tool |
| **Appeal Pro** | $79 (₹3,999) | Full POA + 2 revisions + document checklist (urgent buyers pay) |
| **Pro annual** ⭐ | $299/yr (₹14,999) | Unlimited runs, up to 50 ASINs, all tools, weekly reminder |
| **Agency annual** ⭐ | $999/yr (₹49,999) | 25 seller workspaces, white-label PDF reports, CSV exports |

- Show monthly prices crossed out next to annual ($39/mo vs $299/yr) so annual looks like the obvious choice. **Annual counts in full** for the hackathon.
- Refund policy: 7 days, no questions asked (refunds reduce profit, but trust matters more in a 30-day sprint).

**Revenue target path to about $30K profit in 30 days:**
- 12 Agency annual × $999 = ~$12K
- 35 Pro annual × $299 = ~$10.5K
- 60 Appeal Pro × $79 = ~$4.7K
- 120 Single fixes × $29 = ~$3.5K
- Total ≈ $30.7K before fees

## 8. Distribution plan (organic first, because ad spend comes off profit)
1. **Warm network (days 1–7):** personal messages to past and current clients, seller friends and agency contacts. Offer a free Ad Waste scan, then upsell.
2. **"Wasted spend" content:** daily reels and LinkedIn posts with anonymized real numbers ("This seller wasted $3,180 in 30 days on 214 search terms"), plus screen recordings of the 60-second fix.
3. **Communities:** Amazon seller Facebook groups, r/FulfillmentByAmazon, r/AmazonSeller, Indian seller WhatsApp/Telegram groups. Lead with free value, never spam.
4. **Agencies as resellers:** the Agency plan helps them serve more clients with the same staff. Offer a commission per referred seller (note: commissions likely count as marketing cost, so keep them modest).
5. **SEO tool pages** live on day 3 (indexing takes 1–3 weeks, so start early), with llms.txt and FAQ schema so AI assistants can cite them.
6. **Build in public:** daily revenue posts on X, Instagram and LinkedIn tagged for the hackathon.
7. **Paid ads:** only to boost a reel that's already working organically, capped at ₹2,000 per test.

## 9. Tech plan
| Layer | Choice |
|---|---|
| App | Next.js on Vercel, pages rendered on the server (SEO pages + tools) |
| Auth + DB | Supabase (users, runs, orders, workspaces) |
| File parsing | SheetJS / PapaParse in the browser where possible; server for large files |
| AI | Claude API (classification, rewriting, POA drafting). AI costs aren't deducted from contest profit |
| Rules engine | TypeScript port of the kit's ad rules (negatives, harvest, bid formula, guardrails) |
| Outputs | XLSX bulk sheet (SheetJS), DOCX/PDF reports, PNG share cards |
| Payments | Razorpay (INR, UPI) + Polar (USD), both connected to TrustMRR |
| Analytics | Hackathon traffic tracker + simple event log (upload → result → checkout → paid) |
| Privacy | Uploaded files deleted after 24h; no Seller Central passwords ever requested |

**Data model (minimal):** `users`, `workspaces` (agency seats), `runs` (tool, input meta, result JSON, created_at), `orders` (provider, amount, plan, status), `credits` (single-fix balance).

## 10. 30-day build plan
| Days | Ship |
|---|---|
| **Nov 16–17** | Brand + domain, Razorpay/Polar + TrustMRR, tracker, legal pages, waitlist landing page. Day 1 post. |
| **Nov 18–21** | **Ad Waste Finder live** (rules + bulk sheet + paywall). First personal messages to 50 warm contacts. |
| **Nov 22–25** | **Appeal / POA Writer live.** SEO pages for 3 tools. First paid customers expected. |
| **Nov 26–29** | **Rufus Readiness Check live** + share cards. Black Friday/Cyber Monday angle: "Stop wasting ad spend in peak season." |
| **Nov 30 – Dec 5** | Pro + Agency annual plans, workspaces, white-label PDF. Agency outreach push. |
| **Dec 6–12** | Double down on the tool that converts best. Profit Leak Finder only if time allows. Testimonials and case-study posts. |
| **Dec 13–16** | Annual-plan push ("lock 2026 pricing"), final build-in-public story, make sure TrustMRR numbers are clean. |

## 11. Success metrics
- Activation: % of visitors who upload/paste (target 15%+ on tool pages)
- Free → paid conversion (target 5–8% for Ad Waste, 15%+ for Appeal)
- Share rate of result cards (target 10%)
- Annual plans as a share of revenue (target 60%+)
- Refund rate (keep under 5%)
- North star: **verified profit on TrustMRR**

## 12. Name and brand rules
- Don't put "Amazon", "Rufus", "FBA" or other Amazon trademarks in the brand or domain. Using them to describe what the product works with ("for Amazon sellers") is fine.
- Don't reuse ShelfPilot or FBAmz (existing business; the hackathon needs a new one).
- Short, .com or .app, easy to say. Directions: *SellerMedic*, *ListingDoc*, *AdLeak*, *Marketmate*, *Shelfwise*. Check availability and existing trademarks before buying.

## 13. Risks and mitigations
| Risk | Mitigation |
|---|---|
| Looks like a rebranded agency during manual review | New brand, self-serve only, no services, clean payment history |
| Amazon ToS / scraping | Only user-uploaded reports and pasted text; official APIs later |
| Wrong advice hurts an account (bids, appeals) | Guardrails (±20% caps), human review before upload, clear disclaimers, "suggestion, not auto-apply" in MVP |
| Rufus score seen as fake | Call it a simulation, show the reasoning, focus on concrete fixes |
| Low trust for a new brand | Free result first, founder face and story, real anonymized case numbers, 7-day refund |
| Crowded tools (Helium 10, Jungle Scout, PPC tools) | Position on instant fixes for the people they ignore: no subscription bloat, no setup, India pricing, agency white-label |
| Refunds and chargebacks reduce score | Clear free preview before purchase; refund window short and clear |

## 14. Out of scope (for the hackathon)
- Done-for-you management, calls, consulting (not eligible)
- Chrome extension that scrapes Amazon pages
- Automatic changes to live accounts without user review
- Walmart / Shopify / TikTok Shop support (later)

## 15. Open questions
- Final brand name and domain
- Is the Ads API / SP-API developer app from the agency reusable, or does the new business need its own? (Probably its own, to keep the businesses separate.)
- Exact affiliate rules under the hackathon's "paid marketing" deduction
- INR vs USD price anchoring for Indian sellers exporting to the US

---
*Related: `100k-hackathon-ideas.md` (all ideas and verdicts).*
