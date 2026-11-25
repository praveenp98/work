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
| 03 | The Agency Audit | /free/amazon-agency-audit | Search terms × 2 periods (+ fee) | Did ACoS/waste move; burners never blocked |
| 04 | Claude vs Rocco | /free/claude-vs-rocco | Pasted AI advice + search terms | Each move: agree / careful / don't / can't check |
| 05 | Amazon Seller Wrapped | /free/amazon-seller-wrapped | Business report (+ search terms) | Persona card, sales hidden by default; shared link shows the card as preview image |
| 06 | Am I Overpaying? | /free/am-i-overpaying-amazon | Numbers or reports | vs **labelled typical ranges** + fee gap to $279/mo |
| 07 | Money Leak Detector | /free/amazon-money-leak-detector | Search terms (+ more) | $/month and $/year leaking |
| 08 | What Actually Worked? | /free/what-actually-worked-amazon | Campaign report × 2 periods | Campaigns better/worse ("moved, not why") |
| 09 | Could I Fire My Agency? | /free/could-i-fire-my-amazon-agency | Checklist + fee | % automatable, honest about what needs people |
| 10 | Rocco Watches Your Business | /free/rocco-watches-your-business | Search terms (+ more) | The texts Rocco would have sent this week |

**Honesty guardrails (keep):** typical ranges are labelled as published guidance that varies by category; period comparisons say "moved, not why"; roast is savage about numbers, never the person; fire-my-agency says plainly that creative, DSP and calls need people.

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
> 2/ Claude vs Rocco: paste what ChatGPT/Claude told you to do with your ads; it checks each move against your data. In our test, 1 of 7 would have blocked a search with 30 orders.
> 3/ Amazon Seller Wrapped: your seller persona as a shareable card (sales hidden by default).
> All 10: rocco.works/free

Best openers by channel: Roast + Wrapped (X, shareable), Agency Audit + Could I Fire My Agency (LinkedIn), Leak Detector + Claude vs Rocco (Reddit, answer-style).

## Not done / to check
- AI roast and advice extraction need `ANTHROPIC_API_KEY` live (already used elsewhere). Without it the rule versions run.
- Wrapped share image: `/api/magnets/card?d=…` (used as og:image on shared links). Check one shared link in X's and LinkedIn's post inspectors after deploy.
- Peer comparison ("sellers like you") stays off until there are at least 10 opted-in accounts (lib/rules/benchmarks.ts).
