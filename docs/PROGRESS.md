# Progress log

Newest entries at the top. Each session adds: date, what happened, decisions, next steps, blockers, numbers (revenue, costs, sends, replies).

---

## 2026-11-17 (01:15) · "Free daily apps, no ads, no subscriptions" idea
- Praveen asked about free consumer apps in every field with no ads or subscriptions. Assessed and added as idea **N** in `100k-hackathon-ideas.md`: free can't win a profit contest; pay-once is the viable form; broad utility suites are commoditized; only sharp if focused on replacing one specific hated subscription.
- Status unchanged: **ON HOLD. No build decision yet.**

---

## 2026-11-17 (01:10) · Hunt for Amazon gaps outside the connectors
- Praveen chose option 3 (find an Amazon problem the existing connectors don't cover). Researched and wrote `docs/AMAZON-GAPS.md`.
- Best gap: **Amazon-only brands invisible in ChatGPT/Perplexity shopping** (Amazon blocked AI crawlers in Nov 2025) → possible "AI Shelf" product + Brand Referral Bonus angle. Partial competitors: Rithum, Ranketta, Lapis, Nembol.
- CPSC eFiling and tariffs/HTS: real pains but already served (Comply PRO+, SupplyScope, CPCReady, CertPrepy; Avalara, Zonos, etc.).
- Status unchanged: **ON HOLD. Do not build** until Praveen decides.
- Praveen asked: update repo files after every discussion (standing instruction).

---

## 2026-11-17 · Kill review + pivot exploration (Claude, claude.ai)
**What happened**
- Re-read all repo files and argued against the Amazon "AI Junior Account Manager" PRD v2. Wrote `docs/KILL-MEMO.md` (8 kill points; odds of $15K+ profit under 10%).
- Explored a pivot: hosted MCP "Amazon PPC brain" for Claude/ChatGPT + MCP Apps in-chat widgets + content hub + weekly "Rufus Ads Index" + LinkedIn founder funnel + persona mascot + OAuth/plan-gated billing with capped lifetime deals.
- Research found the MCP pivot is already crowded (DataDoe, PPC Prophet/ppcgpt, Agent Central, Helium 10 MCP, Teikametrics, Pacvue, Seller Labs, Coupler, Laurence, Adbrew, WisePPC, Amazon official).
- Earlier the same day: competitor map (`docs/COMPETITORS.md`), Rufus renamed Alexa for Shopping (May 13, 2026), cold email warmup explained, domain keyword advice (brand > keyword; put "Amazon" in URLs/titles, not the domain).

**Status:** Amazon direction **ON HOLD. Do not build.** Praveen will decide between: (1) distribution play, (2) another idea from the idea bank, (3) a non-PPC Amazon gap.

**Next steps:** wait for Praveen's decision. If he returns, start from the options at the end of `docs/KILL-MEMO.md`.

**Numbers:** revenue $0 · marketing costs $0 · emails sent 0 · nothing purchased (domains, lead DB, inboxes all still pending)

---

## 2026-11-16 · Planning session (Claude, claude.ai)
**What happened**
- Read the hackathon rules (summary page; the full rules page couldn't be fetched). Key points: profit-scored; refunds, fees and paid marketing deducted; AI/hosting/software not deducted; annual plans count in full; Razorpay supported; courses, agencies and services not allowed; solo only.
- Explored many ideas (see `100k-hackathon-ideas.md`). Parked Wrapped (another person is doing it; crowded). Dropped courses (not eligible).
- Researched pain points for Amazon sellers, Shopify owners, indie hackers and vibe coders, plus Amazon account manager job demand and agency vs in-house economics.
- **Chose:** AI Junior Account Manager for Amazon brands. Wrote the PRD v2 with an Ads pillar (incl. Rufus Sponsored Prompts auditor and AI Ads Copilot), a Listings/Rufus pillar, an Account health/profit pillar, plus an outbound email engine and a deep SEO/AEO plan.
- Domain check (not purchased): sellermedic.com, adleak.com and listingdoc.com are taken. sellermedic.net and adleak.net were available at $19.

**Decisions:** see `docs/DECISIONS.md`.

**Next steps (Nov 16–17)**
- [ ] Pick the brand name; buy the main domain + 2–3 sending domains (Cloudflare/Porkbun/Namecheap)
- [ ] Set up inboxes, SPF/DKIM/DMARC, start warmup immediately
- [ ] Razorpay (individual, PAN) + Polar; connect TrustMRR; install the hackathon tracker
- [ ] Choose and buy the lead database; verify emails; log the cost
- [ ] Scaffold Next.js app per `CLAUDE.md`; build A1 Ad Waste Finder first
- [ ] Apply for an Amazon Ads API developer app under the new business

**Blockers / open questions**
- Is the lead DB / sending tool counted as "paid marketing"? Check the full rules.
- Brand name not chosen yet.

**Numbers:** revenue $0 · marketing costs $0 · emails sent 0
