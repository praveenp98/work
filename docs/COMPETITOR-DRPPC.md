# Competitor: Dr. PPC (drppc.ai), launched ~Nov 23, 2026

Source: their public site repo (github.com/kfree108/drppc-site, last commit Nov 23 2026, 174 pages), read Nov 24. All their numbers are their own marketing; nothing independently verified.

## Who
- **Full Circle** (Amazon agency, founder **Ken Freeman**). Dr. PPC is software inside their platform **Full Circle Orbit** (signup at fullcircleorbit.com).
- Claims: $500M+ Amazon revenue managed, 100+ brands, logo wall (HexClad, Ridge, BK Beauty, Beardbrand, Epic Gardening, The Woobles, Mighty Paw…). Portfolio stats: "$8.25 sales per $1 of ads", "+44% US sales", "$19.0M biggest month", all from the *agency's* managed brands, not from the AI.
- A family of AI "agents" is coming: Ava (brand manager, included), Bruno, Dr. DSP, Dr. Shield, Dr. Stock, Jacob. They're building a suite, PPC first.

## Pitch
- Headline: **"Opus 5.5 runs your Amazon PPC."** Sub: "A genius-level PPC manager working every single day, no PPC expertise needed. Built on the playbooks of an agency that has managed $500M+."
- Doctor metaphor throughout: symptoms, rounds, patient chart, prescription, "second opinions" FAQ. 2:44 launch film with the founder.
- Core argument: "Most ad accounts aren't sick. They're unattended." Monthly agency call vs daily rounds. Same argument as Rocco.
- Promises **process, not results**: every change has a reason, a measurement window and a **rollback trigger**. "Can you guarantee ACoS? No, be careful with anyone who does."
- **Autonomy ladder**: Level 1 approve every move → Level 2 act inside guardrails → Level 3 fully autonomous.
- **Goal per ASIN** (profitability / growth / balance), managed to contribution profit, not ACoS.
- Shows: search-term table with an action per term, bid/harvest/top-of-search proposals, intraday budget pacing ("Serum · Exact will cap out by ~6 PM, +$40"), branded vs non-branded "lane separation" score, keyword rank, inventory forecast, P&L. All **demo data**.

## Price
- **$299/mo + 2% of ad spend**, month-to-month. **First 30 days for $1.** Orbit + Ava included. Agency "Partner" clients: base fee waived (2% only).
- At $10k/mo ad spend: $499/mo = $5,988/yr. At $30k: $899/mo = $10,788/yr. At $50k: $1,299/mo = $15,588/yr.
- Sales-assisted too: "Book a 20-minute demo".
- Calculator: compares their fee to a $150k/yr senior hire; break-even "if TACoS improves 0.44 pts".

## Distribution
- **174 SEO pages**: 100 "learn" articles, 53 competitor pages (Helium 10, Jungle Scout, Perpetua, Pacvue, Quartile, BidX, Adtomic, Intentwise, Prestozon, DataHawk… "pricing", "review", "alternative", "vs"), free calculators, statistics, glossary, a 2027 Display recount guide, founder author page. robots.txt welcomes GPTBot, ClaudeBot, PerplexityBot (AEO).
- Their agency client base = warm launch audience. That's their lead.

## Where they're strong (be honest)
1. Credibility: real agency, real logos, founder on video, big portfolio numbers.
2. **$1 for 30 days**: near-zero risk to try. Rocco asks $1,190 upfront (7-day refund).
3. Autonomy ladder + automatic rollback triggers + per-ASIN goals. Rocco has approve-only, a one-week result check and manual undo, per-brand target ACoS.
4. Intraday budget pacing, dayparting, branded/non-branded lanes, full analytics OS.
5. SEO/AEO volume (174 pages on day one) and comparison pages.

