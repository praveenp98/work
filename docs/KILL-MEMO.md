# Kill memo: Amazon "AI Junior Account Manager" (and the MCP pivot)

Date: Nov 17, 2026 · Status: **ON HOLD (do not build)** until Praveen decides the next direction.

---

## Part 1: Why the original PRD v2 idea won't win the hackathon

1. **The headline hook is weak.** "You're already paying for Rufus ads" sounds big, but Sponsored Prompts are under 1% of clicks. Audits will show small waste. Amazon already lets advertisers see and pause each prompt, and PPC tools publish free how-tos. Any PPC tool can add this report quickly.
2. **The AI trend replaces the product.** Sellers who use AI for ads can just ask Claude/ChatGPT plus Amazon's free MCP server and free skills/prompts (e.g. free Claude appeal skills). Under ~$2K/mo ad spend, Amazon's native automation is usually enough, and cheap tools exist (Prism $29+, Scale Insights $78+, AdLabs $40+).
3. **The revenue plan contradicts itself.** ~$43K relied on 12 Brand annual plans ($1,499) whose headline feature (Ads Copilot) depended on Ads API approval, scheduled Dec 8–12 "only if approved."
4. **The timeline is too short for B2B.** As of Nov 17: no name, domain or code. Full cold-email volume only from ~Dec 1 (warmup), ≈5,000 sends. $1M–15M brands don't buy $1,499 annual from a 2-week-old site, especially when it means uploading their ad data. Realistic: ~10–25 buyers, mostly low-tier.
5. **Credibility can't be used.** Trust lives in the agency (ShelfPilot/FBAmz), which hackathon rules force us to hide. Same rules, prompts and client list risks looking like a "productized agency" in manual review → disqualification risk.
6. **Scope is too large for one person:** ~25 tools, 3 pillars, white-label, API connect, programmatic SEO, 9 inboxes, 14 channels, plus agency client work.
7. **Wrong audience for the contest.** The hackathon buzz is indie hackers on X, not Amazon sellers, so no lift from the contest itself.
8. **Growth channels cost score.** Lead DB, Apollo credits, commissions and boosts are deducted as paid marketing; SEO pays off mostly after Dec 16.

**Verdict:** a good long-term SaaS, a bad 30-day contest entry. Estimated odds of $15K+ verified profit by Dec 16: under 10%.

---

## Part 2: The pivot we explored (Nov 17, ~00:50–01:05)

**Reframe:** don't sell a tool to cautious brands; sell "the brain of an experienced Amazon operator" to people already running ads with AI, and build a LinkedIn persona around unique data.

- **Hosted MCP server ("Amazon PPC brain"):** the user adds it as a connector in Claude/ChatGPT (alongside Amazon's own Ads MCP for bigger sellers). Runs real agency rules on uploaded reports (negatives, harvesting, ±20% bid caps, budget shifts, Sponsored Prompts audit) → bulk sheet + explanation. Works without Amazon API approval.
- **Visual layer via MCP Apps** (the official MCP extension that renders interactive widgets inside Claude and ChatGPT): live "brain at work" progress cards, a big "$X/month leaking" result card with a celebration, approval checklist, bulk-sheet download, streak cards. No big standalone app needed.
- **Website:** content hub (strategy articles, glossary, weekly index), "Add to Claude/ChatGPT" setup page, billing/account, simple web-upload fallback, animated hero demo.
- **Data moat:** weekly "Rufus Ads Index" built from anonymized audits, published on LinkedIn.
- **LinkedIn funnel:** founder face + story (no agency branding), 1–2 posts/day (Index Monday, teardown Tuesday, "Claude ran my Amazon account" diary, rule changes, "Audit Friday" comment-to-DM), 20 min/day commenting on big Amazon creators, 20–25 personal connection requests/day, LinkedIn Live audits.
- **Mascot/persona idea:** a Boardy-style named AI persona (e.g. "Penny") that users message; must never look official/affiliated with Amazon.
- **Charging:** OAuth sign-in on the connector → server checks plan per request; free = 3 summary audits/month; paid unlock via checkout on our site (Polar USD / Razorpay INR → TrustMRR); webhook updates plan. Offers: Founding Operator lifetime $299, Founding Agency lifetime $799 (capped ~150 seats); later $29–49/mo or $299/yr.

## Part 3: Why the pivot is also crowded (research Nov 17)
"AI brain for Amazon PPC via MCP" already exists:
- **DataDoe:** PPC software run through Claude/ChatGPT; harvests terms, adds negatives, adjusts bids by profit, schedules dayparting
- **PPC Prophet / ppcgpt:** hosted Amazon Ads MCP, 27+ tools, rule-based bid/keyword automation
- **Agent Central:** "Turn Claude into an Amazon PPC agent," guarded mutation tools
- **Helium 10 MCP** (free on Diamond, live July 16, 2026, plus a free Claude skill), **Teikametrics MCP** (read-only), **Pacvue MCP**, **Seller Labs MCP** (+ 82 prompts), **Coupler.io**, **Laurence** (Marketing Stream), **Adbrew**, **WisePPC**, Amazon's official Ads MCP
- Free Claude prompts already run full search-term audits

**Conclusion:** the product would not be the edge. Only distribution (LinkedIn persona + Rufus Ads Index), a niche (Sponsored Prompts, white-label for small Indian/Filipino agencies) and price could differentiate, against funded incumbents, in 29 days.

---

## Options on the table (Praveen to decide)
1. **Continue as a distribution play:** LinkedIn persona + Rufus Ads Index + Sponsored Prompts niche + capped lifetime deals for agencies.
2. **Step back** to another idea in `100k-hackathon-ideas.md` (Desi AI Trend Studio and Launch Grade still standing).
3. **Hunt for an untouched Amazon gap,** specifically problems the new MCP connectors don't cover (not PPC).
