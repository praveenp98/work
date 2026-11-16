# CLAUDE.md: project memory for Claude Code

Read this first in every session. Then read `docs/PROGRESS.md` (latest entries at the top) before doing anything.

## What this repo is
Praveen's workspace for the **Ship or Die $100K Hackathon** (Nov 16 – Dec 16, 2026, profit-scored, solo entry).
Chosen product: **AI Junior Account Manager for Amazon brands**, a self-serve SaaS covering ads (incl. Rufus Sponsored Prompts), listings/Rufus visibility, and account health/profit.

> **STATUS (Nov 17, 2026, 02:00 IST): no product chosen. All earlier ideas (incl. Amazon) are killed for selection. Do not build anything.** Read `docs/EXPLOSIVE-IDEAS.md` and wait for Praveen to choose.

## Source-of-truth files
| File | Purpose |
|---|---|
| `amazon-seller-copilot-prd.md` | The PRD: product map, pricing, GTM (outbound + SEO/AEO), tech plan, 30-day plan. **Follow it.** |
| `100k-hackathon-ideas.md` | All ideas considered and why they were dropped/parked. Don't revive dropped ideas without asking. |
| `docs/MY-PICK.md` | Claude's own pick to win + the 15-minute decision test. Read first. |
| `docs/EXPLOSIVE-IDEAS.md` | Latest: all old ideas killed; two new viral plays (Shaadi Party Kit, Hackathon Launchpad + Throne). Read first. |
| `docs/ODDS-RANKING.md` | All ideas ranked by honest odds of $15K+ and of winning. |
| `docs/KILL-MEMO-TREND-STUDIO.md` | Kill + fix for Desi AI Trend Studio → AI Shaadi & Occasion Studio. |
| `docs/KILL-MEMO.md` | Why the Amazon idea and its MCP pivot are on hold, plus the open options. Read first. |
| `docs/AMAZON-GAPS.md` | Amazon problems outside the MCP connectors (AI-shopping invisibility, CPSC eFiling, tariffs). |
| `docs/COMPETITORS.md` | Competitor map, pricing, gaps and positioning. |
| `docs/GTM-PLAYBOOK.md` | All marketing channels, buyer targets per channel, offers, daily rhythm, cold email rules. |
| `docs/PROGRESS.md` | Running history log. **Append an entry at the end of every session.** |
| `docs/DECISIONS.md` | Decisions with dates and reasons. Add one whenever a choice is made. |

## Hard rules (hackathon eligibility; breaking these can disqualify)
1. **New business only.** Never use the ShelfPilot or FBAmz names, the fb-amz.com domain, agency branding or agency payment accounts in this product.
2. **Self-serve software only.** No services, consulting, "done for you" or call-booking flows.
3. **Profit = revenue − refunds − chargebacks − payment fees − paid marketing.** AI/API, hosting and software costs are not deducted. Annual upfront plans count in full, so prefer annual plans.
4. **Log every marketing cost** (lead DB, ads, commissions, Apollo credits) in `marketing_costs` / `docs/PROGRESS.md`.
5. Payments only via providers TrustMRR supports (Razorpay for INR, Polar/Stripe for USD). The hackathon traffic tracker must be installed on every page before traffic.
6. No scraping Amazon. Inputs are user uploads or official Amazon APIs. Any account change needs explicit user approval, is logged, and is reversible. Follow Amazon's Agent Policy.
7. Don't put Amazon trademarks (Amazon, Rufus, FBA, Sponsored Prompts) in the brand or domain.
8. Don't use the Shopify connector for this project (it's tied to an unrelated store).

## Tech conventions (once code exists)
- Next.js App Router + TypeScript, deployed on Vercel. Server-render all tool/SEO pages.
- Supabase for auth/DB/storage. Uploaded files auto-delete after 24h.
- Rules engine lives in `lib/rules/` as pure, unit-tested functions (negatives, harvest, bid formula with ±20% cap, budget shift, restock formula).
- Report parsers live in `lib/parsers/` with report-type detection by header row. Add a fixture CSV for every report type in `fixtures/`.
- Claude prompts live in `lib/prompts/` as versioned templates; never inline long prompts in components.
- Every tool = `app/tools/<slug>/page.tsx` (SEO page + tool UI) + a JSON-LD block + an FAQ section. Register it in `lib/tools.ts` so the sitemap and llms.txt pick it up.
- Secrets in env vars only. Never commit keys. Encrypt Amazon API tokens at rest.

## How to work
- Before building, check the PRD build plan (section 10) for what's due now.
- Ship the smallest working version, test with a fixture, then polish.
- Praveen's standing instruction: update the repo docs after **every** discussion, not just at session end, and push to `main`.
- At the end of each session: update `docs/PROGRESS.md` (what shipped, what's next, blockers, numbers) and commit.
- Ask Praveen before: spending money, sending any email to leads, changing pricing, or anything touching a live Amazon account.
