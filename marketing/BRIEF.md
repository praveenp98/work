# Rocco marketing brief

Read this before any marketing task, then `marketing/brand/BRAND.md` (positioning, one-liners, voice, word lists, naming). It is the standing brief for the `marketing` branch. This file is skipped by the copy lint because it quotes the banned phrases.

Last checked against the repo and the live site (rocco.works, rocco.works/pricing): Nov 22, 2026, hackathon day 7.

## Goal

- 100 paying sellers by Dec 16, 2026 (end of the $100K Ship or Die Hackathon, Nov 16 to Dec 16).
- Day N = days since Nov 16 + 1. Nov 22 = day 7. Use `hackathonDay()` from `config/offer.ts`.
- North-star metric: setup calls booked, then paid signups. (Open question on calls: see "Repo vs brief" below.)
- This branch builds marketing assets only. Nothing posts, sends or deploys. Praveen reviews and publishes.

## Product facts (the only facts allowed; for anything else read the live site or the repo, never guess)

- Rocco is "your AI Amazon manager: you approve, Rocco does the rest." Tagline: "Real work without the fluff."
- Connect Seller Central + Amazon Ads once, with Amazon's own sign-in through DataDoe, an Amazon-approved data partner. Rocco never sees the password. Access can be removed anytime in Seller Central.
- Every morning Rocco finds what to fix, ranked by money, as a few clear jobs:
  - block searches that waste money
  - fix bids that overspend (capped, explained, undoable)
  - turn winners into exact campaigns
  - move budget to what's profitable
  - stay in stock (restock warnings, ads eased on products that can't ship)
  - tidy campaigns (one naming system, one portfolio per product)
  - restock, listing and Buy Box problems come with exact steps
- Approve on the web dashboard, or by reply on iMessage, WhatsApp or Slack (reply YES to approve by text, after the first view on the site). Nudges every morning or Mondays.
- Rocco makes the change in Amazon: checked with Amazon first, logged (what, why, who approved, where), undoable, and measured a week later.
- Day one, Rocco reads the account's Amazon change history ("Before Rocco") so it knows what was tried before.
- It learns from skips: already done / not my strategy / too risky / not now.
- Teams: add teammates by email, they sign in with Google, every approval shows who made it.
- Every Amazon marketplace: US, UK, EU, Canada, India, Japan, Australia and more. The user needs no Claude or other AI.
- First fixes usually within hours of connecting. Full history backfill takes a day or two; Rocco only needs the last 30 days to start.
- Rocco is not affiliated with Amazon. Keep "Not affiliated with Amazon" on any page or asset that uses Amazon's name prominently.

### Price (never type these into an asset; read `config/offer.ts`)

- $1,190/year (= $99/mo billed yearly, 2 months free, saves $238) or $119/month.
- Whole team. 3 Amazon accounts included (each marketplace counts as one), +$49/mo each extra.
- Prices go up every 5 hires: +$10 a month, +$100 a year.
- 7-day money-back guarantee: "if you don't like the fixes I give you in your first 7 days, email hello@rocco.works and you get a full refund. No call, no forms."
- No free plan (reading an Amazon account costs real money to run).
- Secure checkout by Dodo Payments. Prices in USD; checkout shows local price.
- Time math on the site: 1 hour/day checking ads, bids and stock at $35/hour = $770/mo, vs Rocco at $99/mo. Always show the assumption (1 hr/day, $35/hr; the site multiplies by 22 workdays) when you use $770.

## Single source of truth

| What | Where | Notes |
|---|---|---|
| Plan prices, guarantee days | `lib/pricing.ts` (`PLAN`) | App code. Do not edit from this branch. |
| Everything an asset says about the offer | `marketing/config/offer.ts` | Imports `PLAN`. Adds price-rise step, accounts, time math, guarantee text, links, handles, `utm()`, `hackathonDay()`. |
| Sample account numbers and label | `marketing/config/sample.ts` | "Bamboo & Co". The only account numbers an asset may show. |
| Loading the config from Node scripts | `marketing/scripts/load-config.mjs` | Needs Node 22.18+. No packages. |

Price rise: it is applied by hand. Praveen raises both Dodo products and `PLAN` in `lib/pricing.ts` (docs/ROUTINE.md). `offer.ts` follows on its own; then re-render every asset. The step itself (+$10 / +$100 every 5 hires) is only page copy in the app (`components/start/ValueCalc.tsx`, `lib/help.ts`), so it is defined in `offer.ts` (`PRICE_RISE`).

"Hires left at this price" is live (`GET /api/price`, field `sold`; `hiresLeftAtThisPrice(sold)`). Never bake it into a rendered asset.

## Hard rules

1. Never invent numbers, customers, reviews, testimonials, logos, "trusted by", user counts or results. Missing number: leave a marked placeholder like `{{REAL_NUMBER}}` and list it in the task summary.
2. The sample account "Bamboo & Co" and its numbers (4 jobs worth ~$1,240/mo, $1,284 saved, 13x what I cost, $212/mo less wasted, Before Rocco: 214 changes in 90 days, and the rest of `config/sample.ts`) always carry a visible "Sample account" label in every frame, image or page where they appear.
3. Never use real seller account data (including Praveen's test accounts) in any asset unless Praveen says that seller agreed in writing. Blur or replace it.
4. No em dashes (U+2014) anywhere: copy, captions, scripts, emails, user-facing text. Use commas, periods, colons or "to".
5. Never write a 30-day guarantee. It is 7-day.
6. Don't claim Amazon endorses Rocco. "Amazon-approved data partner" refers to DataDoe only.
7. No competitor claims that can't be verified. Compare against categories ("data dashboards", "PPC agencies", "doing it yourself"), never named products.
8. Don't change product logic, billing, auth, DataDoe or cron code. Marketing pages may import existing UI components and copy. If shared code must be touched, stop and ask Praveen.
9. Nothing posts, sends emails or deploys.
10. Work on the git branch `marketing`. Small commits, clear messages. Large renders (mp4, png batches, pdf exports) go in `marketing/out/` (gitignored). Downloadable PDFs meant for the site go in `public/downloads/`.

Also from CLAUDE.md (hackathon eligibility): new business only (never ShelfPilot, FBAmz, fb-amz.com or agency branding); self-serve software only; log every marketing cost; no Amazon trademarks in the brand or domain; don't use the Shopify connector; ask Praveen before spending money or sending any email to leads.

## Voice

Praveen's voice (captions, posts, scripts, DMs, emails from him):
- casual, lowercase, blunt, short sentences. no em dashes. one emoji max.
- no hype words: "revolutionary", "game-changer", "unlock", "supercharge".
- Praveen is a solo founder in India building in public. X: @veenonx. Threads/IG: veenonig. Brand X: @roccoworks.

Rocco's voice (site, brand videos): first person "I", plain and confident. "I find what to fix. You tap approve. I make the change in Amazon, then check it worked."

On-screen text and site pages use normal sentence case like the site does.

## Filming limits

Praveen is new to filming. His own recordings use only three shot types:
- (A) phone propped up, face cam
- (B) built-in screen recording (Mac or phone)
- (C) one static desk clip (hands, laptop, coffee, same angle every time)

Videos are 25 to 60 seconds. Creator-style multi-scene videos (hook, quick cuts, captions, product UI, phone texts), not talking heads.

## Layout

```
marketing/
  BRIEF.md          this file
  config/offer.ts   price, guarantee, links, utm helper, hackathon day
  config/sample.ts  the sample account and its label
  video/            Remotion studio
  copy/             scripts, hooks, posts, threads, reddit, dms
  emails/           cold, lifecycle, lead magnet sequences
  carousels/        markdown sources + generator
  images/           post image templates
  ops/              calendar, trackers, targets CSVs
  scripts/          lint, pdf, helpers
  out/              renders, gitignored
public/downloads/   PDFs meant for the site
```

## Self-check for every task

Before saying a task is done:
1. Build or render what was made and inspect it: screenshot pages with Playwright, extract frames from videos with ffmpeg and look at them, convert PDF pages to images and look at them.
2. Run `node marketing/scripts/lint-copy.mjs` (and `--self-test` after changing the lint). It fails on: em dashes, "30-day money-back", "30-day guarantee", "30 day money", "free plan" offered as a feature, "trusted by", testimonial text outside the hidden proof slot, "plugs into Claude", any $ amount not in the allowlist (offer.ts + sample account + $770/$35), and a file that shows the sample account without the words "sample account".
3. List every placeholder left (the lint prints them) and every assumption made.

Proof slot: real, permissioned customer proof goes only between `<!-- proof-slot:start -->` and `<!-- proof-slot:end -->` (same two marker words in a JSX comment for tsx). The slot ships hidden until Praveen fills it with proof a seller agreed to in writing.

`lint-allow: <reason>` on a line skips only the dollar check on that line. It is for code (a regex with `$1`), never for copy. Every use is printed.

## Reusable components

Brand tokens: `app/globals.css` line 252 (`--bg #f4f2ee`, `--card #fcfbf9`, `--ink #1c2433`, `--muted #5d6676`, `--line #e2ddd5`, `--accent #1f6feb`). Fonts: Raleway (display, 400 to 600) and Inter (body), loaded with `next/font` in `app/layout.tsx`. Styles for every component below live in `app/globals.css` and `app/connect.css` (plain global CSS, class prefixes noted). Rocco art: `public/brand/*.png`, `public/icon.svg`.

"Outside Next.js" means: can it be imported into Remotion or a plain React/Vite page as is.

| What | File | What it shows | Outside Next.js? |
|---|---|---|---|
| Homepage hero copy | `app/page.tsx` L48 to 64 (inline JSX, `.h5-*`) | Kicker, h1 "I can run your Amazon business, try me.", CTA line, 3 proof ticks | No component. Copy the markup and CSS. |
| Hero flow | `components/home/HeroFlow.tsx` (`.hf`) | 4 steps lighting up in turn; approve step rotates web / iMessage / WhatsApp / Slack with a reply chip | Yes, no Next imports. Timing is `setInterval`, so for Remotion rebuild it frame-driven. |
| Morning card / jobs demo | `components/home/HeroDashboard.tsx` (`.hd`) | Sample dashboard: "4 jobs today, worth ~$1,240/mo", ROI strip, 3 jobs going Approve to Making to Done, restock job. Footer label "Sample account" | Yes, no Next imports. Same timing note. The "Sample account" footer is replaced by a progress line once a job is done: add a fixed label in any capture. |
| How a fix happens | `components/home/HowItHappens.tsx` (`.hsteps`, `.hphone`) | 3 steps + phone: morning check list, 3 fixes, YES reply and result a week later | Needs the `@/` alias (imports `RoccoHead`). CSS-animation and timeout driven. Its phone numbers ($4,120 sales and others) have no sample label on the site: do not reuse those numbers. |
| Skip reasons + ROI | `app/page.tsx` L87 to 92 (inline, `.hlearn`) | "Why skip this?" chips, "Noted", $1,284 saved, 13x | No component. Copy markup and CSS. |
| Change log | `components/home/LogDemo.tsx` (`.ld`) | 4 logged changes sliding in, first flips to "worked · $212/mo less wasted", then the "Before Rocco" line. Labeled "Bamboo & Co · example" | Yes, no Next imports. CSS `animation-delay` driven, so not frame-accurate in Remotion. |
| Data vs decisions table | `app/page.tsx` L24 to 30 (`VS`) and L114 to 117 (inline, `.vs`) | 5 rows: "Amazon data tools" vs "Rocco" | No component. Data array + markup to copy. Compares a category, not a named product. |
| Messages (iMessage / WhatsApp / Slack) | `app/page.tsx` L128 to 132 (inline, `.hmsg`) | 3 bubbles: morning nudge, "YES N1 G2", "Done in Amazon" | No component. Copy markup and CSS. No sample label next to it on the site: add one. |
| Pricing card (home) | `app/page.tsx` L142 to 155 (inline, `.price-card`) | $1,190 a year, or $119 a month, 6 ticks, guarantee line | No component. Imports `HireButton` (checkout sheet, needs the app's API). Rebuild from `offer.ts`. |
| Pricing card (pricing page) | `components/PricingPlans.tsx` (`.pc`) | Yearly / Monthly switch, $99/month, "save $238", guarantee, quick ticks, price-rise line | Not as is: imports `HireButton` (calls `/api/hire`) and `PriceRise` (calls `/api/price`). Rebuild from `offer.ts`. |
| Price rise | `PriceRise` in `components/start/ValueCalc.tsx` (`.vc-rise`) | "Prices go up every 5 hires: +$10 a month, +$100 a year." plus "N hires left at this price" (live count) | Renders anywhere, but "hires left" only appears when `/api/price` answers. |
| Countdown | `Urgency` in `components/start/ValueCalc.tsx` (`.vc-urgent`), logic in `lib/urgency.ts` | Live countdown to the next real selling event (Black Friday Nov 27, Cyber Monday Nov 30, last gifting week Dec 15) | `lib/urgency.ts` is pure (`nextEvent`, `countdown`, `urgencyLine`) and imports anywhere. The component uses `Date.now()` and needs the `@/` alias. Note: it counts down to selling events, not to the price rise. |
| Time calculator | `ValueCalc` in `components/start/ValueCalc.tsx` (`.vc`) | Slider 0.5 to 4 hours/day x 22 workdays x $35/hour vs Rocco's monthly price, two bars | Needs the `@/` alias (`@/lib/pricing`, `@/lib/urgency`). Fetches `/api/price` and fails quietly. `timeCost()` is exported and pure. |
| What I handle | `app/page.tsx` L15 to 22 (`JOBS`, inline `.hjobs`) | The 6 jobs with one-line descriptions | No component. Data array to copy. |
| FAQ | `app/page.tsx` L32 to 39, `app/pricing/page.tsx` L31 to 40, `lib/help.ts` | Safety, speed, what changes, marketplaces, guarantee, billing | Plain data. `lib/help.ts` is the long form (also at /llms-full.txt). |
| Rocco mascot | `components/Rocco.tsx` (`Rocco`, `RoccoHead`), `components/Raccoon.tsx` | SVG raccoon, poses hero / judge / party / wave, moods | Yes, pure SVG React. |
| App icons | `lib/brand-icons.ts`, `AppIcon` in `components/home/RoccoStage.tsx` | iMessage, WhatsApp, Slack and other marks | `brand-icons.ts` is plain data. `RoccoStage.tsx` pulls in `HireButton`. |
| Real dashboard cards | `components/dash/JobCards.tsx`, `RoiCard.tsx`, `ReminderCard.tsx` | The product's real job cards, ROI card, ping setup with message preview | Need the `@/` alias and call the app's API on click. Use for look only, fed with `config/sample.ts`. |
| Press screenshots | `public/brand/screenshot-home.png`, `-pricing.png`, `-dashboard.png`, `-changelog.png`, `public/og-v2.png` | Shots of the current site with the demo brand | Static images. `screenshot-playground.png` and `screenshot-setup.png` are from the old connector product: do not use. |

Not on the live homepage any more (old copy inside, do not reuse as is): `components/home/PhoneThread.tsx`, `WorkScreen.tsx`, `ApprovalFeed.tsx`, `DayWithRocco.tsx`, `RoccoStage.tsx`, `YourAI.tsx`, `HandsAndBrain.tsx`, `ReportsInbox.tsx`, `LiveRoastDemo.tsx`, `RoastTicker.tsx`, everything in `components/connect/`.

## Video studio

`marketing/video/` is a Remotion project with its own `package.json` (see its README). One JSON spec per video in `specs/`, three formats from one source (9:16, 4:5, 16:9), nine scene templates in `src/scenes/`, captions always on.

- Render: `cd marketing/video && npm run render -- --spec specs/demo.json --format all`. Output: `marketing/out/video/<spec>-<format>.mp4` plus a poster PNG. `--stills` writes one PNG per scene in seconds.
- The site demos run on timers and CSS animations, which Remotion cannot seek, so each one is ported to `src/ui/` with the same markup, class names and copy, driven by the frame number. The site's own CSS is copied in at render time (`scripts/prepare.mjs`), so the pieces follow the site.
- Specs never type a price: use `{{offer:price.from}}` style tokens, filled from `config/offer.ts`.
- The "Sample account" chip is added by the code wherever the sample account shows and cannot be switched off. A stat without a source does not render.
- The tidy piece uses illustrative campaign names (`SAMPLE.tidy` in `config/sample.ts`): the site has no public tidy demo to copy.

## Share images (Open Graph / X cards)

Made in code, not as static files: `lib/og.tsx` (`ogImage()`), 1200x630, the site's fonts and raccoon, footer "rocco.works · 7-day money-back" from `offer.ts`. A page gets its own card with two small files next to its `page.tsx`: `opengraph-image.tsx` and `twitter-image.tsx` (copy any existing pair). Pages without their own inherit the homepage card. Every new marketing page in this pack gets a pair. `public/og.png` and `public/og-v2.png` are copies of the homepage card for anything that still links the old files.

## Funnel tracking

First-party only: a Supabase table (`rocco_events`, `supabase/migrations/004_events.sql`), no third-party analytics, no cookie, no IP or user agent stored. The hackathon tracker script is separate and untouched.

- Events: `page_view` (landing pages only), `lead_captured {magnet}`, `tool_result {tool}`, `call_click`, `call_booked`, `hire_click`, `signup_started`, `checkout_started`, `paid`.
- In a new page or form: `import { track } from "@/lib/track"` and call `track("lead_captured", { magnet: "name" })` when the email is saved. For a link or button, no code: add `data-track="call_click"` (optionally `data-track-magnet`, `data-track-tool`). Page views, hire clicks, signup and checkout starts are picked up by `components/Analytics.tsx` on their own.
- Every link in an asset goes through `utm()` in `config/offer.ts`: the funnel groups by `utm_source`.
- Read it at `/admin/funnel` (sign in once at `/admin/login?key=<CRON_SECRET>`): last 7 and 30 days by source, and paid sellers against the goal of 100.
- `paid` is written by the payment webhook, `call_booked` by the form on the funnel page. A browser cannot send either.

## Repo vs brief (found Nov 22, 2026)

Open questions for Praveen:
1. Setup calls. The brief's north star is "setup calls booked". CLAUDE.md hard rule 2 says self-serve software only, no call-booking flows (hackathon eligibility), and the pricing card sells the refund as "no call, no forms". There is no booking link in the repo or on the site. `LINKS.setupCall` is the placeholder `{{SETUP_CALL_URL}}` until this is decided.
2. Branch. CLAUDE.md says push to `main` after every discussion; this brief says work on `marketing`. This branch follows the brief.
3. Resolved Nov 22: `marketing/video` is excluded in the root `tsconfig.json` and in `.vercelignore`, so the Remotion studio is not type-checked or uploaded with the app. `marketing/config/*.ts` is still type-checked by the app build and passes.

Things in the repo that differ from the facts above:
- Home FAQ and home price card word the guarantee as "if you don't like the fixes I give you, ask for your money back" (no "first 7 days", no email). The pricing page has the full wording. Assets use the full wording.
- The sample account is not one brand on the site: the hero sells cutting boards, the change log blocks "free yoga mat" and bids on "bamboo sheets queen". `config/sample.ts` copies both as they are.
- The "How a fix happens" phone ($4,120 sales, ACoS 24%, ~$2,900, +$63/mo, +$210/mo, ~$3,170) and the home messages bubble carry no sample label on the site.
- `lib/pricing.ts` still says "no ladder any more" (`nextPriceCents: null`) and `lib/urgency.ts` says 'no "price goes up" we don\'t mean', while the site shows the every-5-hires rise. The rise is manual, so there is no code to import for it.
- The site's countdown is to Black Friday / Cyber Monday / Dec 15, not to a price rise.
- The $770 figure assumes 22 workdays a month (not stated on the site, which says only "At $35 an hour").
- `ValueCalc` shows "N brands have hired me" once 5 or more have paid. That count is live and real; assets must not state a count unless Praveen gives one.
- Stale pre-pivot copy still in the repo (not reachable from the live nav, but do not copy from it): CLAUDE.md "What this repo is" (hosted MCP server alongside Claude/ChatGPT connectors); `app/connect/page.tsx` and `app/setup/page.tsx` (both redirect to /; "Rocco is free to add; a one-time license"); `lib/answers.ts` and `lib/guides.ts` (live at /answers and /guides: "Rocco is free to add next to it", Claude/ChatGPT connector how-tos); `app/w/[token]/calendar.ics/route.ts` ("In Claude or ChatGPT, ask Rocco"); `components/home/DayWithRocco.tsx` ("Applied in Claude after your confirm"); `docs/LAUNCH-KIT.md` (one-time $99, +$10 every 5 sales, capped at $499); `docs/DODO-SETUP.md` (automatic ladder).
