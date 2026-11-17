# CLAUDE.md: project memory for Claude Code

Read this first in every session. Then read `docs/PROGRESS.md` (latest entries at the top) before doing anything.

## What this repo is
Praveen's workspace for the **Ship or Die $100K Hackathon** (Nov 16 – Dec 16, 2026, profit-scored, solo entry).
Chosen product: **Amazon Brain** — a hosted MCP server + mascot that runs an Amazon account alongside Claude/ChatGPT connectors (see STATUS below).

> **STATUS (Nov 17, 2026, 19:30 IST): EXECUTING. Rocco = your team's AI Amazon teammate: text him (iMessage, Boardy-style one-screen homepage) or use him in Claude/ChatGPT next to Amazon's connectors. One plan: "Hire Rocco" $99 +$10/5 sales (cap $499). Text engine built (dry-run until LoopMessage keys). Blockers: Vercel deploy + DNS + env (Supabase, DODO_API_KEY, LoopMessage, secrets), Dodo KYC + webhook, tracker check, Amazon API applications (`docs/GO-LIVE.md`).**

## Source-of-truth files
| File | Purpose |
|---|---|
| `amazon-seller-copilot-prd.md` | The PRD: product map, pricing, GTM (outbound + SEO/AEO), tech plan, 30-day plan. **Follow it.** |
| `100k-hackathon-ideas.md` | All ideas considered and why they were dropped/parked. Don't revive dropped ideas without asking. |
| `docs/PRICING-MODEL.md` | **Pricing (approved, live):** single Founding Lifetime plan on a price ladder. |
| `docs/DODO-SETUP.md` | **Payments:** Dodo products (one-time, license keys), env vars, test purchase, TrustMRR. |
| `docs/MOAT.md` | Moat (memory/proof, benchmarks, audience, personality), Rocco Daily content format, conversion levers. |
| `docs/POLAR-SETUP.md` | Obsolete (Polar can't onboard individuals in India). |
| `docs/LAUNCH-SETUP.md` | Brand/domain shortlist, pre-warmed email infra, lead list sources, budget. |
| `docs/AMAZON-BRAIN-PLAN.md` | **Current plan v2:** $50K math, two lanes (Amazon MCP + no setup), mascot, 12 distribution engines, email, testing loop. |
| `docs/KILL-MEMO-HOMEBUYER.md` | Homebuyer Case Builder killed for contest (market ~20K filers/yr). |
| `docs/HIGGSFIELD.md` | Higgsfield: kill as product wrapper; keep as ad-creative engine. |
| `docs/KILL-MEMO-ADS-TRUSTMRR.md` | Kill memo: TrustMRR-for-ads (Ad Library API can't feed it). |
| `docs/JOBS-TO-AUTOMATE.md` | Latest: jobs AI can automate, scored on reach/convert/market. |
| `docs/HIGH-TICKET-SCAN.md` | High-ticket scan (Homebuyer Case Builder later killed, see kill memo). |
| `docs/SONG-GIFT-COMPETITORS.md` | AI song gift competitors + how to check their ads. |
| `docs/MY-PICK.md` | Claude's own pick to win + the 15-minute decision test. Read first. |
| `docs/EXPLOSIVE-IDEAS.md` | Latest: all old ideas killed; two new viral plays (Shaadi Party Kit, Hackathon Launchpad + Throne). Read first. |
| `docs/ODDS-RANKING.md` | All ideas ranked by honest odds of $15K+ and of winning. |
| `docs/KILL-MEMO-TREND-STUDIO.md` | Kill + fix for Desi AI Trend Studio → AI Shaadi & Occasion Studio. |
| `docs/KILL-MEMO.md` | Why the Amazon idea and its MCP pivot are on hold, plus the open options. Read first. |
| `docs/AMAZON-GAPS.md` | Amazon problems outside the MCP connectors (AI-shopping invisibility, CPSC eFiling, tariffs). |
| `docs/COMPETITORS.md` | Competitor map, pricing, gaps and positioning. |
| `docs/GTM-PLAYBOOK.md` | All marketing channels, buyer targets per channel, offers, daily rhythm, cold email rules. |
| `docs/E2E-TEST.md` | Ordered end-to-end launch test checklist. |
| `docs/GO-LIVE.md` | Launch checklist: deploy, payments, tracker, env vars (what Praveen must set up). |
| `docs/LAUNCH-KIT.md` | Copy-paste listing text, assets and directory checklist (also live at /press; source `content/launch-kit.json`). |
| `docs/AMAZON-API-APPLICATIONS.md` | Paste-ready Amazon Ads API + SP-API applications (for a text-only Rocco). |
| `docs/BOARDY-STUDY.md` | How Boardy grew + plan for a texting Rocco (pending decisions). |
| `docs/X-DAY1.md` | Day-1 X posts for Rocco + Praveen, with UTMs. |
| `docs/PROGRESS.md` | Running history log. **Append an entry at the end of every session.** |
| `docs/DECISIONS.md` | Decisions with dates and reasons. Add one whenever a choice is made. |

## Hard rules (hackathon eligibility; breaking these can disqualify)
1. **New business only.** Never use the ShelfPilot or FBAmz names, the fb-amz.com domain, agency branding or agency payment accounts in this product.
2. **Self-serve software only.** No services, consulting, "done for you" or call-booking flows.
3. **Profit = revenue − refunds − chargebacks − payment fees − paid marketing.** AI/API, hosting and software costs are not deducted. Annual upfront plans count in full, so prefer annual plans.
4. **Log every marketing cost** (lead DB, ads, commissions, Apollo credits) in `marketing_costs` / `docs/PROGRESS.md`.
5. Payments only via providers TrustMRR supports (Dodo Payments for USD; Razorpay for INR). The hackathon traffic tracker must be installed on every page before traffic.
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
