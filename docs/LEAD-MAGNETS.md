# Lead magnets: 10 free tools at rocco.works/free

Built Nov 25, 2026. Index: **rocco.works/free**. Each tool is a real working product, not a landing page.

## How every tool works
1. Seller drops reports they already download from Amazon (or types numbers / pastes text). Files are read **in the browser**, never uploaded.
2. "Try it with a sample account" fills everything in one tap (for people who just want to see it).
3. Result: score/grade + headline + stats + **first 3 findings free**.
4. **Remaining findings unlock with an email** (`LeadCapture`, `lead_magnet` = the tool slug, so `/admin/leads` shows which tool each lead came from).
5. Share buttons (X, LinkedIn, copy) with a line that hides private numbers.
6. Hire CTA with the honest connect note: sales and stock within hours; Amazon takes up to 48 hours to send ads history the first time.

Code: engine `lib/magnets.ts` (pure, tested in `lib/magnets.test.ts`), UI `components/magnets/MagnetTool.tsx`, pages `app/free/[slug]`, AI `lib/magnets-ai.ts` + `lib/prompts/magnets.ts` via `POST /api/magnets` (rate-limited 8 per visitor / 10 min, 400/hour site-wide). AI only sees summary numbers (roast) or pasted text (advice); rules take over if the AI is off or limited.

| # | Tool | URL | Needs | Hook |
|---|---|---|---|---|
| 01 | Amazon Financial Health Check | /free/amazon-health-check | Business report + search terms (+ margin) | 0–100 score, TACoS, ACoS vs break-even, conversion vs typical |
| 02 | Roast My Amazon Account | /free/roast-my-amazon-account | Search terms | Savage AI roast (Claude) of real numbers + grade |
| 03 | The Agency Audit | /free/amazon-agency-audit | Search terms (best) or campaign report × 2 periods (+ fee) | Did ACoS/waste move; burners never blocked |
| 04 | Second Opinion on Your AI's Ad Advice | /free/ai-ad-advice-second-opinion (old /free/claude-vs-rocco redirects) | Pasted AI advice + search terms | Each move: agree / careful / don't / can't check |
| 05 | Amazon Seller Wrapped | /free/amazon-seller-wrapped | Business report for any range (+ search terms) | Tap-through story (see below); share link /w/<code> + story/post images |
| 06 | Am I Overpaying? | /free/am-i-overpaying-amazon | Numbers or reports | vs **labelled typical ranges** + fee gap to $279/mo |
| 07 | Money Leak Detector | /free/amazon-money-leak-detector | Search terms (+ more) | $/month and $/year leaking |
| 08 | What Actually Worked? | /free/what-actually-worked-amazon | Campaign report × 2 periods | Campaigns better/worse ("moved, not why") |
| 09 | Could I Fire My Agency? | /free/could-i-fire-my-amazon-agency | Checklist + fee | % automatable, honest about what needs people |
| 10 | Rocco Watches Your Business | /free/rocco-watches-your-business | Search terms (+ more) | The texts Rocco would have sent this week |

**Honesty guardrails (keep):** typical ranges are labelled as published guidance that varies by category; period comparisons say "moved, not why"; roast is savage about numbers, never the person; fire-my-agency says plainly that creative, DSP and calls need people.

## Seller Wrapped v2 (Nov 25): a story, not a card
Engine `lib/wrapped.ts` (tested in `lib/wrapped.test.ts`), player `components/magnets/WrappedStory.tsx`, images `lib/wrapped-image.tsx`.
- **Free slides:** units sold + pace ("one every 22 minutes"), sales + average sale (if shown), shoppers + conversion, MVP share + "N of M products made 80% of the money", seller personality with the reason.
- **Unlocked by email (8 more):** hidden gem (converts ≥1.5× average on little traffic), leaky bucket (big traffic, low conversion → units/$ it would add), zombies (traffic, zero sales), someone else's Buy Box, search of the year + "N searches made half your ad sales", donation to Amazon (wasted spend = price of N of your own products), most expensive click, ads vs organic share, Rocco's resolution for next year (biggest provable lever).
- **10 personalities**, chosen by rules from the numbers: One-Hit Wonder, Generous Donor, Ad Junkie, Closer, Window Display, Sniper, Organic Legend, Collector, Accountant, Grinder.
- **Sharing:** short link `rocco.works/free/amazon-seller-wrapped/w/<code>`; the code is numbers only (persona, units, pace, top share, conversion, period; sales only if the seller shows them). No product names or searches ever leave the device. The link opens a page with the card + "Get my Wrapped"; preview image = 1200×630 post card. Buttons to download the 1080×1920 story image and the post image.
- Sample = a 12-product year (`public/samples/business-report-year.csv`).