## Where Rocco wins
| | Dr. PPC | Rocco |
|---|---|---|
| Price at $10k/mo ad spend | $5,988/yr | **$1,190/yr** (5× cheaper) |
| Price at $50k/mo ad spend | $15,588/yr | **$1,190/yr** (13× cheaper), flat, never a % of spend |
| Scope | Ads (other agents later) | Ads **and** Seller Central: restock (one-tap FBA plan), Buy Box, suppressed listings, conversion problems |
| Accounts | per account | 3 Amazon accounts included, whole team, every approval named |
| Marketplaces | US-centric (PT clock, $) | Every marketplace, local currency, India-first pricing via PPP |
| Where you approve | A dashboard OS (Orbit), separate signup domain | One screen of today's jobs + nudges on iMessage / WhatsApp / Slack |
| Incentive | % of ad spend: earns more when you spend more | Flat: no reason to push spend |
| Proof shown | Agency portfolio + demo data | Your own account's change log, measured a week later, "Before Rocco" history read |
| Setup | Two brands/domains, demo calls | Self-serve: Google → pay → connect Amazon, 2 minutes |

The %-of-spend model is their soft spot: the biggest spenders pay the most, and "the tool earns more when you spend more" is an easy, true line.

## What to do (ranked)
1. **Ride their launch in search:** a factual `/compare/dr-ppc` page ("Dr. PPC alternative / pricing / vs Rocco") with the cost table above, dated and sourced; plus an answer page "How much does an AI Amazon PPC manager cost?" comparing flat vs %-of-spend. They'll create search demand for "AI PPC manager"; we catch the price-sensitive half. (Needs Praveen's OK: names a competitor.)
2. **Cost calculator on /pricing:** "What you'd pay a %-of-spend tool vs Rocco" with an ad-spend slider. Turns our biggest edge into a number.
3. **Answer the $1 trial without breaking annual-upfront:** keep the 7-day full refund but say it louder ("Try it for a week. Not useful? Full refund, one email.") at every price. Pricing changes need Praveen's call; annual upfront still wins the profit contest.
4. **Close product gaps that matter in a side-by-side:** (a) per-product goal (profit / growth / balance), (b) automatic "undo if it got worse" after the measurement window (with a heads-up), (c) intraday "budget will run out by 3 PM" alert (DataDoe refetches ads at 8am/1pm/4pm). Skip full autonomy for now (Amazon Agent Policy + trust).
5. **Content:** X/LinkedIn post riding the launch: "AI PPC managers are here. Here's why yours shouldn't charge % of your ad spend." No dunking; welcome the category.
6. Acquisition angle ("until they absorb me"): a clean, fast-growing self-serve product with flat pricing, global marketplaces and Seller Central coverage is exactly the gap an agency suite would buy. Track MRR on TrustMRR, keep the codebase clean, keep DataDoe as a swappable layer.

## Done (Nov 24)
- Price → $279/mo or $2,790/yr (just under their $299 base; flat).
- /compare/dr-ppc (table, calculator, honest "pick them if", FAQ JSON-LD), /answers/ai-amazon-ppc-manager-cost, slider on /pricing (`components/SpendCompare.tsx`, numbers in `lib/competitors.ts` with the checked date).
- Guarantee said louder everywhere ("Try it 7 days… every cent back").
- Goal per product (Goals card on the dashboard; profit ×0.8 / balance / growth ×1.3 of target ACoS, matched by a word in campaign names; used by bids, harvests, budgets and the weekly result check).
- Undo in Amazon for bid and budget changes (change log button) + opt-in "undo automatically if it got worse" after the one-week check. Negatives / new campaigns: still steps (we don't store Amazon's new IDs yet).
- Midday budget alert: cron 18:30 UTC (US/CA/MX), one message per account per day to teams with reminders on. Other marketplaces need Vercel Pro (hourly) or more daily crons.
- Post copy: docs/X-DRPPC.md.

## Parity+ (Nov 24, later)
- Matched (Nov 24, later): strategy at onboarding (main goal, target, margin → break-even, monthly ad budget limit, never-cut, product goals, autonomy, notes) said back as a plain-English plan; feeds the rules and every AI answer.
- Matched: autonomy ladder (3 levels), per-product goals, midday budget pacing (hourly, every marketplace), measurement window + undo on every change, a 2-minute demo film + clickable demo account (/demo).
- Still theirs: dayparting, a full analytics suite (Orbit), agency logos/portfolio numbers, founder on camera. Our counter: flat price, Seller Central jobs (restock plans), team + messaging, every marketplace.