## Trust line (on every upload)
Green bar above the upload boxes + a lock line inside each box: "Your reports are never uploaded. Rocco reads them right here on your device…". Only exceptions, stated where they happen: the pasted advice text (#04) and summary numbers for the AI roast (#02) go to Rocco's AI; nothing is stored.

## Agencies: buyers AND the audience's question (decided Nov 25)
#03 and #09 stay live. Each shows a note above the tool: *"No offence, agencies. This is a question plenty of brand owners ask themselves quietly; Rocco is just asking it out loud…"* and invites agencies to run it on their own clients. FAQ "Is this anti-agency?" answers no. When pitching agencies (GTM channel 8), lead with the other 8 tools and offer #03 as a client-reporting tool; don't send #09 to agencies.

## #03 data check (Amazon)
- The tool **compares results from two uploaded reports**; it does not need Amazon's change history.
- Amazon keeps about **65 days** of search term reports and about **95 days** of campaign reports, so an older "before" comes from the campaign report (supported) or the agency's own exports.
- Amazon's change history exists (console: campaign → History tab; Ads API change history for Sponsored Products and Sponsored Brands, about 90 days, no "who changed it"; not Sponsored Display). Pointed to in the tool's FAQ. Not wired into Rocco yet; a possible "what changed" view for connected accounts later (via DataDoe if it exposes it, unchecked). The 90-day figure comes from third-party docs; check it against Amazon's official docs before quoting it anywhere public.

## Posting plan (ask before any paid boost; organic only)
Use `?utm_source=<reddit|linkedin|x>&utm_medium=social&utm_campaign=free-tools&utm_content=<slug>` on every link.

**Reddit** (r/FulfillmentByAmazon, r/AmazonSeller, r/AmazonFBA): most ban self-promo. Post the *finding*, not the product; link only where rules allow or when asked in comments. Check each sub's rules first.
> **I built a free tool that roasts your Amazon ads. Ran it on a sample account: 25% of spend went to searches that never sold.**
> Biggest burner was a "dishwasher safe plastic" search on a bamboo board: 64 clicks, $91, zero orders. It reads the search term report in your browser (nothing uploaded) and grades you A–F. Happy to run anyone's numbers if you want to drop your grade below.

**LinkedIn**
> Most Amazon sellers I talk to can't answer one question: *what did my agency actually change?*
> So I built a free Agency Audit. Upload the same search term report for two periods. It shows whether ACoS and wasted spend moved, and which money-burning searches were never blocked in either period.
> Free, no sign-up to try, files stay in your browser: rocco.works/free/amazon-agency-audit

**X (thread starter)**
> I built 10 free tools for Amazon sellers. No sign-up, files never leave your browser.
> 1/ Roast My Amazon Account: savage, but every joke is a real number from your report.
> 2/ Second opinion on your AI's ad advice: paste what an AI assistant told you to do with your ads; it checks each move against your data. In our test, 1 of 7 would have blocked a search with 30 orders.
> 3/ Amazon Seller Wrapped: your seller persona as a shareable card (sales hidden by default).
> All 10: rocco.works/free

Best openers by channel: Roast + Wrapped (X, shareable), Agency Audit + Could I Fire My Agency (LinkedIn), Leak Detector + Second Opinion (Reddit, answer-style).

## Not done / to check
- AI roast and advice extraction need `ANTHROPIC_API_KEY` live (already used elsewhere). Without it the rule versions run.
- Wrapped share image: `/api/magnets/card?d=…` (used as og:image on shared links). Check one shared link in X's and LinkedIn's post inspectors after deploy.
- Peer comparison ("sellers like you") stays off until there are at least 10 opted-in accounts (lib/rules/benchmarks.ts).
