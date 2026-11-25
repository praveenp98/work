# Progress log

Newest entries at the top. Each session adds: date, what happened, decisions, next steps, blockers, numbers (revenue, costs, sends, replies).

---

## 2026-11-25 · Seller calendar on the dashboard + public calendars; beginner guides drafted (hidden)
- **lib/season.ts**: the seller's year per marketplace (US, UK, DE/EU, CA, IN, AU, JP, AE). Dates computed every year (Thanksgiving→BF/CM, Easter, Mother's/Father's Day per country, Diwali/Ramadan/Eid tables); Prime Day, Prime Big Deal Days, Great Indian Festival, White Friday, 11.11, Hatsuuri marked "expected" until Amazon announces. Phases per event (prepare −35d, ramp −14d, live, cool-down +7d; gifting: gift rush, last orders; Jan reset; Q4 storage; holiday returns) with concrete account actions.
- **Dashboard SeasonCard** (above today's jobs): today = "Black Friday & Cyber Monday in 2 days · Ramp up" with actions that jump to the matching job ("In today's jobs ↓"), say "Rocco does this" (midday budget alerts) or link to the page. Goes red "LIVE" on the day. Morning brief line now comes from the calendar (replaced hard-coded BFCM tips).
- **Public**: /amazon-seller-calendar/<market> (12 months, phases, actions, Event JSON-LD, FAQ) + subscribe feed /amazon-seller-calendar/feed/<market> (reminders 5 and 2 weeks before each event). Team calendar feed uses the same events. Footer: Seller calendar. Sitemap + llms.txt.
- **Beginner guides** (content/sell/*.json, 9 guides, ~5–7k words, 16–48 sources each) drafted by research agents; sources were blocked + search limit hit, so a fact-check pass against official pages is running (network now allows Amazon seller pages + tax authorities). Pages built (/sell-on-amazon) but hidden behind SELL_PUBLISHED=false until checked.
- Tests 311.

---

## 2026-11-25 · Wrapped plays full screen, like an app
- Opens full screen when ready (edge to edge on phones, centred 9:16 with arrows on desktop); tap sides or swipe left/right; swipe down, ✕, Esc or the phone's Back button closes it.
- Email unlock lives inside the story (lock slide with the form + "Skip, show my card"); unlocking plays straight into the deeper cuts.
- Ends on a share screen: recap card + "Share my Wrapped" (phone share sheet with the story image attached; falls back to saving the image), Post on X, LinkedIn, Copy link, Replay.
- Page keeps "▶ Play my Wrapped", the recap and share buttons after closing. Tested on iPhone 13 and desktop sizes in a browser.

---

## 2026-11-25 · One free-tools page, sitemap, share-image crawl fix
- /tools merged into /free (lists the 10 tools + calculators + checklist); /tools 308-redirects to /free; footer has one "Free tools" link.
- robots.txt now allows /api/magnets/card (X/LinkedIn preview bots obey robots.txt; the Wrapped share image lives there).
- Sitemap: https://rocco.works/sitemap.xml (131 URLs, incl. all /free tools). Submit it once in Google Search Console and Bing Webmaster Tools.

---

## 2026-11-25 · Site QA (dead buttons, errors, layout) + Seller Wrapped v2
- **Dead buttons fixed:** demo Skip buttons had no handler (now skip + Undo); demo goal buttons (Profit/Balance/Growth) were static (now selectable). Click-tested every button in /demo and the homepage demo pop-up at phone and desktop: all respond.
- **Site-wide audit script** (Playwright, 47 pages × phone/desktop): dead buttons, covered controls, sideways overflow, console errors. Clean except the intended title card on /demo/film.
- **Fixed:** /welcome sign-in link was prefetched by Next (console errors) → plain link; footer had "Free tools" twice (/tools is now "Calculators"); floating Email pill covered the footer on phones (padding); sticky Hire bar now hides over the price section and can't be tabbed to while hidden; scroll animations trigger for tall blocks on phones; office speech bubble no longer spills outside the scene (checked every frame, 0/80 samples outside); tiny "Try a sample" tap target on Ad Roast.
- **Error states:** uploads now say what's wrong (empty file, picture/PDF, wrong report) and where to download the right one; "Where do I download these?" under every upload.
- **Seller Wrapped v2:** story with 13 possible slides, 10 personalities, email unlocks the deeper 8, short share links (numbers only), story + post images. 293 tests.

---

## 2026-11-25 · Free tools: trust line, #04 renamed, agency note
- Trust: green "Your reports are never uploaded" bar above every upload + lock line in each drop box; button reads "Reading on your device…".
- #04 renamed **Second Opinion on Your AI's Ad Advice** (/free/ai-ad-advice-second-opinion; old URL 308-redirects). No Claude/ChatGPT names in the tool.
- #03 and #09: "No offence, agencies…" note + "Is this anti-agency?" FAQ. GTM channel 8 note added.
- #03 now also accepts campaign reports (Amazon keeps ~95 days vs ~65 for search terms) for older periods; says what it can't see without search terms. FAQ points to Amazon's campaign History tab / change-history API. 288 tests.

---

## 2026-11-25 · 10 free tools (lead magnets) built as real products
- **rocco.works/free** + 10 working tools: Health Check, Roast (savage, Claude), Agency Audit (before/after), Claude vs Rocco (pasted AI advice checked against data), Seller Wrapped (shareable card, sales hidden by default), Am I Overpaying (labelled typical ranges), Money Leak Detector, What Actually Worked (two periods), Could I Fire My Agency, Rocco Watches (the texts he'd have sent).
- Reports read in the browser; first 3 findings free, the rest for an email (lead_magnet = tool slug); X/LinkedIn share; hire CTA with the hours/48h connect note.
- Engine lib/magnets.ts (+8 tests, 287 total), UI components/magnets/MagnetTool.tsx, AI route /api/magnets (rate-limited; rule fallback), share image /api/magnets/card, 'before' sample reports for the two-period tools. Footer: Free tools. Sitemap + llms.txt.
- All 10 run end to end in a browser on the sample account. Post copy + guardrails: docs/LEAD-MAGNETS.md.

---

## 2026-11-25 · Products & profit + listing edits + A+ drafts
- **Found and fixed:** DataDoe retired `amazon_sales_and_traffic_with_cogs` on Nov 22. Business pull now reads `amazon_profit_by_sku_and_date` (traffic columns de-duplicated per ASIN+date as DataDoe requires); daily numbers read `amazon_profit_by_date` (now incl. profit). **Praveen: switch both on in DataDoe → Settings → Data (premium tables).**
- **Products & profit** (/w/[token]/products, components/dash/ProductsStudio.tsx, lib/profit.ts): per product 30-day sales, units, fees, ads, product cost, profit, margin, break-even ACoS. Missing costs entered inline → DataDoe POST /cogs (effective 180 days back). Profit tile added to Your numbers.
- **Listing keyword fixes** (lib/listings.ts): words from searches that sold → backend search terms (keeps existing, never protected words, <250 bytes); title/bullets editable with suggestions; DataDoe dry run → Amazon VALIDATION_PREVIEW → write; old values saved, one-tap Undo.
- **Listing issue fixes:** Amazon's issues per listing with a value box per attribute → LISTINGS_DETAILS_UPDATE (verified first).
- **A+ drafts** (lib/aplus.ts, lib/prompts/aplus.ts): Claude drafts text-only Standard A+ from listing facts + selling searches, rules filter (no prices/guarantees/reviews/health claims), seller edits, VALIDATE → ADD → PUBLISH; never replaces existing A+; English stores only.
- Notes written like a senior manager, calm not scary. Also fixed: Try-it panel CSS (.td) clashed with Tidy page (.td) → renamed .trd.
- Tests 279. Not yet run against a live account (needs DataDoe Listings/A+ actions on, which Praveen enabled).

## 2026-11-25 · Listings / A+ question
- Praveen enabled DataDoe actions for listings, A+ content, restock (FBA inbound) and MCF.
- Rocco does NOT edit listings or A+ yet: listing jobs today are alerts + steps (suppressed listings, Buy Box) and listing keyword gaps as suggestions. DataDoe offers AMAZON_LISTINGS_UPDATE (title, bullets, search terms, images), AMAZON_LISTINGS_FIND, AMAZON_APLUS_CONTENT_ADD/UPDATE/VALIDATE/PUBLISH. Proposed build: one-tap backend search terms + bullets from converting searches (preview, Amazon validation, undo by saving the old values), then suppressed-listing fixes; A+ later (needs images/copy, Amazon moderation).
- Restock (FBA inbound) is now enabled: run the 1-SKU restock test.
- Health panel Connect button no longer full width.

## 2026-11-25 · 29 more answer pages + directory-ready connector
- lib/answers-more.ts: 29 answers to questions sellers ask ChatGPT/Claude (best AI tool for Amazon PPC with "Rocco is made by us" disclosure and a fair shortlist priced from lib/compare.ts, fire my agency, automate PPC, not profitable, how much to spend, ROAS, wasted spend, rising CPCs, bids, auto vs manual, structure, break-even, budget runs out, Q4, brand bidding, negatives, harvesting, sales drop, real profit, conversion, sessions, out of stock, stockouts...). Merged into ANSWERS (sitemap, llms.txt, /answers). 47 answers total.
- Check before quoting: dynamic bids up to +100% top of search, monthly budget cap = daily x days, vacation mode path, Manage Your Apps path, Brand Registry tools. Rules-of-thumb ranges are labelled as typical, not stats.
- Connector: review-safe instructions + hints, /connector docs, privacy section, docs/DIRECTORY-LISTINGS.md (Praveen submits).
- No hidden text or AI-targeted instructions anywhere (would get penalised and rejected).

## 2026-11-25 · Rocco vs Claude / ChatGPT, AI-question answers, video scripts, AI visibility plan
- Praveen shared research (via GPT) on what sellers say at home: money, control, "is my agency/AI doing a good job?", "bro just give Claude your Excel files". Positioning to test: "Claude gives advice. Rocco keeps the receipts." / independent watchdog.
- New: /compare/claude and /compare/chatgpt (components/compare/AiCompare.tsx; honest: Rocco runs on Claude; difference = daily unasked checks, memory, money guardrails, measured results, team). Added to /compare, sitemap, llms.txt (new Comparisons section).
- New answers: can-claude-manage-amazon-ppc, how-to-check-ai-amazon-ppc-advice, is-my-amazon-ppc-agency-doing-a-good-job (19 answers now).
- docs/VIDEO-SCRIPTS.md (6 scripts + hooks), docs/AI-VISIBILITY.md (what's in place, what moves AI answers, weekly check, and the open decision: list Rocco in Claude's connector directory + ChatGPT apps).
- Reddit claims from the research are NOT used as facts anywhere.

## 2026-11-24 · Google sign-ups listed in /admin/leads
- Sign-in emails were only stored on each team (workspaces.data.ownerEmail), never listed. /admin/leads now has a Sign-ups table: date, email (mailto), name, paid/not paid + plan, Amazon accounts connected. Not-paid sign-ups = warmest leads (reached checkout). Store.listOwnedWorkspaces added (Supabase + memory).

## 2026-11-24 · Phone menu, Sign in always visible, clickable Rocco (from session recordings)
- Praveen ran migrations 004_events + 005_leads (that's all they need). /admin/funnel and /admin/leads now record.
- Recordings: people tapping the Rocco logo/mascot and finding no way around. Cause (my miss): on phones the top links were hidden (<640px) with no menu, and "Sign in" only appeared after scripts loaded. Fixed: ☰ Menu on phones (Pricing, Demo, Compare, Answers, Help, Hire Rocco), Sign in rendered on the server, desktop nav adds Demo + Compare.
- Clicking Rocco in the hero opens the demo account; on the dashboard he answers what he's doing; tapping the status bar on a phone shows the log.
- PostHog, last 2 days: ~18 visitors. Real prospects ≈ 2 from X (West Palm Beach, Naples: one page, no click). Several are bots/link previews (Council Bluffs = Google datacenter, bursts of IN desktop hits within 1s), the rest Praveen + Instagram friends. Zero Hire clicks, zero leads (lead forms live only on /free pages). No sign of competitors.

## 2026-11-24 · Alive homepage ("wow, it's alive")
- Decided NOT to copy Dr. PPC's long page: same section count, more motion, one action (Hire). Their wow = the product moving; ours now too.
- **Live hero** (components/home/LiveHero.tsx): Rocco's office in a browser window on an example account (labelled) runs a morning on loop: pulls data → runs numbers → pins 3 jobs → a cursor taps Approve → "Done in Amazon ✓" → saved counter ticks +$310. Works on phones (compact stage). Reduced motion: finished state, still.
- **Try it right here** (components/home/TryDemo.tsx): the full clickable demo account in a panel, no sign-up, no page change.
- **Scroll motion** (components/home/Reveal.tsx): job cards stagger in, "saved" counts up, data-vs-decisions rows slide in, the texting thread plays bubble by bubble with a typing dot, price bars grow: Dr. PPC $5,988 vs Rocco $3,348 monthly / $2,790 yearly at $10k/mo ads (with the Full Circle Partner note).
- Removed the separate "How it happens" band (the hero shows it); "What I handle" now carries #how.
- Office events are scoped (hero / demo / dashboard) so two offices on one page don't drive each other. Speech bubble stays inside the room at edge stations.

## 2026-11-24 · Rocco's office (live dashboard, desktop)
- components/dash/Office.tsx + lib/office.ts: Rocco walks between 6 stations (Amazon dock, Number desk, Job board, Results lab, Your bell, Nap corner), replays the last 3 days of REAL events (pulls, analyses, jobs pinned, changes made, results measured) with a speech bubble and a timed log, then settles where he is now (bell if jobs wait; nap corner with next rounds time if caught up).
- Live: Approve / Undo / Check connection send events (lib/client/office.ts) so Rocco reacts on the spot. Time-of-day light (morning/day/dusk/night), Replay, Hide office (remembered). Phones get a one-line status bar. Reduced motion: no walking.
- Also on /demo (example events), so it's in the demo and the next film. Tests 269 passing.
- Next (optional): Seedance loops for walking/typing/celebrating; sound toggle; "saved this month" counter.

## 2026-11-24 · Fixes from Praveen's dashboard screenshots + date-range numbers
- **Root cause of "no ad data" for Habit Nest US:** DataDoe refuses a multi-account ads export when ANY account in it has no Amazon Ads ("requires an Amazon Ads connection on every seller"). The PlugX Method IN (no Ads) was in the same export. Fix (lib/datadoe-sync.ts): ad tables only for accounts with Ads; if the flag is stale and DataDoe refuses, export each account on its own. Test added.
- Health panel: never shows raw API errors; explains this case; names stay ink-coloured; no "Habit Nest US · US" repeat (acctLabel).
- Greeting used server UTC ("Good morning" at 2:31 PM IST) → now the viewer's local time.
- **Your numbers** (components/dash/Numbers.tsx): 7/14/30/90/180 days or custom dates; sales, units, sessions, conversion, ad spend, ad sales, ACoS vs target, TACoS, ROAS, CPC, each vs the period before; daily chart of sales vs ad spend. Data: lib/daily.ts, filled by 2 small extra daily exports (180-day backfill the first time, kept 400 days) into ws.amazon.daily. Replaces the KPI strip once 3+ days are stored.
- Risk: if the sales table has no `date` column, the daily sales export fails quietly (ads numbers still show). Check after the next pull.
- Tests 266 passing.

## 2026-11-24 · Demo film v2 plan
- Current demo has no voice. Wrote docs/DEMO-SCRIPT.md: 2:00 script in 8 scenes (hook → pain → 2-min setup + strategy → morning jobs + approve → measured + undo → texting → trust → price + 7-day refund), 30s and 12s cuts, recording guide, ffmpeg edit plan, where AI video (Seedance etc.) fits (mascot cold open only, never fake UI).
- Also advised against a call-booking popup (hard rule 2: no call-booking flows); offered a Questions-before-you-hire popup (text Rocco / email a human / demo) instead.

## 2026-11-24 · Say which AI runs Rocco
- Praveen: the site never said Rocco runs on Claude Opus 5.5 (Dr. PPC says "Powered by Opus 5.5"). Added: hero proof line, homepage FAQ "Which AI runs Rocco?", pricing included list, AI model row on /compare/dr-ppc (parity), compare pages, help article which-ai. Copy is exact: AI ranks, explains, answers and reads screenshots; money math runs on fixed tested rules; changes only on approval or the chosen autopilot level.
- Same session: /compare/dr-ppc fixed per Grok (monthly vs monthly, Full Circle Partner price, autonomy default stated, no US-only hint).

## 2026-11-24 · Compare pages for every competitor
- /compare (index) + /compare/<slug> for Helium 10 Ads, Teikametrics, Perpetua, Scale Insights, Ad Badger, BidX, Quartile, an Amazon PPC agency, and Amazon's free ad tools (data in lib/compare.ts; Dr. PPC keeps its own page). Each: angle H1, side-by-side with yearly cost at $5K/$10K/$30K ad spend (only where the public price says), honest "pick them if / pick Rocco if", FAQ JSON-LD, cross-links. In sitemap + footer.
- Prices web-checked Nov 24 (most vendors don't publish exact prices: each page names its source and says "estimate, check theirs"). Rule kept: never claim a competitor lacks a feature. Teikametrics and Scale Insights are cheaper than Rocco at small ad spend; the pages show that honestly.
- Dropped Merch Jar (no verifiable pricing found).

## 2026-11-24 · Strategy step at onboarding ("you set the strategy, I do the work")
- Praveen asked if onboarding has the strategy part Ken (Dr. PPC) shows in his launch film. It didn't (goals sat in Settings only). Couldn't watch the X video (x.com, its mirrors and drppc.ai are blocked by the session proxy); used their public site repo: "you set the strategy, goals and budget, and Dr. PPC does the work… day-one diagnosis".
- New `lib/strategy.ts` + `components/dash/StrategyCard.tsx` + `POST /api/w/strategy`: main goal (profit/balance/growth, presets target ACoS 20/30/40%), target ACoS, margin before ads (→ break-even, refuses a target above it), monthly ad budget limit, never-cut words (protected campaigns + terms), products with a different goal, autonomy, notes.
- Shown right after connecting (during the 48h first load), then as "Here's how I'll run it" (plain-English plan, Edit) at the top of the dashboard sidebar; dashboard shows a "Set my strategy" bar until it's set.
- It's real, not decoration: budget limit holds budget raises (lib/rules/budget.ts → a note instead); never-cut words block negatives; product goals move per-campaign targets; the plan + notes go into every AI answer (manager pass, Ask Rocco, texts).
- Copy: /pricing step 2 "Connect Amazon, set your strategy"; homepage FAQ "Who decides the strategy?"; help article set-your-strategy. Tests 256 passing.

## 2026-11-24 · Site now sells "text me like your Amazon manager" (iMessage / WhatsApp / Slack)
- Praveen: the site never said Rocco works in iMessage/WhatsApp/Slack like a real Amazon manager, with AI answering questions there. It only said "reminders".
- Homepage: the messaging section is now "Text me like your Amazon manager". It shows an example Q&A thread (why did sales drop → real numbers → YES G1 → done in Amazon), channel chips, and 4 capabilities (questions answered from the account, morning brief, midday budget alerts, team in Slack). Added a hero proof line, a new FAQ "Can I just text you questions?", and the plan list now says "Text me questions…".
- /pricing team group, /compare/dr-ppc new row "Ask your manager by text", new help article `ask-rocco-by-text` (also feeds /help and llms-full.txt).
- Hero: the approve step now switches app every 1.3s on its own clock (was once per 7.5s loop), with official logos (components/BrandLogo.tsx: iMessage and WhatsApp green tiles, four-colour Slack, from Simple Icons CC0). The same logos are used on the homepage chips.
- Claims match what's built: lib/text/handler + lib/prompts/text-reply (answers from account data, reads screenshots, YES <code> approvals), Slack mentions/DMs (lib/slack.ts). Live texting still needs Praveen's LoopMessage keys; Slack needs SLACK_CLIENT_ID/SECRET.

## 2026-11-24 · Dashboard: Data health panel, real KPI strip, search terms, settings folded
- Praveen, 48h after connecting Habit Nest US: still "ad jobs on the way", no way to check. New **Amazon connection** panel at the top (components/dash/DataHealth.tsx, lib/health.ts, /api/w/amazon/health): live DataDoe status per account (Seller Central / Amazon Ads: connected, first load + stage, reconnect, not connected) and per report (Sales & traffic, FBA stock, Ad search terms, Ad campaigns): in + when, or exactly why not + the fix. Opens by itself when something's wrong. **Check connection now** = live status + fresh pull (once an hour). Also corrects Rocco's "Ads connected?" flag from DataDoe (admin-attached accounts had none).
- KPI strip: total sales, sessions, conversion, ad spend, ad sales, ACoS vs target, TACoS, wasted/mo. Deltas only vs a check ≥20h older and ≥1% (no more "▲ 0%").
- Search terms table on the dashboard (12 biggest spenders + Rocco's action: Block / Harvest / Bid ↓ / On goal).
- Team, Goals & autonomy, Amazon accounts, Messages folded into one ⚙️ Settings section so today's work stays on top.
- Tests 250 passing.

---

## 2026-11-24 · Unblocked the deploy: merged marketing into main, $99 gone everywhere
- Why the live site still showed $99: the hourly pacing cron (needs Vercel Pro) made Vercel reject every deploy since the battle-mode push, so rocco.works kept serving the old $119 / $99-billed-yearly build. Pacing cron back to daily (18:20 UTC) until Pro.
- Merged the `marketing` branch (33 commits from the builder session: /start hub, profile links, funnel events + leads, OG images, Black Friday checklist, marketing kit) into main. Conflicts only in sitemap + docs (kept both). 245 tests pass, build OK.
- Old prices fixed in marketing copy (profiles, brief, offer.ts comments) and docs/LAUNCH-KIT.md; brand screenshots (home, pricing) re-shot at $279 / $233. OG images read the live price.
- Needs Praveen: run supabase/migrations/004_events.sql and 005_leads.sql (from the marketing branch) in Supabase SQL editor.

---

## 2026-11-24 · Parity+ with Dr. PPC: demo film, clickable demo, autonomy ladder, hourly pacing
- **/demo**: clickable demo account (Bamboo & Co., demo data): Today's jobs (approve → checked with Amazon → done), midday budget alert, restock plan, Search terms with Rocco's action per term, Change log with results + auto-undo, Autonomy & goals, iMessage thread. Guided tour (~2 min) with captions.
- **2-minute demo film**: public/demo/rocco-demo.mp4 (1.7 MB, 1280×720) + poster, recorded from /demo/film by scripts/record-demo.js (re-run after demo changes). Homepage + /demo: "▶ Watch the 2-minute demo" lightbox.
- **Autonomy ladder** (lib/autopilot.ts): approve every move (default) / inside guardrails (negatives, bid cuts, budget cuts made each morning) / fully autonomous (all one-tap changes). Max 25/day, ±20% bids, skip-learning respected, kill switch, logged as "made by Rocco automatically", morning message line. Set on the Goals card.
- **Budget pacing hourly**, every marketplace at 1 PM local (needs Vercel Pro: cron `20 * * * *`). ?force=1 for testing.
- Job cards show "✓ Checked with Amazon first · ⏱ Measured in 7 days · ↩ Undo armed".
- Help: autonomy, undo, goals per product, budget alerts. Compare page rows updated (we now match autonomy, pacing, per-product goals).
- Tests 222 passing.

---

## 2026-11-24 · Battle mode vs Dr. PPC: price up, compare page, 3 product gaps
- Price $279/mo or $2,790/yr (was $119 / $1,190). Dodo products must be updated (docs/PRICING-MODEL.md).
- /compare/dr-ppc, /answers/ai-amazon-ppc-manager-cost, ad-spend slider on /pricing, louder 7-day guarantee.
- Goals card (target ACoS + goal per product), Undo in Amazon (bids/budgets) + opt-in auto-undo, midday budget alert cron (US/CA/MX).
- DataDoe white label quote: $3,000 + $300/mo + data plan → deferred; draft reply asks for a milestone deal.
- Post copy in docs/X-DRPPC.md. Tests 219 passing.

---

## 2026-11-24 · Competitor launched: Dr. PPC (drppc.ai)
- Full Circle agency's "Opus 5.5 runs your Amazon PPC": $299/mo + 2% of ad spend, $1 first 30 days, autonomy ladder, rollback triggers, per-ASIN goals, 174 SEO pages. Analysis + ranked response: docs/COMPETITOR-DRPPC.md.
- Rocco's edges: flat $1,190/yr (5–13× cheaper for $10k–50k/mo spenders), Seller Central jobs + one-tap restock, every marketplace, team + iMessage/WhatsApp, self-serve.
- Waiting on Praveen: OK to publish a factual /compare/dr-ppc page and a %-of-spend cost calculator.

---

## 2026-11-23 · Local prices in line with Dodo PPP
- Visitors outside the US get a country-aware line ("In India? Checkout shows your price in your own currency…"); optional `LOCAL_PRICES` env var shows the exact local amounts on /pricing and the plan picker (list price underneath).
- Each payment is checked against `LOCAL_PRICES`; a mismatch logs and fires `price_mismatch` in PostHog. Details: docs/PRICING-MODEL.md → Local prices.
- Tests 213 passing.
## 2026-11-23 · Profiles kit, site capture script, 30s and 15s demo videos
- **Profiles** (`marketing/brand/profiles/`): one folder per account (X, Instagram, LinkedIn page, Praveen's LinkedIn, YouTube) with `copy.md` (exact text, character counts, generated and limit-checked) and images at each platform's size (avatars, X header, highlight covers, grid covers, LinkedIn cover and banner, YouTube banner and watermark). A cross-account table in its README. Nothing uploaded: Praveen sets them up by hand.
- **Short links**: `rocco.works/x`, `/ig`, `/yt`, `/linkedin` go to a new noindex hub `/start` with that account as the source. Buttons send a `link_click` event. The setup-call and latest-video buttons stay hidden until their URLs exist.
- **Site capture** (`npm run capture` in `marketing/video`): records ten clean clips of the public site in 9:16, 4:5 and 16:9 into `footage/site/`. Never signs in, adds a "Sample account" chip on sample data, blocks trackers so it doesn't count as traffic.
- **Demo videos**: `demo-30s` and `demo-15s` specs rendered in all three formats; 10 hook variants in `batches/demo-hooks.csv` with a batch renderer; captions per platform in `marketing/copy/demo-captions.md`.
- Found while recording: `main` has moved ahead of the `marketing` branch (production has changes this branch doesn't). The Ad Roast result on the live site still says "Rocco ($1190, once) pays for itself": old one-time wording.
- Tests 224 passing, build OK. No marketing cost.

---

## 2026-11-23 · One look everywhere: brand tokens, logo files, /brand
- `marketing/brand/tokens.ts`: the site's colours, type, radii and shadows in one file, plus type sizes and safe zones per format. Video studio and share images now read from it; a test fails if the site's CSS and the tokens disagree.
- Logo files in `public/brand/logos/` (wordmark, rocco.works, lockup, mark; light, dark, one colour; avatars) built from the site's raccoon file and header type by `marketing/brand/build-logos.mjs`. Recommended: raccoon on green for avatars, the lockup for banners.
- Signature elements as shared components (`marketing/brand/components/`): morning list, YES bubble, change log row, sample chip. The video studio uses the same ones.
- Contrast check (`marketing/scripts/contrast.mjs`): all 19 text pairs pass AA, with two limits (blue on the page background and white on green are large-text only).
- `/brand` (noindex): logos, colours with contrast, type, signature elements, do and don't, brand kit zip. Linked from `/press`, whose colour line was out of date (it said green and gold; the site is blue with green for approve).
- Open for Praveen: blue or green as the lead colour, and whether to swap the yellow profile picture (BRAND.md open questions 6 and 7).
- Tests 224 passing, build OK. No marketing cost.

---

## 2026-11-23 · Lead capture + Black Friday checklist lead magnet
- **Leads:** table `marketing_leads` (`supabase/migrations/005_leads.sql`, RLS on, no public access), `POST /api/leads` (email check, honeypot, shared rate limits, source from a first-touch cookie), `<LeadCapture>` form with the consent box unticked by default, `/unsubscribe?token=…` (signed link, no login), `/admin/leads` (by magnet and source). Privacy page has a new "Free downloads and email" paragraph. No email sending code.
- **Black Friday magnet:** 2-page PDF `public/downloads/bfcm-checklist-2026.pdf` (from the guide and the surge and coupon tools only), page `/free/black-friday-checklist` with instant download, a banner on `/tools` and the Black Friday guide that switches to December wording on Dec 1 without a deploy, and `marketing/copy/bfcm-posts.md` (5 posts, 3 video hooks). New `marketing/scripts/pdf.mjs`.
- **Praveen must do once:** run `supabase/migrations/005_leads.sql` in Supabase → SQL Editor. Until then the form still gives the download but the email is not saved.
- UTM into checkout: already covered by the funnel events (checkout_started carries the source, paid inherits it). No billing change.
- Tests 215 passing, build OK. No marketing cost.

---

## 2026-11-23 · Funnel tracking (first-party) and /admin/funnel
- The repo had no analytics besides the hackathon tracker script. Added a first-party events table in Supabase (`supabase/migrations/004_events.sql`, also appended to `setup.sql`): event, path, UTM fields, referrer host, a random browser id, created_at. No third-party script, no cookie, no IP or user agent stored; no id with Do Not Track.
- Events: page_view (landing pages only), lead_captured, tool_result, call_click, call_booked, hire_click, signup_started, checkout_started, paid. Browser helper `lib/track.ts`; `components/Analytics.tsx` (mounted in the root layout) sends most of them without changes to product components.
- **paid** is one read-only line in the Dodo webhook (`recordPaid`): it runs after billing has decided, changes nothing there, never throws, and counts a team once.
- **/admin/funnel**: last 7 and 30 days by source (visits, leads, call clicks, calls booked, checkouts, paid) and paid sellers vs the 100 goal (from the Dodo count). Sign in at `/admin/login?key=<CRON_SECRET>`; anyone else gets a 404.
- **Praveen must do once:** run `supabase/migrations/004_events.sql` in Supabase → SQL Editor. Until then events are dropped quietly and the funnel shows a "has the migration been run?" note.
- Tests 207 passing, build OK. No marketing cost.

---

## 2026-11-22 · Share images in code, per page; brand guide
- **Link cards** are now generated in code (`lib/og.tsx`, Next ImageResponse): homepage "Your AI Amazon manager.", /pricing (price from `marketing/config/offer.ts`), /tools and each tool ("Free, no login"), /guides and each guide (its title). Every other page inherits the homepage card. og:image:alt and the twitter image match. `public/og.png` and `og-v2.png` regenerated to the same image.
- Why it mattered: the previous card showed Bamboo & Co numbers with no "sample account" label. The new one has no account numbers.
- After deploy: run the homepage, /pricing, one tool and one guide through the LinkedIn Post Inspector (it refreshes LinkedIn's cache) and check X by composing a post with the link.
- **`marketing/brand/BRAND.md`**: positioning, one-liners (primary + 2 backups), origin line, the enemy (recommended: dashboards), contrarian takes backed by /guides, two voices, word lists, naming and handles. The copy lint now warns on the ban list.
- Reported, not rewritten: pages that still describe Rocco as a Claude/ChatGPT connector (/answers AI topics, the MCP guide, calendar feed, contact card, press description, server.json).
- No marketing cost.

---

## 2026-11-22 · Video studio (Remotion) on the marketing branch
- `marketing/video/`: Remotion project with its own package.json. One JSON spec per video, three formats from one source (9:16, 4:5, 16:9), nine scene templates (hook, UI piece, phone thread, change log, compare table, stat, own footage, captions, end card). Run: `npm run studio`, `npm run render -- --spec specs/demo.json --format all`. Output in `marketing/out/video/` (gitignored).
- Looks like the site because it uses the site: `app/globals.css` + `app/connect.css` are copied in at render time, the UI pieces are ports of the homepage components with the same markup and copy, fonts are the same Raleway and Inter files, the raccoon is `components/Rocco.tsx`.
- Guard rails in code: "Sample account" chip wherever Bamboo & Co shows (cannot be switched off), a stat without a source does not render, prices come from `marketing/config/offer.ts` through spec tokens.
- App side: `marketing/video` added to `exclude` in the root `tsconfig.json`; new `.vercelignore` (marketing/video, marketing/out). No product code changed.
- Remotion is free for individuals and companies of up to 3 people. No marketing cost.
- Next for Praveen: film the three shot types (A face, B screen, C desk) into `marketing/video/footage/`; pick royalty-free music if wanted.

---

## 2026-11-22 · Marketing branch set up (assets only, nothing published)
- New branch `marketing`. Folder `marketing/` (config, video, copy, emails, carousels, images, ops, scripts, out) + `public/downloads/`. `marketing/out/` is gitignored.
- `marketing/BRIEF.md`: standing brief (facts, rules, voice, filming limits, reusable components, repo vs brief).
- `marketing/config/offer.ts`: every asset reads price, guarantee, links, UTM and hackathon day from here; plan prices come from `lib/pricing.ts` (PLAN). `marketing/config/sample.ts`: the Bamboo & Co sample numbers and label.
- `marketing/scripts/lint-copy.mjs`: fails on em dashes, 30-day guarantee wording, free plan as a feature, "trusted by", testimonials outside the proof slot, old Claude positioning, unknown $ amounts, sample numbers without a "sample account" label. Run: `node marketing/scripts/lint-copy.mjs`.
- No app code changed. No marketing cost.
- Open for Praveen: setup calls vs the self-serve rule (CLAUDE.md rule 2), no booking link yet; exclude `marketing/video` from the root tsconfig before the Remotion studio lands.

---

## 2026-11-23 · One-tap restock (FBA shipment plan via DataDoe)
- Restock job now: editable quantities (~60 days of sales minus on-hand and inbound), ship-from address once, one tap → Rocco creates the FBA inbound plan in Amazon (AMAZON_FBA_INBOUND_PLANS_ADD, dry run first, idempotent), then "Finish in Send to Amazon" or "Cancel plan".
- Why not fully one-tap: Amazon's inbound flow needs carton sizes/weights/pickup and fee choices; Rocco hands off at the first physical step. Phase 2 (fees/carrier compare in Rocco) only if sellers ask.
- Daily pull now reads `inbound_quantity`; covered SKUs say "already on its way" instead of asking for more.
- Praveen to enable 6 FBA inbound Action types in DataDoe + test once on Habit Nest US: docs/RESTOCK.md.
- Tests 210 passing.

---

## 2026-11-23 · Fixes from the founder-test screenshots
- **Restock card had no SKUs / report heading didn't match its list:** findings were saved in row order and cut at 10, so dead-stock and overstock rows pushed out the "running out" ones. Now sorted most-urgent first, duplicates merged, top 12 kept (`sortFindings`). Fixes the restock items, the report's Restock section and the analytics.
- **Product names, not codes:** long Amazon titles shortened to the product's own name (`shortName`); Business Report findings say "The Morning Sidekick Journal gets traffic…" not "195004520X…"; low-stock ad items show the product, not "US - BSJ Vol 1 - AZBarcode".
- **Reminder preview** now shows today's real jobs and value (example only when there are none, labelled). "Approve by text" unlocks on the page that shows jobs (was still locked on first view).
- **Report page:** next actions start with a capital and read "Ease ads on SKU…"; the agency white-label tip is folded into a "For agencies" toggle.
- **Analytics:** "2 checks since Nov 22. One point per daily check: the lines fill in day by day." (was an ISO date and lone dots).
- **History read:** not stuck, just slow; the last loading step now says big accounts take a few minutes and it's safe to leave; a timeout shows a retry message.
- **KPI tiles** say "· 30 days".
- Takes effect on the next daily pull for existing data (or Check now). Tests 205 passing.

---

## 2026-11-23 · Founder test: first jobs had no approve buttons (ads data missing)
- What Praveen saw on Habit Nest US: "2 jobs today, worth ~$0/mo", both steps-only (restock, ease ads on low stock). Cause: only the Seller Central reports (sales/traffic, FBA inventory) had arrived; the two Amazon Ads tables (search terms, campaigns) hadn't, and every one-tap job (negatives, bids, budgets, exact campaigns) comes from those. The page didn't say so.
- Fixed: dashboard banner per account: "Your ad jobs are on the way… (N% loaded)" while Ads history loads, or "Amazon Ads isn't connected" + Connect button. Headline drops "~$0/mo" ("2 jobs today to protect your sales"). Manual jobs now say why they're yours (Amazon doesn't let apps create FBA shipments, etc.).
- Bug fixed: with 2 accounts on one team, the daily pull's status overwrote itself (last account won). Now stored per account (`amazon.syncs`), team-wide `lastSync` is the union.
- To check (Praveen): DataDoe → Habit Nest US → is Amazon Ads connected, and are the two ads tables (amazon_ads_search_terms_by_campaign_by_date, amazon_ads_performance_by_campaign_by_date) on and loading?
- Tests 202 passing.

---

## 2026-11-23 · Removed "Claude/ChatGPT add-on" positioning from public copy
- /answers: the 5 "AI & connectors" answers (topic renamed "AI & Amazon") still explain Amazon's Claude/ChatGPT connectors (real searches), but Rocco is now pitched as the alternative: connects to Amazon directly, no Claude setup or Ads API approval, makes approved changes. Dropped "Rocco is free to add next to it" and "an MCP connector built to sit next to Amazon's". Search term answer no longer says "give it to Rocco in Claude".
- Guides: MCP guide's two ways are now "do it yourself in Claude/ChatGPT" vs "hire an AI manager"; FAQ no longer says "report-based connector". Bulk guide's roast line is gone; /guides description updated.
- Calendar feed, contact card (title "Your AI Amazon manager", link → /me), /press meta, server.json, Wins share text: "teammate" → "manager", no Claude instructions.
- Texts: daily numbers, brief, approve/undo replies no longer tell customers to go to Claude/ChatGPT.
- Launch kit: the 5 MCP directories are dropped (G2 and Capterra added); docs/LAUNCH-KIT.md is regenerated from content/launch-kit.json (it was months stale). HN link → rocco.works.
- Left on purpose: the "Other ways to use Rocco" Claude option tucked inside the dashboard, the /mcp endpoint and OAuth pages for existing connector users, and legacy Claude-mode texts. /connect and /setup already redirect to /.
- Tests 202 passing.

---

## 2026-11-22 · PostHog dashboard "Rocco" built (via PostHog connector)
- Dashboard https://us.posthog.com/project/760057/dashboard/2397152 with 22 tiles: 4 headline numbers, revenue vs refunds, 4 funnels (main 8-step, hire→paid, paid→activated, weekly conversion trend), traffic (referrers, UTM, countries, top pages), jobs (approved vs skipped, by type, skip reasons), changes made vs failed, Amazon connections by marketplace/Ads, reminders, help signals (ask, email a human, rage clicks), paid-team weekly retention. Full table in docs/ANALYTICS.md.
- Two pinned replay playlists (Opened Hire; Rage clicks). Project: replays on, dead clicks + errors on, timezone Asia/Kolkata, Rocco = home dashboard.
- Code: `paid`/`renewed` now carry `currency` + approx `usd`; new `refunded` server event (refund/dispute). `usdFromCode` in lib/currency.ts.
- No events had arrived at build time (headless test visits are dropped as bots). Next: Praveen visits rocco.works in his own browser, then checks PostHog → Activity.
- Tests 202 passing.

---

## 2026-11-22 · Analytics: PostHog built in (off until key), hackathon tracker verified
- Hackathon tracker confirmed live on /, /pricing, /help.
- PostHog added (posthog-js): page views with private team links scrubbed, replays only on public pages with inputs masked, sent through rocco.works/ingest (ad-blocker proof), teams identified by workspace id. Funnel events client + server (hire sheet → signup → checkout → paid → Amazon connected → first data → approved → changes made, plus skips, reminders, team, ask, email-a-human). Off until `POSTHOG_KEY` is set (renamed from NEXT_PUBLIC_POSTHOG_KEY the same day: Vercel warns on NEXT_PUBLIC_ + Sensitive; the layout now passes the key to the browser). Setup + funnels to build: docs/ANALYTICS.md. Privacy page updated.
- Tests 202 passing, build OK.

---

## 2026-11-22 · human@rocco.works everywhere + "Email a human" on every page
- All contact addresses changed to **human@rocco.works** (forwards to Praveen): site, help, texts, AI files, MCP output, docs.
- "✉️ Email a human" pill on every page (bottom-right; icon-only on phones, above the sticky Hire button on the homepage); opens mail with a subject saying which page they were on.
- Footer line "Questions? Talk to a human: human@rocco.works · usually answered the same day" + Help link; hire sheet: "Questions first? Email a human".

---

## 2026-11-22 · App header, example mornings while waiting, new pricing page
- Inside the product (/w, /me, /welcome) the header shows only the logo and Help: no Pricing/Answers after paying.
- Connect + waiting screens show "here's what your mornings will look like": the animated example dashboard (labeled example), so the hours-long first load isn't a blank wait. Order: status card → example → ping setup → team.
- **Pricing page rebuilt** (top-SaaS pattern): headline + live countdown → Yearly/Monthly switch (yearly first, "2 months free") → one plan card ($99/mo billed yearly or $119/mo, CTA, guarantee under the button, quick ticks) → price-rise line → "Everything that's included" in 4 groups → "What happens after you pay" (3 steps) → value calculator → FAQ. Product + FAQ JSON-LD.
- Tests 201 passing.

---

## 2026-11-22 · Founder test passed connect (US + India); waiting screen + ping setup
- Praveen connected Habit Nest US and The PlugX Method IN (with Ads) through Rocco: the real customer path works.
- Waiting screen: one status line (the Check now answer replaces the waiting line instead of adding a second); "I'll message you" only when a phone or Slack is actually linked; accounts that skipped Amazon Ads show "Amazon Ads isn't connected… Connect Amazon Ads →" (reconnect link).
- **Ping setup on the waiting screen** ("Ping me when my first jobs are ready") and on the dashboard: where (iMessage / WhatsApp / Slack / none), how often (mornings with work / Mondays), and **what the message says**: a one-line nudge to the site (default, recommended), top 3 job headlines, or approve by text (locked until they've reviewed jobs on the site once). Live preview of the message. No work that day = no message.
- Morning message rewritten per style (lib/datadoe-sync.ts tellTeam).
- Help: "Do I need to connect Amazon Ads?" + updated reminders article.
- Slack: the Slack app itself is free (create from docs/slack-manifest.yml, add 3 env vars); the option stays hidden until those are set.
- Tests 201 passing.

---

## 2026-11-22 · New share image + press screenshots
- The X/LinkedIn link card still showed the old "Your AI Amazon teammate · plugs into Claude & ChatGPT" image (a fixed file, never redone). New `/og-v2.png` (1200×630): headline, the 4 steps, approve in iMessage/WhatsApp/Slack, $99/mo billed yearly + 7-day guarantee, and a jobs dashboard mock. Metadata points to it (new URL so X fetches it fresh); `/og.png` overwritten too.
- Press kit (/press) screenshots re-shot from the current site with a demo brand (Bamboo & Co): home, pricing, dashboard, change log. Old setup/playground shots no longer listed.
- X caches cards per link: post `rocco.works/?v=2` (or wait ~a week) to get the new card on X.

---

## 2026-11-22 · Founder test findings: connect fixes + routine list
- Praveen ran the founder test. Findings and fixes:
  - **Reused dead DataDoe link** ("Invitation not found"): Rocco kept an invite after a failed attempt; DataDoe links are single use. Now a failed callback forgets the link, and an open link is only reused if DataDoe says it's still PENDING.
  - **Generic "Amazon stopped" message**: the real DataDoe error is now logged (`[amazon] connect failed`) and shown as a code; "already connected" gets its own message. Habit Nest US is already in our DataDoe organization, which is the likely cause of the first failure (not permissions).
  - **Old test team still reachable via cookie** (team card asked to sign in): the founder reset now resets old teams' links and ends their free access.
- Praveen did: Dodo extra-account product + Vercel env, Supabase 003_limits.sql.
- New **docs/ROUTINE.md**: daily / weekly / monthly checks and admin commands.
- Tests 201 passing.

---

## 2026-11-22 · Accounts per plan, currencies, remove/swap, and the last audit items
- **3 Amazon accounts included** (each marketplace counts), **+$49/mo per extra** (Dodo product `DODO_PRODUCT_ID_EXTRA_ACCOUNT`, one subscription per slot; refunds/failures remove the slot; not counted as hires). New accounts are blocked at the limit (connect button and DataDoe callback); teams already over keep theirs. Copy updated (pricing, help, llms, launch kit, value calculator).
- **Remove / swap an account** (owner only, dashboard → Amazon accounts): data and change log stay; slot frees after 30 days, right away if removed within a day of connecting. Answer to "will it be misused?": yes without a cooldown (one plan rotating through client accounts), so the 30-day hold. DataDoe has no disconnect API: removed accounts are logged for Praveen to delete in DataDoe weekly.
- **Currencies**: every amount from an account shows in its marketplace currency (₹, £, €, ¥, C$, A$…): dashboard, job cards, ROI card ("N× what I cost" compares in USD, approximate), change log, morning messages, and what Claude reads (so its brief and answers use the right symbol). Rocco's own price stays USD; Dodo checkout shows local prices (PPP on).
- **Safe saves**: workspace saves now send only the fields a request changed, on top of the latest record, with a version check and retry (lib/store/merge.ts). Falls back to field-only save if the database rejects the version filter.
- **Welcome page** finds the payment from a subscription id alone (Dodo list payments by subscription).
- **Texts**: answered once across all servers (shared "first time" mark) and replied in the background so LoopMessage never retries.
- **Shared spam limits** across servers (sign-up taps, text opt-in, new workspaces incl. the MCP tool, unsigned webhooks): Supabase `rocco_hit` (supabase/migrations/003_limits.sql, Praveen runs it once); falls back to per-server.
- Tests 200 passing.

---

## 2026-11-22 · 7-day guarantee, help center, AI scope + costs, support plan
- **Guarantee is now 7 days** (Praveen): PLAN.guaranteeDays = 7, every page, text, MCP output, launch kit and Dodo setup doc. Dodo product note must say 7 days.
- **Help center** /help (23 answers in 6 sections, exact steps, FAQPage/HowTo JSON-LD, in sitemap, footer and dashboard) + **/llms-full.txt** (all help in one plain file for Claude/ChatGPT/Perplexity) + llms.txt links. Sitemap no longer lists the redirected /connect and /setup.
- **AI only for Amazon**: lib/prompts/scope.ts added to Ask Rocco and text replies: off-topic gets one sentence; the exact list of what Rocco can do / only flags / doesn't do, so it never promises an action it can't take. Chat replies capped at 900 output tokens. Every Claude call logs tokens (`[ai] …` in Vercel logs).
- **docs/AI-USAGE.md** (where AI runs, limits, cost ~$250/mo at 100 sellers, unsupported-action handling) and **docs/SUPPORT.md** (predicted tickets, macros, where to look).
- DataDoe: exact 9-table keep list in docs/LIGHTS-ON.md step 5. Dodo webhook endpoint created by Praveen; signing secret still to paste into Vercel.
- Tests 192 passing, build OK.

---

## 2026-11-22 · Full audit (desktop + code review) and fixes; lights-on checklist
- Desktop flow checked at 1440×900 and 1280×800 (home, sheet, pricing, plan step, dashboard with team, log, tidy, analytics, report, welcome): no overflow, no page errors.
- Fixed from the audit:
  - **License keys no longer unlock teams** (one key could unlock unlimited teams forever; MCP + text "activate").
  - **No fallback to the old $99 product**: plan buttons need DODO_PRODUCT_ID_ANNUAL/MONTHLY; only those unlock access (strict product check).
  - Texted screenshots/files: paying teams only + daily limit; Ask by text/Slack shares the 40/day limit.
  - Text/message links go to the team's own page (not /me, which dead-ended on phones); buyer who paid from a phone link lands on their team.
  - "You hired me" message sent once even when /welcome confirms before the webhook.
  - Sign-in: a paid team you were invited to beats an unpaid one in the browser; a paid ownerless team can only be claimed by its checkout email.
  - Remove teammate also changes the texting link code. CANCEL by text no longer cancels (any linked phone could).
  - Uploads and the client report need a plan; report opens on the team's brand; analytics empty state + upload nag fixed.
  - Daily Amazon batch: per-account AI + message in parallel (fits 300s); daily text job in parallel, 300s, no trial text, max 3 setup reminders.
  - Dashboard caches DataDoe account status 10 min (shared 3 req/s limit).
  - Stale copy: $99/year in MCP output, "connect in Claude or ChatGPT", "keep him forever".
  - /api/health shows every key setting (set/missing).
- Not fixed (documented in docs/LIGHTS-ON.md): whole-record save races, subscription-only welcome, duplicate text replies on retry, per-server spam guards.
- **docs/LIGHTS-ON.md**: Praveen's final checklist.
- Tests 192 passing, production build OK.

---

## 2026-11-22 · Hero steps: one line each on every screen
- The 4 animated steps now fit on one line from 320px phones to desktop (measured at 320/375/390/430/768/1280, every channel): no reserved column, the reply chip only on the approve step, sizes step down under 400px and 350px.
- Copy: "You approve on 🖥️ the web / in iMessage / WhatsApp / Slack", "I make it live, then check it worked"; the last step's icon turns ✅ when done. No sideways nudge on phones (it clipped the border).
- Change log page: plain-word lines ("Blocked the search … in …", "Bid $1.20 → $0.95 on …") with value, human dates in Before Rocco. Screenshots in docs/screens-*.png.

---

## 2026-11-22 · Teams built: add teammates, roles, handover, link reset
- **Team card** on the dashboard (and on the Connect Amazon screen, so a buyer can add the person who holds the Amazon login): add a teammate by email → they tap Sign in with Google on rocco.works with that email and land on the same Rocco. A copy-paste invite message is shown (no email sending yet).
- **Roles:** Owner (people, handover, link reset; billing stays on the card that paid) and Member (see + approve jobs, Ask Rocco, Tidy, change log; can leave).
- **Handover:** "Make owner" for a teammate who has signed in once; the old owner stays as a member.
- **Remove** also resets the private link (old copies stop working); **Reset private link** for the owner anytime. Teammates just sign in with Google again.
- **Change log names:** "Rocco · approved by Sam on the dashboard" (dashboard, new campaigns, Tidy).
- Security: invites only work for that exact Google-verified email; signing in as a member never takes ownership (removed an old line in the Google callback that set the signed-in email as owner); team actions need the link + Google sign-in; 30 invites/day limit.
- Price rise rule settled: +$10/month and +$100/year every 5 hires (line updated; docs/PRICING-MODEL.md). Next step prices: $129/mo, $1,290/yr.
- Tests: 190 passing, production build OK. Not yet clicked through with two real Google accounts: do it in the founder test (add a second Gmail).

---

## 2026-11-22 · Q&A: teams, logins, handover (gap found)
- Today one Rocco = one team: one owner (Google email), a secret team link (/w/rw_…), phones linked by code for texting, optional Slack. One Amazon account can belong to only one Rocco team (security rule).
- Gap: no "add teammate by email", no roles, no remove-person, no transfer-owner, no "new link" (rotate). Teammates can only use the forwarded secret link, which can't be revoked; a teammate signing in with Google gets their own empty Rocco.
- Proposed build (waiting on Praveen): Team card on the dashboard: invite by email (they sign in with Google and land on the same Rocco), owner/member roles, remove, transfer ownership, reset the secret link. Approvals logged with the person's name.

---

## 2026-11-22 · Plan cards, live countdown, price rise line, change-log section
- Plan cards: **$1,190/year** with "$99/mo billed yearly" under it; **$119/month** "billed monthly" (pricing page + plan step).
- Agency-vs-Rocco bars replaced with **"your team's time vs Rocco"** (hours/day spent checking ads, bids, stock × $35/h × 22 days), so agencies aren't put off: "Brands and agencies: every account, one plan."
- Urgency is a **live countdown** to the next real event (Black Friday, midnight US Eastern), ticking every second; "is on now" on the day, then the next event.
- New line on the plan step + pricing page: **"Prices go up by $10 every 5 hires. N hires left at this price."** (count from Dodo). ⚠️ Praveen keeps it true: every 5 hires raise both Dodo products and `PLAN` in lib/pricing.ts (+$10/month on monthly; yearly by +$100 to keep 2 months free, or decide otherwise).
- "Your Rocco" header link hidden on /w, /me, /welcome (you're already there).
- Footer: "Your AI Amazon manager: you approve, I do the rest. **Real work without the fluff.**"
- Home: new animated **"Nothing happens in the dark."** section: example change log (who approved, where, result flipping from checking to worked, an undo) + the "Before Rocco" read. The real log page (/w/<token>/log) was built earlier today.
- Tests: 185 passing.

---

## 2026-11-22 · Hire flow: clean sign-up sheet, plan picked after sign-up
- The Hire sheet no longer shows prices: it is step 1 (sign up), with what happens next (Sign up → Pick a plan → Connect Amazon), the Black Friday line, and four trust lines (Amazon's own sign-in, nothing changes without approval, checked/logged/undoable, 30-day guarantee).
- After Google sign-up the seller lands on **Pick your plan** (their Rocco page): two matching cards ($99/mo billed yearly with "2 months free", $119/mo "Flexible"), centred, same rows, then "Continue · $1,190 a year" to Dodo checkout. Pricing page uses the same cards.
- "Cut just 5% of waste" replaced with what a manager compares against: an ads agency (~15% of spend, $500/mo minimum, stated as typical) vs Rocco, as bars on their own ad spend.
- Tests: 182 passing. Checked on iPhone 13.

---

## 2026-11-22 · Security pass: paywall, other sellers' accounts, costs
Found and fixed (all tested, docs/SECURITY.md):
- **Swapped account at connect:** the DataDoe return URL's account id was trusted, so a paying user could have linked another seller's account from our DataDoe org and made changes in it. Now Rocco asks DataDoe which account the invite really connected, binds reconnect links to their account, and refuses an account another team already has.
- **Planted team via typed email:** the Hire sheet email became the team owner, so someone could plant a team with your email, keep its link, and see your account after you paid and connected. Ownership now only comes from Google sign-in; typed email only prefills checkout.
- **Paywall bypasses:** a pending/trialing Dodo subscription granted a trial; replaying an old payment webhook could re-grant a year; refunds/chargebacks didn't end access; another product on the Dodo account would unlock. All closed: only a succeeded payment of our product, period counted from its date, refunds/disputes end access (replay-proof). Optional Dodo webhook signatures (`DODO_WEBHOOK_SECRET`).
- **Free live changes:** ex-customers could still apply the top fix in Amazon. Live changes now need an active plan (dashboard and text).
- **Damage limits:** daily caps per team (300 changed items, 10 campaigns, 6 tidy runs), kill switch `ROCCO_WRITES_OFF=1`.
- **Cost abuse:** durable per-team limits on Ask, refresh, history, tidy scan, connect links.
- Constant-time secret checks on admin/cron/text routes; security headers (no framing, HSTS, nosniff; team pages no-referrer + noindex + no-store).
- Tests: 182 passing, production build OK. Founder test: re-run `/api/admin/tester` once (it now marks the owner as verified).
- **Praveen to set:** `DODO_WEBHOOK_SECRET`, a long `CRON_SECRET`, 2FA on Vercel/Supabase/Dodo/DataDoe/Google/GitHub.

---

## 2026-11-22 · Memory at 100 sellers, change log, "Before Rocco" history
- **How memory works at 100 sellers:** each team's memory lives on its own workspace in Supabase: every change (what, who approved, result a week later), skips with reasons, the manager's picks, Tidy undo data, and now the pre-Rocco history. Anonymized cross-account results ("negatives worked in 41 of 50 measured changes across 12 accounts") are computed in the daily cron and fed to every account's manager. Small per team (tens of KB), no extra cost per seller.
- **Change log page rebuilt** (`/w/<token>/log`, linked from the dashboard): Rocco's changes with who approved (dashboard, by text, new campaign, by hand), the measured result, Tidy changes with a link to undo, and a new **Before Rocco** section. Removed the stale "undo B3 by text" line.
- **Before Rocco (lib/history.ts):** one-time read of DataDoe's `amazon_ads_entity_history` (Amazon's own change history: SP + SB campaigns, ad groups, ads, targets; bids, budgets, status; not Sponsored Display) + campaign names. Rules count it (by hand vs budget rules, last change by hand, no bid changes, most edited campaign); one short Claude call writes a 2–3 sentence read, sentences with numbers not in the summary are dropped. Runs on its own right after connect; a button on the log page for accounts connected earlier. Fed into the daily manager and Ask Rocco.
- **Live on Habit Nest:** 10 changes (Sep 2 – Oct 22), all from Amazon budget rules, no change by hand, no bid changes, most edited "NEW_SP_Fitness__SQP_KWs_Q42022_75-100BrandShare" (8). 4 DataDoe tokens.
- **Cost:** ~4 tokens + a few cents of Claude per account, once (~$15–25 total at 100 sellers). Decision: included free in the plan, not an add-on (see DECISIONS).
- Keep `amazon_ads_entity_history` ON when turning off unused DataDoe tables.
- Tests: 173 passing.

---

## 2026-11-22 · Hire sheet fixes on phones
- Sticky "Hire Rocco" opened a clipped sheet: the sheet was rendered inside the sticky bar, whose transform traps fixed children. The sheet now renders on <body> (portal) and opens full screen from every button.
- "2 months free · save $238" tag covered the yearly price on narrow phones: tag now sits in the card ("2 months free"), "save $238" moved to the line under the price (hire sheet + pricing page). Checked on iPhone 13 and iPhone SE (320px).
- Note: the "$2.6K/mo · 87 fixes" line in the earlier screenshot was the previous deploy; it's removed.

---

## 2026-11-22 · Hero sells the workflow in 3 seconds; small-account proof removed
- Hero line is now an animated 4-step flow (components/home/HeroFlow.tsx): connect once → every morning I find what to fix → **you approve in your dashboard / 💬 iMessage / 🟢 WhatsApp / #️⃣ Slack** (rotating, with the reply bubble) → I make it in Amazon and check it worked (Done ✓). Screen-reader text and a static version with reduced motion.
- Removed "Day one on a real seller account" (a $2.6K/mo account made Rocco look small) from the homepage, the calculator and the press kit.
- Google sign-in already asks Google for the account chooser (prompt=select_account). On iPhone Safari without a Google session Google can only show the email box; signed-in browsers get the chooser.
- Tests 167/167, build OK.

---

## 2026-11-22 · Whole-site buyer pass: every page current, conversion + clarity
- **Homepage rebuilt around the product as it is today:** hero CTA is "Hire Rocco" (honest: payment comes before connecting); live demo now shows today's *jobs* (Block 6 searches, New exact campaign, Raise 2 budgets, Restock) being approved and made in Amazon, plus the "Rocco has saved you $1,284 · 13× what I cost" strip. New sections: The whole job every morning (6 job types), How a fix happens, I learn how you work (skip reasons + savings), Decisions not data, Approve on your dashboard or from messages (iMessage/WhatsApp/Slack, approve by text), real-account proof (87 fixes day one, 5 of 233 campaigns readable, 132 idle), price card with Black Friday line + calculator + guarantee, FAQ (with FAQ schema). No ChatGPT/connector talk anywhere.
- **Pricing page:** yearly/monthly plan cards, what's included (jobs, campaign creation, Tidy, alerts, reminders), calculator, new FAQ (what happens after I pay, guarantee, no free plan and why).
- **Legal pages made true:** Refunds = 30-day money-back guarantee (was 7 days); Terms = subscriptions, approve-then-Rocco-changes, cancel anytime; Privacy = DataDoe connection, changes only with approval, Claude API use, messaging, anonymous cross-account learning (old text said Rocco never changes Amazon).
- **Old landers retired:** /connect, /setup, /text → homepage (connector-era copy, one-time license, pre-payment texting). /thanks → /welcome. Footer "How it works" → /#how. "Other ways to use Rocco" (Claude/ChatGPT steps) removed from the Connect Amazon screen; "Also ask me in Claude" removed from the dashboard footer.
- **Everywhere else:** answer pages end with "Hire Rocco" (not unpaid texting); free tools' CTAs → Hire Rocco; llms.txt and the press kit (/press) rewritten for the current product and price; payment webhook messages point to rocco.works/me; the old Claude-bridge daily texts skip Amazon-connected teams (their morning message follows reminder settings).
- Checked in a browser as a buyer: home (desktop + iPhone), pricing, refunds, /connect redirect; no sideways scroll; no broken homepage links. Tests 167/167, build OK.

---

## 2026-11-22 · Skip → why, reminders after payment, clear errors and waits everywhere
- **Skip asks why (one tap):** Already done · Not my strategy · Too risky right now · Numbers look off · Not now. Memory (lib/memory.ts): "not my strategy" ×2 holds that kind of fix; "already done" and "not now" never count against it; "numbers look off" is logged (`[rocco] numbers flagged`) for review. Reasons go into Claude's manager prompt. Rocco replies with what he learned.
- **Reminders (paying teams only, dashboard card):** every morning / Mondays / none, on iMessage or WhatsApp (LoopMessage opt-in link, phone links to the team automatically) or Slack (already built; shows when SLACK_* env is set). **Approve by text** unlocks only after the team has gone through today's work on the dashboard once. Morning message: default = "N fixes waiting, worth ~$X/mo. Approve them here: rocco.works/me"; with approve-by-text = picks + "Reply YES …". Weekly/off respected.
- **YES by text with Amazon connected:** makes the change in Amazon (same batched, dry-run-first path as the dashboard) if approve-by-text is on; otherwise replies with the dashboard link.
- **Messages (lib/messages.ts):** Amazon return codes → plain next steps (primary user, cancelled, expired, Ads missing…); Google sign-in problems shown site-wide (was silent); offline notice; first-load screen stops politely after ~6 min with "you can close this, I'll message you"; Check now / connect / approve refusals in plain words (raw codes go to logs); welcome page never bounces a buyer to "Hire Rocco" while Dodo confirms: "Confirming your payment…" with retries, then a clear fallback.
- Fixed a style clash (old ".locked" rule) on the reminder card. Tests 167/167, build OK.

---

## 2026-11-22 · "Tidy your campaigns" (structure like a top 1% ads manager)
- **What it does** (`/w/<token>/tidy`, linked from the dashboard): scans campaigns, keywords/targets, ads (product per campaign), product titles and 30 days of results (~10 DataDoe tokens per scan), then proposes:
  - one naming system: `SP | Product | Targeting | Keyword` (keeps the seller's own wording, strips ASINs, dates and codes; ranges become "Habit Nest Range")
  - one portfolio per product (only for campaigns without one; no budget cap)
  - flags: campaigns mixing match types ("split them"), campaigns with no impressions in 30 days (optional pause)
- Before → after preview grouped by product (spend, ACoS), untick any product, choose rename / portfolios / pause, **Tidy my campaigns**. Every batch dry-run first; **Undo** puts old names back and turns paused campaigns back on. Bids, budgets and targeting never change.
- **Live on Habit Nest:** 233 live SP campaigns, only 5 readable today; 132 with no impressions in 30 days; 21 mixing match types; 30 product groups, 6 new portfolios. Names like `OW_1950045994_20221202_fitness journal for women` → `SP | Badass Body Goals | Exact | fitness journal for women`.
- DataDoe formats verified with dry runs: CAMPAIGNS_UPDATE (name, portfolioId, state), PORTFOLIOS_ADD (name, state). **Needs** AMAZON_ADS_PORTFOLIOS_ADD enabled in DataDoe Settings → Actions (plus CAMPAIGNS_UPDATE). Not yet applied live (read-only account).
- ~40 DataDoe tokens spent testing. Tests 163/163, build OK.

---

## 2026-11-22 · Tagline, founder test flow, guarantee on checkout, loading steps everywhere
- Tagline **"Real work without the fluff"**: homepage kicker, hire sheet, dashboard sign-off, footer, site tagline (meta/llms), Dodo product description.
- **Founder test (docs/FOUNDER-TEST.md):** `/api/admin/tester?key=CRON_SECRET&email=…&fresh=1` archives the old Rocco and starts a fresh one with 30 days of free access (no Dodo, never counted). Then sign out → sign in → Connect Amazon → Habit Nest.
- **First pull starts the moment Amazon is connected** (was: next morning / Check now); the loading screen watches `/api/w/amazon/status` and opens the dashboard by itself.
- **Guarantee on the payment page:** Dodo product description now ends with "If you don't like the fixes I give you, ask for your money back. 30-day guarantee." (Praveen pastes it when creating the products). Same wording in the hire sheet and homepage.
- **Loading states:** components/LoadingText.tsx (steps tick off, current one pulses) on Connect Amazon, the first-load screen, Check now, every job approve, Create campaign (6 steps), Ask Rocco, Google sign-in and checkout.
- Tests 159/159, build OK.

---

## 2026-11-22 · Today's work as jobs, one-click exact campaign, budgets, paywall case
- **Why "Apply in Claude" showed:** the local preview had no DataDoe account, so the dashboard fell back to Claude mode. Removed for good: with Amazon connected Rocco makes changes himself; without, cards show exact steps + "I've made these changes".
- **Jobs, not 20 cards (lib/jobs.ts, components/dash/JobCards.tsx):** Block N wasteful searches · Lower N bids that overspend · Raise N bids on winners · New exact campaign from proven searches · Raise/Cut budgets · Placements · Low-stock ads · Structure, plus Seller Central jobs (restock, listings that can't sell, Buy Box). One Approve per job (untick items you don't want), Skip remembers. Claude's picks lead and give the "why"; otherwise risks first, then money.
- **Making changes:** a job goes out as one DataDoe Action per change type (3 tokens instead of 3 per change); a rejected batch is retried item by item. Budgets now applied (AMAZON_ADS_CAMPAIGNS_UPDATE). **One-click "New exact campaign"** (lib/create-campaign.ts): finds the SKU from the ads raw table (format checked on Habit Nest), then creates campaign → ad group → product ad → exact keywords → negatives in the old ad groups, dry run before each step. All request formats verified with free DataDoe dry runs; **not yet run live** (Habit Nest is read-only).
- **DataDoe needs (Praveen):** Settings → Actions: enable AMAZON_ADS_TARGETS_ADD, AMAZON_ADS_TARGETS_UPDATE, AMAZON_ADS_CAMPAIGNS_UPDATE, AMAZON_ADS_CAMPAIGNS_ADD, AMAZON_ADS_AD_GROUPS_ADD, AMAZON_ADS_ADS_ADD (every Action type is off by default). Accounts must connect with read & write (new invites already ask for it).
- **Paywall (hire sheet + unpaid page):** real urgency (Black Friday/Cyber Monday countdown from the calendar), ad-spend calculator ("cut just 5% of $5,000 = $250/mo back, 2.5× my price", stated as 5%), real proof ("on a real account spending $2.6K/mo on ads, I found 87 fixes on day one", anonymized), hire count from Dodo once ≥5, "2 months free · save $238", guarantee.
- Fixed: class-name clash with an old ".jobs" grid (now tw-*). Checked in a local browser (desktop + iPhone 13). Tests 158/158, build OK. ~4 DataDoe tokens spent testing.

---

## 2026-11-22 · Pricing $119/mo or $1,190/yr + 30-day guarantee; "saved you" card; motion
- **Pricing (Praveen):** $119 a month, or $1,190 a year (2 months free), yearly shown first and preselected everywhere. 30-day money-back guarantee (manual refunds in Dodo). Hire sheet has a yearly/monthly picker; the plan rides through Google sign-in to the right checkout. Every price mention updated (homepage, pricing, sheet, texts, MCP, llms.txt). Old discount code removed.
- **Needs Praveen:** create the two Dodo products and set `DODO_PRODUCT_ID_ANNUAL` / `DODO_PRODUCT_ID_MONTHLY` in Vercel (exact steps: docs/DODO-SETUP.md). Until then checkout uses the old product.
- **Dashboard:** "Rocco has saved you $X so far · N× what I cost" card right under the headline (counts up, meter past "paid for myself"; before any results it shows "~$X/mo found" vs "$99/mo"). Billing now records `hiredAt` and the plan. Side card is now "What worked".
- **Motion (calm base, small Duolingo-style moments):** page settles in, approving pops the card with a check and "+~$X/mo", count-up on savings; all off with reduced motion.
- Checked in a local browser (desktop + iPhone 13, no sideways scroll). Tests 153/153.

---

## 2026-11-22 · One export per report for many accounts (DataDoe cost fix)
- Daily pull now runs per group: the cron sends batches of 10 accounts (any teams); each batch makes **one export per report for the whole group** (DataDoe charges 2 tokens per export at any size), splits rows by `seller_or_vendor_id`, and runs each account through the engine. Check now = one group for the team's accounts. 100 sellers = 40 exports/day (~2,400 tokens/mo) instead of 400 (~24,000).
- Old per-account recurring exports retired automatically (they spent tokens daily); Habit Nest's 4 deleted (0 left on DataDoe). Fixed: DataDoe rejects a DELETE that carries a JSON content-type with no body.
- Live on Habit Nest: all 4 reports in 12s, no errors. ~24 tokens spent testing today.
- Checked DataDoe docs: retention (6/12/18/24 months, default forever) and table on/off are org-wide in Settings → Data, **not in the API**: Praveen sets them once (docs/COSTS.md lists what to keep).
- MarketplaceAdPros checked: ~$470–990/mo for 100 brands, competitor, not cheaper → stay on DataDoe.
- Pricing under discussion: $99/mo or $950/yr (annual shown first) vs today's $199 then $249 per quarter. Not changed yet.
- Tests 153/153.

---

## 2026-11-22 · Pay at signup + Rocco's AI layer (manager, brief, memory, Ask)
- **Pay at signup (like localseo.to):** Hire → Google → Dodo checkout (tagged with the team) → /welcome → "You're in, connect your Amazon". No free fix (FREE_PROPOSALS 0). Unpaid teams see a Hire card instead of Connect; the DataDoe invite and Check now return 402 without a plan; the daily cron skips unpaid and lapsed teams. Unpaid sign-ups cost $0.
- **AI layer (behind ANTHROPIC_API_KEY, Opus 5.5, falls back to rules without it):**
  1. Senior manager (lib/manager.ts, prompt lib/prompts/manager.ts v1): after each pull, Claude picks 3-5 of today's fixes, groups related ones, drops noise, writes a why-now line. Structured output (zod), and checkPlan only keeps real codes, each used once; any sentence with money or a % that isn't in the input is replaced by the rules text. Runs only when the set of fixes changes.
  2. Morning brief: one sentence under the dashboard headline, also used in the morning text.
  3. Memory (lib/memory.ts): approvals, Skip taps (/api/w/skip) and measured results per fix type. A type skipped 3+ times only shows bigger fixes; 3 failures and no wins holds that type back ("I held back N fixes"). Anonymized cross-account success rates (3+ accounts, counts only) go into the prompt.
  4. Ask Rocco box on the dashboard (/api/w/ask): answered from the account's numbers, fixes, history and memory; paying teams only; 40 a day.
- Dashboard: "Do these today" (Claude's picks, grouped cards approve/skip together), then "N more fixes I'd leave for later" (collapsed).
- Costs written up in docs/COSTS.md: ~$21–31 per seller per month at 100 sellers (DataDoe rows and tokens are most of it); real profit ~$10–13K in the first quarter, ~$15–18K per quarter after. Biggest saving to build next: one DataDoe export per table for all accounts (~$880/mo), once DataDoe confirms pricing.
- Tests 152/152, build OK. Not yet checked with a live Claude key (Praveen is adding ANTHROPIC_API_KEY to Vercel).

---

## 2026-11-22 · Production pass for 100 sellers
- **See it:** /api/admin/attach?key=CRON_SECRET&email=<Google sign-in email>&account=<DataDoe id> links an already-connected Amazon account (Habit Nest) to a Rocco account and runs the first pull; then rocco.works/me shows the dashboard.
- **Scale:** each account gets 4 DataDoe recurring exports (daily, rolling window), created once and reused by name (never duplicated: verified live, duplicates from testing deleted; 4 remain for Habit Nest). Daily pull = download latest files. Cron dispatches batches of 8 accounts to /api/cron/amazon/batch (own 300s run each, 0-50s stagger) via the public domain; all DataDoe calls retry 429s with backoff. Supabase list query fixed. Reconnect flow: banner + one-tap reconnect invite when Amazon's authorization lapses.
- **Judgment:** budget-cut proposals only when the campaign uses ≥60% of its budget (otherwise flagged as a bids/search-term problem).
- **Conversion/clutter:** signup sheet copy now matches the product (first fix free → connect → approve → I make it); header chat bubble and footer Setup link removed.
- Costs at 100 sellers (DataDoe): 4 exports/day/account ≈ 24,000 AI tokens/month (~$900 in bundles beyond the plan) + data rows (typical 0.5–10M/seller → extensions at $49/10M). Turn off unused DataDoe tables + 6-month retention. Not deducted from hackathon profit, but real money.
- Tests 146/146, build OK.

---

## 2026-11-22 · First live pull from DataDoe (Habit Nest US): works end to end
- DataDoe load reached SECOND_STAGE; export sources available. Pinned tables (DataDoe's "recommended" match was a profit table): amazon_ads_search_terms_by_campaign_by_date, amazon_ads_performance_by_campaign_by_date, amazon_sales_and_traffic_with_cogs, amazon_fba_inventory_health. Only needed columns exported; renamed to Amazon headers; campaigns rolled up per campaign (latest budget), sales & traffic summed per ASIN (page-view-weighted Buy Box), inventory = latest snapshot per SKU; Sponsored Products only.
- Live result (30 days): ads spend $2,631, ACoS 20%, search-term grade A (~$82/mo leak); 232 campaigns; 23 ASINs; 2 SKUs could run out within 2 weeks. 87 fixes, 66 with Amazon IDs (Rocco can make negatives/bids directly). Top: lower bid on "sidekicks" (ACoS 49% vs 30% target).
- Fixed from real data: TACoS no longer shown when total sales < ad sales (sales history still loading). Note: Node fetch needs NODE_USE_ENV_PROXY=1 in this sandbox only (not on Vercel).
- Weak spot seen: budget fixes on campaigns using ~1% of budget ("cut budget") are low value; to improve.
- Tests 146/146.

---

## 2026-11-21 · New workflow: direct Amazon connection (DataDoe) end to end + redesign
- **Apply:** approving a fix makes the change in Amazon through DataDoe write Actions: negative exact keywords (TARGETS_ADD negative) and bid changes (TARGETS_UPDATE), dry run first, idempotency key, logged for the week-later check; anything without Amazon IDs or of another kind returns exact steps. New invites are READ_AND_WRITE (Habit Nest was connected read-only: switch it in DataDoe → Sellers & Vendors if we want to test writes).
- **Daily pull:** lib/datadoe-sync.ts (find export source per report → CSV export → column adapter → engine → morning text). /api/cron/amazon at 13:00 UTC + "Check now" (max hourly). Column mapping unverified until Habit Nest's first load finishes.
- **Rocco page v5:** connect screen → "Amazon is sending me your data" → dashboard (account pill, hero total, ACoS bar, KPIs with deltas, alerts, fix cards with math + confidence + Approve/Skip, results, coming-up checks). Removed Team card, invite links, Slack/phones, setup modes (Claude + report inbox under "Other ways").
- **Homepage v5:** hero with live sample dashboard (approve → "Done in Amazon"), how a fix happens, "Other tools give your AI data. I give you decisions." comparison, "ask me in Claude/ChatGPT too", price card; CTA "Connect Amazon". Nav: Setup removed. Site/footer copy updated. Pricing FAQ updated.
- Tests 143/143, build OK.

---

## 2026-11-21 · DataDoe: first real account connected, Connect Amazon built
- DataDoe API key saved via the secure form (environment network secret; for production add DATADOE_API_KEY in Vercel). Test read-only invite → Praveen connected "Habit Nest US" (Seller Central + Ads, US). DataDoe first-stage load in progress; exports unavailable until it finishes.
- Built: lib/datadoe.ts (invite, account, status), POST /api/w/amazon (team's one-time invite, reused while valid), GET /api/datadoe/callback (only trusts our own invitationId, re-reads the account from DataDoe, links it, texts the team), Connect Amazon card on the team page (status per account), /me passes the result through. Read-only for now. Tests 141/141.
- Next: once the load finishes, map DataDoe exports (search terms, campaigns, sales & traffic, inventory) into Rocco's engine + daily pull; then read-write invites and approved changes via Actions (dry run first).

---

## 2026-11-21 · DataDoe checked: fits as Rocco's data + action layer
- Read DataDoe's API docs (hosts app/www/api.datadoe.com allowed in this environment). Invite links via API connect unlimited Seller Central + Ads accounts into our org (any marketplace), REST exports give daily data, write Actions can apply approved bids/budgets/negatives (dry run free). $97/mo after the 14-day trial; watch data rows (+$49/10M) and AI tokens. Full notes: docs/DATADOE.md. Waiting on Praveen: go-ahead, API key (secure form, never chat), and a terms check with DataDoe.

---

## 2026-11-19 · Two versions: US (Claude) and everywhere else (Amazon's report emails)
- **Region split** (lib/region.ts): Vercel country header; US → Claude version, elsewhere → report-inbox version; override via /api/region?r=us|intl; teams get `mode` at sign-up and can switch on their setup page.
- **Report inbox** (lib/inbox.ts, /api/inbound/email, workers/email-inbound.js): <code>@in.rocco.works; raw email (Cloudflare Email Worker, free) or Postmark JSON; CSV/TSV/XLSX/GZ attachments → same analysis engine; pre-signed links only (never logs in); link-only emails flagged; inbox log on the team; first report → "🔔 I'm on" text/Slack with top fixes. Setup + test plan: docs/REPORTS-INBOX.md.
- **Reports-mode setup** (ReportSteps): inbox address → schedule Ads search term report → Seller Central files (upload) → live "waiting for your first report".
- **Making changes without Claude:** every fix has exact Ads console clicks (lib/howto.ts); dashboard "I've made this change" and text "DONE N1" log it; results checked when the next reports land.
- Homepage: outside the US shows "Amazon emails your reports. I read every one." (email mock + Rocco text) instead of the Claude section; switch link under the price card.
- Amazon Quick (Sept 23, 2026, Accelerate): Amazon's own agent workspace with approve-before-act cards, Selling Partner plugin in Quick + Claude (US beta). Positioning: Rocco = memory + judgment + follow-up across ads/stock/listings, works next to it.
- Tests 139/139, build OK. Blocked on Praveen: inbound email (Cloudflare Email Routing or Postmark) + ROCCO_INBOUND_SECRET.

---

## 2026-11-19 · Proof-first changes (buyer feedback)
- **Judgment:** negatives now need ≥2 expected orders at the ad group's (or account's) conversion rate (~86%+ confidence), or spend above one average order × break-even ACoS, or junk intent. Last 3 days of daily reports don't count (orders still landing). Launch / ranking / brand-defense / test campaigns (by name, or named by the team via set_brand_settings protected_campaigns) are never auto-negated. Every reason states the math. Leak totals use the same verdicts (fixture leak $481 → $392/mo).
- **Honest numbers:** results carry a basis: blocked terms = spend avoided (estimate); bid/budget cuts with sales holding = measured. Dashboard, analytics, client report, texts and Claude show "measured" vs "est." separately; homepage samples reworded ("sales kept").
- **First finding before payment:** Hire → Google sign-in → their Rocco page with setup (no checkout) → the top fix of each analysis is shown in full and approvable; the rest locked with "plus ~$X more" → pay from there. FREE_PROPOSALS = 1.
- Tests 131/131.

---

## 2026-11-19 · Buyer review: "interested, wouldn't pay yet"
- Feedback: value = memory + prepared changes + result follow-up. Blockers: headline overpromises (buyer still drives Claude), wants a real first finding on their own account before paying, judgment too simple (negatives = 10 clicks/0 orders; needs conversion lag, product economics, campaign purpose), "saved" figures are projections, not measured savings. Recommends pausing homepage work and proving one real account end to end.
- Verified in code: lib/rules/negatives.ts flags any term with ≥ minClicksNegative clicks and 0 orders; savedEstimate extrapolates past spend.
- Proposed next: (1) proof run on one real account (with owner consent), (2) judgment upgrade (lag, break-even ACoS from margin, campaign intent), (3) honest "projected vs measured" wording, (4) first real finding before paywall. Waiting for Praveen's go.

---

## 2026-11-19 · Quarterly pricing, light theme, Boardy-clean homepage
- **Pricing:** $199 for the first 3 months, then $249 every 3 months (Praveen). Ladder and the automatic Dodo price PATCH removed; one PRICE copy source (lib/pricing.ts) used on pricing, homepage, dashboard, paywall texts, MCP, llms.txt. Checkout adds `discount_code` from DODO_DISCOUNT_CODE (unverified param; test one checkout). Dodo setup steps in DODO-SETUP.md.
- **Light theme only** (dark mode removed), Boardy palette.
- **Homepage v4:** hero (+ "for brand owners, Amazon managers and agencies") → How a fix happens (01/02/03 with filling progress line + phone that changes per step) → Claude knows Amazon, I know your account (steps, copy-link box, Claude chat mock with Amazon tool calls + Rocco memory toast) → Built for whoever runs the account (owners, managers, agencies) → A day with me → Hire me ($199 card, one button) + floating Hire bar after the hero. No salary comparison.
- Tests 127/127, build OK.

---

## 2026-11-19 · Homepage v3 (one angle, one CTA), Claude-only setup, no access without paying
- Praveen's live test: Google sign-up worked; unpaid users could open setup via "Your Rocco" → fixed. /welcome now verifies the Dodo payment/subscription id with Dodo's API before showing "You're in"; "Your Rocco" goes to /me (no welcome note); an unpaid team's page shows "One step left: hire me" instead of the setup steps. hireUrl now prefills the owner email and returns to /welcome.
- Setup is Claude only (Claude is the AI with Amazon's official connectors): add Rocco → plug in Amazon → ask → make it daily.
- Homepage rebuilt around one angle (a senior Amazon manager for $99/year) and one CTA (Hire Rocco): hero → Watch me work (small screen, 4 fixes approved in turn: send stock, cut waste, raise a bid, fix a suppressed listing) → "Claude is the hands. I'm the manager." (Amazon → Claude → Rocco diagram, what each does) → A day with me (message timeline) → Hire me ($5,000+/mo manager vs $99/yr, 4 checks, one button). Removed: text-me-first CTA, app tiles, "tools you already pay for", jobs grid. Site description no longer says ChatGPT / free.
- Dodo checkout still runs the legacy one-time product with old copy (mentions ChatGPT, "for life"); new product copy is in DODO-SETUP.md for Praveen to paste.
- Tests 128/128.

---

## 2026-11-19 · Google sign-in + "Apply in Claude"
- **Sign in with Google** (lib/google.ts, lib/session.ts, lib/signin.ts, /api/auth/google, /callback, /api/auth/signout). Hire Rocco → Continue with Google → checkout tagged with the team → /welcome → setup. Teams are found by owner email on any device (paid team first); a browser's ownerless team is claimed; never takes over another email's team. Sealed httpOnly cookies (rocco_user, rocco_team) + a non-secret rocco_in flag for the nav ("Sign in" / "Your Rocco"). State is sealed + bound to a nonce cookie (10 min); only verified Google emails. Falls back to the email form until GOOGLE_CLIENT_ID/SECRET are set (GO-LIVE §13). Sign out on the dashboard.
- **Approvals → Claude**: Amazon's connectors need a preview + typed confirm inside Claude, so Rocco can't apply edits from the dashboard or iMessage. Approving (dashboard button or texting YES) queues the codes and now gives a one-tap **Apply in Claude** link (claude.ai/new with "Rocco, apply my approved fixes: N1, B2"). Claude's rocco_brief lists them, Amazon's connector shows the preview, the user confirms, Rocco logs and grades.
- Tests 128/128, build OK.

---

## 2026-11-19 · Homepage: Claude only (no ChatGPT/Cursor)
- Only Claude has Amazon's official connectors, so the homepage orbit, scenes, feed and copy now show iMessage, Claude, Slack, Claude Code, Calendar. Tests 123/123.
- Data flow explained to Praveen: Claude calls Amazon's connector, then passes those rows to Rocco's analyze_report tool; Rocco stores snapshots/proposals/actions in Supabase under the team's workspace (found from the connector's OAuth token). Next: real sign-up (account) before pay; scheduled-report email inbox as a no-API data route.

---

## 2026-11-19 · Amazon access: hold direct API, no credential shortcut
- Ads Partner Network application needs a seller/ads account; Praveen will set up a clean Rocco business account first. Sign in with Amazon is on hold.
- Ruled out: buying API access; inviting Praveen as a user to client accounts and pulling with his login (scraping, breaks Amazon terms and hard rules 2 and 6).
- Allowed once Rocco has Ads API access: sellers invite a Rocco user to their ads account, then Rocco reads it through the official API. Meanwhile: Claude/ChatGPT Amazon connectors + reports sellers send (upload/text/email).

---

## 2026-11-19 · Amazon Ads API application started
- Praveen is creating the Login with Amazon security profile "Rocco". Field values + web settings recorded in docs/AMAZON-API-APPLICATIONS.md §1. Next: Web Settings → Ads API access request (paste-ready answers in the same doc) → SP-API developer registration. OAuth callbacks get built only after approval.
- Positioning vs Amazon Ads' own agent: it lives inside the Ads console and covers ads only; Rocco is the cross-channel manager (ads + Seller Central + stock + listings) with memory, approvals and follow-ups in iMessage/Slack/Claude. Work beside it, not against it.

---

## 2026-11-18 · Direct pay, +$10 per hire, email step
- No trial: $99/year up front. Ladder +$10 with every hire (cap $499 at hire #41). Hire sheet asks for work email → checkout prefilled + tagged → welcome → setup. All trial copy removed (homepage, sheet, pricing, dashboard, analytics, texts, MCP, llms.txt, connect FAQ, launch kit). Tests 123/123.

---

## 2026-11-18 · Hire-first homepage + "Watch me work" feed
- Main CTA is now **Hire Rocco** (hero, "Hire me." section, pricing). Tap → Boardy bottom sheet (3-day free trial, then $99/year, cancel anytime) → POST /api/hire (human-gated) creates the team's Rocco (or reuses this browser's), sets the sealed rocco_team cookie, returns the Dodo checkout tagged with the team (metadata_ref = workspace id, redirect /welcome; the key never goes to Dodo) → /welcome opens their Rocco page with "🎉 You're in" + setup.
- Texting stays as the secondary option ("Text me on iMessage" pill, "Or text me first").
- Below the fold: "Watch me work." animated approvals feed (stock sends, cuts, bid moves, suppressed listing, budget moves, result checks, client reports, by teammates via iMessage/Slack/Claude/ChatGPT), labeled as a sample brand.
- Tests 123/123.

---

## 2026-11-18 · Real connect test (Praveen): sign-in + Amazon "primary user" gate
- Found: (1) the private-key connector link makes Claude show "No sign-in … anyone with the URL can use this connector": scary. (2) Amazon Selling Partner connector requires the account's primary user to enable AI agents (Settings → Manage Agents) before secondary users can connect.
- Fixed (1): setup now always hands out https://rocco.works/mcp/login (OAuth). Opening your Rocco page remembers the team in that browser (sealed httpOnly cookie via /api/w/remember); Rocco's Connect page then offers "Connect Claude to <your team>" (or "Start a new Rocco instead"). Verified end to end locally: token returned = the remembered team.
- Fixed (2): Seller Central step has "Amazon says ask the primary user?" with a copy/text-ready message for the owner (Settings → Manage Agents → enable Amazon Selling Partner plugin for my login) + fallback: text Rocco a report.
- GTM implication: lead with owner-operators (they're the primary user, connect directly); agencies/teams need the owner once (and the owner is the buyer).

---

## 2026-11-18 · Test workspaces on production + owner trial switch
- Created test workspaces on rocco.works for Praveen to click through (keys in chat, not in the repo).
- GET /api/admin/trial?t=<key>&key=<CRON_SECRET> grants a workspace a 3-day trial (no payment) to preview the full dashboard; &off=1 removes it.

---

## 2026-11-18 · Yearly plan + 3-day card trial, no free plan
- lib/access.ts (paid / trial / none), lib/billing.ts (Dodo subscription → state, verified via API), webhook rewritten, ladder counts unique paying customers, price sync keeps the recurring price object, CANCEL text, trial-ends-tomorrow reminder.
- Gating everywhere: buildBrief (no access = all locked, teaser totals), text commands (numbers/brief/wins/YES/undo/ask → teaser + trial link), dashboard approvals, MCP tools/export/apply, analytics, morning cron (teaser max 3, no numbers), bridge push (teaser instead of numbers).
- UI: Boardy bottom-sheet trial offer after the setup steps (closable), dashboard trial banner, trial countdown note; pricing page ($99/year, 3-day trial), homepage fine print, llms.txt, connect FAQ, launch kit.
- Praveen must: create the Dodo subscription product + set DODO_PRODUCT_ID, set webhook events (see GO-LIVE). Tests 122/122.

---

## 2026-11-18 · Dashboard v2 + approvals from the web; ad-safe opt-in limits
- LoopMessage counts a contact on the first message sent (Praveen), so the 150/hour site cap is gone (ads never blocked); per-visitor limit 10 per 10 min; bot/prefetch filter stays.
- Rocco page (one per team; solo seller = team of one; agency = one Rocco per client, brand tabs for multi-brand):
  - Before data: the 5-step setup (unchanged). After: headline "N fixes waiting, ~$X/mo." + freshness, today chips (🚨 listings, ⚠️ Buy Box, ads, sales, conversion, 📦 stock), fix cards with Approve / Approve all / Cancel (same queue as texting YES; free plan top 3, locked row → Hire), Wins card, Team card (AI connected, phones, Slack, copy invite link, text from this phone), links row (Analytics, Change log, Client report, Calendar, Setup).
  - Change log moved to /w/KEY/log. Approvals: POST /api/w/approve.
- Tests 121/121.

---

## 2026-11-18 · Bot-proof LoopMessage contacts
- Problem: each opened opt-in link can cost a LoopMessage contact. Raw links were in page HTML (crawlers/prefetch), generated server-side every minute on the homepage, and sent in texts/Slack (Apple/Slack link previews).
- Now: the opt-in link is created only by POST /api/text/start on a real tap (x-rocco-tap header from our JS, same-origin, not a bot/preview/prefetch UA, 4 per visitor per 10 min, 150/hour site-wide). No page HTML contains one (verified on /, /text, /answers, /pricing).
- Buttons (homepage, hero pill, ask box, app grid, answers, Rocco page) use startText(); no-JS fallback /text. Invites and the Claude "get it by text" line now point to rocco.works/j/CODE (our page, safe for link previews); the teammate taps there.
- robots.txt disallows /text, /j/, /oauth/ too. Tests 120/120.

---

## 2026-11-18 · Claude bridge: connect once, Rocco texts the team
- iMessage/Slack onboarding ends with one link: "Let's turn me on for your Amazon. Connect once in Claude or ChatGPT, 2 minutes" → the step-by-step page (now 5 steps: AI → add Rocco → Seller Central → first check → Make it daily).
- Make it daily: scheduled task "Rocco, morning check" where the AI app supports it; Claude Code gets the cron line; otherwise Rocco's morning text is a one-tap link that opens Claude/ChatGPT with the prompt typed (AI choice saved via /api/workspace/prefs).
- The bing (lib/notify.ts): first tool call from the team's AI → "🔔 I'm on!" to every phone + Slack. First finished check (rocco_brief after analyses) → "✅ Amazon is connected" + numbers pushed immediately; after that, numbers push the moment each day's check lands (once per day).
- Morning cron: skip teams already pushed today; no check yet → one-tap link; not connected → setup reminder (max 3, 2 days apart); texted-CSV teams still get numbers from their last report.
- Direct Amazon API connection on hold until Praveen submits the applications.
- Tests 117/117.

---

## 2026-11-18 · Headline + Rocco in Slack
- Headline: "I can run your Amazon business, try me." (two lines on iPhone).
- Slack: Add to Slack (OAuth v2, sealed state, bot token sealed), welcome post in the chosen channel, @Rocco mentions (thread replies) and DMs answered by the same handler as iMessage (approvals queue, brief, wins, paywall moments), morning numbers posted to the channel by the daily cron. Identity reuses the phones table (slack-team:/slack: keys). Signature verification + dedupe; replies posted after the 200 (next/server after).
- Rocco page: "Rocco in Slack" card (Add to Slack / connected to #channel). Homepage: Slack scene (#amazon-team morning post + "@Rocco yes N1 B1"), Slack in the app grid and the flow strip.
- docs/slack-manifest.yml + GO-LIVE §11. Tests 115/115.

---

## 2026-11-18 · Hero v5 + iMessage data plan
- Hero: smaller card (68vw, max 290px), all apps on the lower half of the circle under the card, smaller pill, pause button removed, consistent labels ("Rocco + Amazon's connectors" everywhere; iMessage "online · Amazon connected").
- New "How it fits together." strip: Amazon's own connectors (your data) → Rocco (the manager) → iMessage/Claude/ChatGPT (where you talk).
- docs/IMESSAGE-DATA-PLAN.md: how iMessage gets real Amazon data (direct Amazon API connection, Claude scheduled bridge, texted reports, forwarded report emails) + the Claude tool-use layer for texts. Recommendation awaiting Praveen's go.

---

## 2026-11-18 · Homepage v4, matched to Boardy's screen recording
- Studied Praveen's Boardy recording frame by frame. Matched: Raleway 500 headline in one sentence ("I can run your Amazon, try me."), small centered card (76vw, max 340px) with a soft colored glow per app, apps on a dotted circle centred below the card (45° apart, active app bottom-centre, larger, glowing; top half empty), pill + pause, "Rocco, help me with ___" box, header with small centred logo + name and the round message button that appears only after scrolling.
- Opening animation like Boardy: grey row of app icons slides together, the card grows out of it, apps settle on the circle, then messages appear.
- Real logos (Simple Icons, CC0): iMessage, Claude, ChatGPT/OpenAI, Cursor, Google Calendar; Claude Code drawn as a terminal tile. Amazon and Helium 10 logos deliberately not used (trademark/affiliation); tools moved below as names.
- Scenes now show Rocco across channels doing the whole Amazon job (ads, Seller Central, suppressed listing + stock, multi-brand Claude Code check, calendar follow-up on a change, listing keyword gaps).
- New sections: "Everything your Amazon needs, one teammate." (Ads, Seller Central, Inventory, Listings, Results, Your team) → How I work → Message me (real app logos) → I work the tools you already pay for.

---

## 2026-11-17 (late) · SEO/AEO: Answers
- /answers + 14 answer pages (lib/answers.ts): connect Seller Central / Amazon Ads to Claude & ChatGPT, Amazon Ads MCP, Helium 10 with Claude, can AI manage PPC, good ACoS, lower ACoS fast, clicks before negating, TACoS, top-of-search adjustments, suppressed listings, Buy Box, FBA restock quantity, where to find the search term report.
- Each page: direct 40-70 word answer first (what answer engines quote), steps, FAQ, related links; FAQPage + HowTo + BreadcrumbList JSON-LD; "Ask Rocco about my account" opens Messages with the question prefilled.
- Sitemap includes all answers; llms.txt rewritten for the current product (iMessage + connector + OAuth URL, all answers/guides/tools, pricing). Header nav: Setup · Pricing · Answers.
- Next for SEO: submit sitemap in Google Search Console + Bing Webmaster (Praveen), add 2-3 answers per week from real texts people send Rocco.

---

## 2026-11-17 (late) · Boardy look site-wide + Pro analytics
- Look: Boardy palette (warm gray #f4f2ee, near-white cards, navy ink, blue #1f6feb), centered "Rocco" header with round message button, Boardy footer ("The AI Amazon manager in your iMessages."), lighter headings.
- Pro analytics at /w/KEY/analytics: KPI tiles with deltas vs last check, ad spend vs sales, ACoS vs target (dashed target), waste per month, conversion, money saved per change, SKUs at risk, listings not selling. Server-rendered SVG, hover titles, table view per chart, series colors validated light+dark (dataviz validator). Free plan sees tiles + blurred charts behind a "Hire Rocco" card (personal checkout link, auto-unlock).
- Linked from the Rocco page; listed on /pricing.

---

## 2026-11-17 (late) · Rocco's brain + "text me your report"
- lib/brain.ts (Anthropic SDK, claude-opus-5-5, effort low, server-side refusal fallback "default", cached system prompt in lib/prompts/text-reply.ts). Off until ANTHROPIC_API_KEY is set.
- Free-text texts ("why is ACoS up?") answered from the team's context (about, brief, latest snapshots + findings, pending approvals). Screenshots (iMessage attachments) read with vision.
- Texted CSV/TSV reports run through Rocco's own engine immediately (no key needed), also as someone's very first text (skips the intro: value first).
- Webhook attachments parsed (strings or {url}, https only). /api/health shows brain status.
- Tests 113/113 (brain calls stubbed).

---

## 2026-11-17 (late) · Fire alarms: suppressed listings + Buy Box
- New report kind listing_health (All Listings / Suppressed Listings report, or Listings Items API JSON with issues). Flags suppressed/inactive/incomplete listings with Amazon's reason.
- Business Report now records Buy Box <90% counts (buyBoxLow, buyBoxWorst).
- Morning text leads with 🚨 listings not selling and ⚠️ Buy Box below 90%. morning_check data plan pulls listing health first; new rocco_plan job listing_health.
- Demo brand includes a suppressed listing, so the demo opens with the alarm.
- Tests 108/108.

---

## 2026-11-17 (late) · Sign up by adding Rocco in Claude (MCP OAuth)
- New connector URL https://rocco.works/mcp/login. Claude/ChatGPT get a 401 + OAuth metadata, open Rocco's one-button Connect page, which creates the team's Rocco (or reuses it from a pasted Rocco page link), and return signed in. Stateless (sealed client ids/codes/refresh tokens), PKCE S256, dynamic client registration. Access token = workspace key.
- /setup now hands out the sign-in URL (no workspace created for page views); personal pages keep their private URL.
- First rocco_brief includes a one-tap "get these numbers by text" link until a phone joins.
- Fonts: Inter Tight medium headings (Boardy-like) instead of Bricolage.
- Tests 104/104 (OAuth flow end to end incl. bad verifier and foreign redirect).
- Next: submit Rocco to Claude's connector directory with /mcp/login.

---

## 2026-11-17 (late) · Paywall at the right moments
- lib/paywall.ts: found / worked / locked / team moments with throttles; wired into texts, morning cron, MCP (brief + analyze) and dashboard. Details in docs/PRICING-MODEL.md.
- Auto-unlock: checkout links carry the workspace; /api/dodo/webhook verifies the payment via Dodo's API and unlocks + texts the team. Text "activate <key>" also works.
- Morning cron no longer texts teams with no data.
- Tests 101/101. Needs the Dodo webhook URL set in Dodo (https://rocco.works/api/dodo/webhook) for auto-unlock.

---

## 2026-11-17 (late) · Homepage v3, modeled on boardy.ai
- Headline "I can run your Amazon. Try me." + a card that cycles through where Rocco works (iMessage, Claude, Amazon Ads, Helium 10, Seller Central, ChatGPT), each with one senior-manager move; tool icons orbit below; pill CTA per scene; pause button.
- "Rocco, help me with ___" box types example asks; sending opens Messages with that first text (/api/text/start generates the LoopMessage opt-in link with the question in it).
- Below: "How I work." (ask → I dig in → you say yes) and "Message me." with an app grid (iMessage, Claude, ChatGPT, Claude Code) and the tools Rocco works.
- Skipped on purpose: testimonials, intro counters, globe (no real data yet; add when real).
- Tool tiles are text monograms, not brand logos.

---

## 2026-11-17 (late) · Positioning: senior Amazon manager in your iMessages
- Praveen: other MCPs (Amazon's, Helium 10) aren't competition; the moat is the senior manager in iMessage who works all of them.
- Homepage: Boardy-style "or find me in Claude · ChatGPT · Claude Code" row, and "I work the tools you already pay for: Seller Central · Amazon Ads · Helium 10 · SellerSprite · + any connector".
- rocco_plan now tells the AI how to use Helium 10 / SellerSprite / keyword tools when connected (rank check before negating, competitor keywords for listing gaps, organic-rank context in the morning check). Verified: Helium 10 has an official MCP (Diamond plan); SellerSprite has one; Jungle Scout only unofficial ones (not named).

---

## 2026-11-17 (late) · Journey rebuilt after Praveen's iPhone test
Feedback: first message "I'm in! "!9GUF"" is ugly; texts full of links to copy; "link CODE" confusing; contact card showed a different number than the one texting; /setup is a scroll of URLs, not Boardy style; mascot not real enough.
Shipped:
- Homepage button generates its own first message: "Hey Rocco 👋 Show me what you can do" (LoopMessage code still appended, Rocco strips it).
- First reply: hello + one question + contact card. Card is built per number (/card/<number>.vcf) and only sent when the webhook tells us which Rocco number they texted (or ROCCO_PHONE is set for a dedicated line). /api/health shows the webhook's field names to confirm.
- After they answer: a demo brand's morning numbers (real engine on sample reports), then ONE link alone in its own bubble (rich preview, one tap) to their Rocco page.
- No codes to type: "invite" sends a one-tap join link for teammates; "join CODE" still works. "demo", "link" commands. YES before data explains what would happen.
- Their Rocco page (/w/KEY) with no data = one job: a 4-step, one-card-at-a-time flow (pick AI → add Rocco → plug in Seller Central → "Open Claude and ask"). /setup uses the same flow; all URLs/config moved into a collapsed section.
- docs/MANAGER-CADENCE.md: daily/weekly/monthly manager jobs vs what Rocco covers, build order.
Open: realistic raccoon avatar (Praveen to generate), dedicated LoopMessage number for a stable card, Anthropic key for real conversation + screenshot reading, Claude connector directory listing + OAuth sign-in.

---

## 2026-11-17 (00:30) · Discussion: engagement before Amazon API access, price
- Recommendation: keep $99 (price isn't the blocker, data is). Hooks before API access: free account check from a texted screenshot/export (needs ANTHROPIC_API_KEY), Seller Central connector (open beta) + Rocco in Claude, daily Rocco Daily texts (deadlines, fee/policy changes, benchmarks), team/agency angle. Optional: money-back if Rocco doesn't find $99+ of waste in 14 days (needs Praveen's ok; refunds cut profit).
- Listed every MCP tool for Praveen (13 on the personal connector, 3 on shared /mcp).

---

## 2026-11-17 (00:15) · Text Rocco feels like Boardy
- First text from a new number: two short bubbles ("Hey, I'm Rocco… / Who am I talking to, and what do you sell on Amazon?") then Rocco's contact card (public/rocco.vcf: name, photo, number, site) so iPhone shows "New contact information · Add".
- Their answer is saved (workspace.about), Rocco greets them by name and sends 3 bubbles: plug in Amazon (setup?t=KEY), dashboard, team code.
- Replies are now multiple bubbles (respond() → {bubbles, card}); the webhook sends them ~1s apart.
- vCard number is hardcoded to the LoopMessage shared line +1 408 636 8580; update public/rocco.vcf if the sender changes.
- Open gap: numbers with no Claude setup need Amazon API access (apply today) or "text a screenshot" (needs ANTHROPIC_API_KEY, pending Praveen's ok).
- Tests 94/94.

---

## 2026-11-17 (23:40) · Text Rocco: first text now works
- Bug (found by Praveen on iPhone): every text from an unlinked number got the same "text link + code" wall, and /setup had no way back to a dashboard.
- Fix: the first text from a new number creates that number's own Rocco and replies with 3 links: plug in Amazon (rocco.works/setup?t=KEY, the wizard picks up the personal connector), dashboard, and the team code. help / numbers / dashboard all answer from then on; "numbers" with no data points to setup.
- Workspace key is kept AES-256-GCM sealed (lib/vault.ts, key = ROCCO_VAULT_KEY or the Supabase key) so "dashboard" can resend it; old workspaces backfill when their connector or dashboard is used.
- Tests 93/93.

---

## 2026-11-17 (23:00) · Opt-in env renamed
- Vercel warned on `NEXT_PUBLIC_` + Sensitive. The opt-in link is only read server-side, so the env is now `ROCCO_OPTIN_URL` (old name still accepted).

---

## 2026-11-17 (22:45) · LoopMessage wired to the real API
- Praveen: rocco.works now primary (verified: apex 200, www→apex, MCP on apex OK); LoopMessage $20/mo shared sender + sandbox opt-in done.
- Read LoopMessage docs (sandbox, credentials, send, webhooks, opt-in) and fixed the integration: send POST https://a.loopmessage.com/api/v1/message/send/ with `Authorization: <key>` and {contact, text, sender?}; webhook event `message_inbound` with `contact`/`text`; opt-in links via /opt-in/generate-url (sender_type shared) carrying the workspace link code → phone links automatically from the dashboard; webhook retries deduped by webhook_id; owner test-send endpoint /api/text/test (CRON_SECRET). Env: LOOPMESSAGE_API_KEY, LOOPMESSAGE_SENDER_TYPE=shared, NEXT_PUBLIC_ROCCO_OPTIN_URL, TEXT_WEBHOOK_SECRET, CRON_SECRET.
- Tests 92. Build clean.

---

## 2026-11-17 (22:15) · Explained texting + Claude flow
- Documented in `docs/BOARDY-STUDY.md`: texts read Rocco's memory; memory fills when Claude (with Amazon's connectors + Rocco's personal URL) runs a morning check; text approvals queue for the next Claude session. Freshness limit + autopilot workaround.

---

## 2026-11-17 (22:00) · LIVE: rocco.works verified end to end
- Praveen: deployed, DNS, Supabase (setup.sql), env vars, /api/health ok:true, hackathon tracker "installed", Dodo webhook set. CRON_SECRET / TEXT_WEBHOOK_SECRET not set yet (texting not live).
- Claude (sandbox now allowed to reach rocco.works): all pages 200; tracker in <head>; /api/price live:true (reads Dodo); shared /mcp tools/list OK; personal workspace persisted in Supabase; brief → analyze (test brand "rocco-test") → apply N1 → list_changes → dashboard (link code) → calendar.ics → client report all OK on production.
- Issue: Vercel primary domain is www (rocco.works 308-redirects to www). All links/connector URLs use rocco.works → set rocco.works as primary in Vercel (redirect www → apex). POSTs to /mcp on the apex currently get a 308.
- Fixed: /api/health garbled arrows in Safari (charset + ASCII).
- Amazon API approval: no official SLA found; Ads API needs an account with ad spend and two portals (LWA security profile + Ads Partner Network console).

---

## 2026-11-17 (21:00) · Launch readiness
- Wrote `docs/E2E-TEST.md` (ordered end-to-end checklist: infra → tracker → site → memory/connector → Amazon connectors → payments → texting). Added texting/phone + STOP section to the privacy page.
- Code done; remaining = Praveen's setup (deploy, DNS, env + redeploy, setup.sql, tracker check, Dodo KYC + webhook, LoopMessage, Amazon API access) and the real-world tests that need them.

---

## 2026-11-17 (20:45) · Plan renamed "Hire Rocco"
- Dodo product renamed "Hire Rocco" (price unchanged, $99). Pricing page rebuilt as one centered card ("Hire Rocco. Pay once. I work for your team forever.", next price, hire #, 5 inclusions, button, 4 FAQs). All copy updated (chat/text paywall, terms, llms.txt, launch kit).

---

## 2026-11-17 (20:30) · Memory fix + "Hi, I'm Rocco" homepage
- Memory button failing in production: fixed likely causes in code: new Supabase `sb_secret_…` keys now sent only as `apikey` (legacy JWT keys keep Authorization); URL normalized; accepts SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY/SUPABASE_SECRET_KEY/SUPABASE_SERVICE_KEY/SUPABASE_KEY; workspace API returns a specific hint (key rejected / tables missing). New `/api/health` shows what's set and whether each table answers (no secret values). Reminder: Vercel env changes need a redeploy.
- Site simplified Boardy-style (couldn't load boardy.ai from the sandbox): minimal header (logo · How it works · Pricing · Text Rocco), one-line footer, homepage = Rocco avatar + "Hi, I'm Rocco." + one sentence + Text Rocco + 3 example texts.
- Praveen dislikes the plan name "Founding Lifetime": rename pending his pick.
- Tests 85. Build clean.

---

## 2026-11-17 (19:30) · Boardy-style homepage + Text Rocco engine
- Homepage is now one screen: "Text Rocco about your Amazon business", big Text Rocco button, iPhone iMessage demo, team positioning; long sections moved off the homepage (still on /connect, /setup, /pricing).
- Text Rocco works end to end in dry-run (no LoopMessage keys yet): link code per workspace (whole team can link phones), morning numbers (spend, sales, ACoS vs target, leak + trend, new money-burners, stock risk, wins, benchmark, fixes with "Reply YES"), approvals by text queued for the team's AI (shown first in rocco_brief), undo, wins, STOP/START, questions from memory. Webhook + daily cron + vercel.json. Supabase `phones` table (re-run setup.sql).
- Tests 82. Build clean. Verified via simulated webhook + cron on a production build.
- Next: Praveen signs up for LoopMessage ($59) → env vars + webhook (GO-LIVE §9) → real iPhone test.

---

## 2026-11-17 (18:15) · iMessage infra scoped
- LoopMessage $59 plan = messaging line only; full checklist (signup-by-text, webhook, commands, approval queue, daily cron, Supabase, email fallback, optional LLM) in `docs/BOARDY-STUDY.md`. Waiting on Praveen's signup + API credentials.

---

## 2026-11-17 (18:00) · Amazon API applications + iMessage costs
- Praveen will apply for Amazon Ads API + SP-API today; paste-ready answers and steps in `docs/AMAZON-API-APPLICATIONS.md`.
- iMessage provider costs researched (cheapest shared AI sender ~$20–39/mo; dedicated lines ~$100–289/mo). Channel decision pending.

---

## 2026-11-17 (17:45) · Boardy study
- Researched how Boardy grew (no app; phone/WhatsApp/email; every intro recruits a user; founder demos; free + $100/mo Pro). Written up in `docs/BOARDY-STUDY.md` with a plan: Boardy-style one-screen homepage + "Rocco texts you, reply to approve" now; text-only Rocco after Amazon API access. Awaiting Praveen's channel + API decisions.

---

## 2026-11-17 (11:30) · Moat + Rocco Daily
- Wrote `docs/MOAT.md`: moats = memory/proof loop, anonymized benchmarks, audience, personality. Praveen's daily-news idea → "Rocco Daily" (Leak Index from Rocco data + Amazon changes + leak of the day + one-minute fix + CTA). Flagged risk: Ads connector needs an approved Ads API app, so the no-setup upload lane must stay front and center.

---

## 2026-11-17 (17:15) · Launch kit + Supabase steps
- Praveen: found Dodo Live mode, set up TrustMRR, created a Supabase project.
- Built a launch kit: `/press` page (copy buttons + char counts for names, taglines ≤40/60/140, descriptions ≤260/500/long, tags, categories, pricing, maker comment, Show HN title/body, X bio; downloadable assets; directory checklist) from `content/launch-kit.json`, mirrored in `docs/LAUNCH-KIT.md`.
- Assets in `public/brand/`: transparent logos (240/512/1024), wordmark, 4 mascot poses, 4 screenshots (1280×800); `public/og.png` social image now set as OG/Twitter image; apple-icon added.
- `server.json` for the official MCP Registry (works.rocco/rocco → https://rocco.works/mcp).
- `supabase/setup.sql`: one paste creates memory tables + waitlist and lists them.
- Next for Praveen: run setup.sql, add SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY + DODO_API_KEY in Vercel, deploy, DNS A record, tracker check, then list on directories from /press.

---

## 2026-11-17 (16:30) · Single plan live + "max Rocco" audit
- **Pricing (approved):** one product "Rocco Founding Lifetime" (`pdt_0Ns7dcv01gDgTlIQC1O1b`, $99, license keys, unlimited brands, client reports). 4 old products archived. Ladder +$10/5 sales, cap $499: sales counted from Dodo API, price PATCHed automatically (page render + webhook `/api/dodo/webhook`), `/api/price`. Pricing page rebuilt (founder #, "goes to $X in N sales", public ladder, what you're buying); all old tier references removed (site, MCP paywall, estimator, roast, llms.txt, terms). Verified live against Dodo from the sandbox.
- **Audit vs. "max Rocco" (judgment + memory/proof + safety + time + agencies + benchmarks + autopilot):** closed the gaps:
  - Benchmarks: anonymized percentiles vs. other Rocco accounts (leak %, ACoS, conversion, TACoS), shown only with 10+ peer accounts.
  - Autopilot: read-only Claude Code cron (headless run can only use whitelisted read tools) + phone approvals note on /setup.
  - Proof that spreads: "Rocco saved me $X" wins card + X post on the dashboard (shown once there's a real win).
  - Homepage band shows live price + founder number.
- Already covered: judgment (playbook, rules), memory (change log, results, what's new), safety (approval codes, undo, ±20%), time (morning check, setup wizard), agencies (multi-brand, white-label reports).
- Still not built (post-contest): per-brand subscription, team seats, Amazon-API-backed autopilot that applies approved changes on a schedule.
- Tests 78. Build clean.
- **Praveen to do:** Vercel env `DODO_API_KEY`; Dodo webhook URL; KYC; Supabase; deploy + DNS; tracker check.

---

## 2026-11-17 (15:30) · Pricing model discussion
- Praveen proposed one lifetime plan with price rising every 5 sales. Claude agrees for the contest; proposal in `docs/PRICING-MODEL.md` ($99 start, +$10/5 sales, cap $499 → ~$49K at 180 sales). **Awaiting Praveen's OK before changing products/pricing.**

---

## 2026-11-17 (15:00) · One-stop setup for Amazon connectors
- Researched official connectors: Amazon Selling Partner (Seller Central) = https://sellingpartner-ai.amazon.com/mcp (Claude directory, by Amazon, beta, approve every action). Amazon Ads MCP = https://advertising-ai.amazon.com/mcp (EU: advertising-ai-eu, FE: advertising-ai-fe), open beta, needs an approved Ads API app via Login with Amazon (multiple sources; not yet tested in a real account).
- Built `/setup` wizard (app × region → URLs, copy buttons, Claude Code commands, .mcp.json, Cursor config, `/morning-check` command, one-click personal Rocco), `lib/connectors.ts` (+ tests), MCP `setup_check` tool, instructions telling the AI to guide setup when Amazon tools are missing. Nav CTA → "Set up in 3 min". Mobile overflow fixed. 67 tests.
- Plan differences explained to Praveen; flagged that plan limits (brands, agency-only reports) aren't enforced yet and that Holiday Pass ($99) vs Seller lifetime ($149) is a weak spread (his call).
- Dodo: products confirmed in Live mode (dashboard likely in Test mode); KYC review ~72h; add support email.

---

## 2026-11-17 (14:15) · Hackathon tracker installed
- Added the Ship or Die verify.js script (site f9fac6ee…) to `<head>` on every page; verified on the production build. After deploy, press "Check installation" in the dashboard before any traffic.

---

## 2026-11-17 (14:00) · Dodo products created
- Praveen saved a Dodo API key in the secure credential form. Claude created 4 one-time products via the Dodo API (Holiday $99 with 75-day license keys, Seller $149, Pro $299, Agency $399, all with license keys, tax category SaaS) and set their IDs as live defaults in `lib/payments.ts`. Pricing buttons are live once deployed. Live license check verified (`valid:false` for a fake key).
- Left: Dodo KYC/payouts, one real purchase + refund to test the license email, TrustMRR connection.

---

## 2026-11-17 (13:30) · Dodo payments + connector-first Rocco + pro hooks
- **Payments → Dodo** (Polar/Stripe don't onboard individuals in India). `lib/payments.ts`: static payment links per plan from `DODO_PRODUCT_*` env (pdt_ IDs), license check via Dodo's public `/licenses/validate`; Polar code removed; `docs/DODO-SETUP.md`. TrustMRR verifies Dodo revenue (rule 5 OK). Waiting on Praveen's 4 product IDs.
- **No more "download a spreadsheet"** (Praveen: pros don't). Rocco is now connector-first: the seller connects Amazon's official Ads connector (+ SP-API / other Amazon tools) next to Rocco and just asks. New `rocco_plan(job)` tool tells the AI exactly which Ads API v3 / SP-API reports and columns to pull; `analyze_report` takes connector JSON (`report_json`/`rows`), flattens nested SP-API JSON, understands camelCase API fields (campaignName, sales7d, purchases7d, campaignBudgetAmount, placementClassification…). Amazon IDs flow into proposals; `export_changes(format: "amazon_ads_api")` returns the exact change list for Amazon's connector to apply after approval (free for the top 3 per report). Exported files remain a fallback.
- **Pro hooks:** placement analyzer (P codes: raise profitable Top/Rest/Product pages, zero losers); "new since last report" (new money-burning terms, new winners, burners that stopped); `listing_gaps` (converting search-term words missing from title/bullets/backend); calendar feed `/w/<key>/calendar.ics` (follow-ups, Monday brief, BFCM dates); white-label printable client report `/w/<key>/report?brand=&by=`; web **Account Check** (`/tools/account-check`: drop up to 6 reports → Rocco Score, $ at stake, top actions).
- Site copy rewritten: hero = connect Amazon's Ads connector + Rocco → "Rocco, morning check"; jobs shown as things you say; chat demo shows Rocco orchestrating Amazon Ads + Seller Central connectors and applying approved changes; /connect has "Where Rocco gets data" instead of a download table.
- Tests: 64 passing (incl. Ads API + SP-API shaped JSON). Build clean. Browser + MCP flow verified.
- Blockers: Dodo product IDs + KYC; Supabase migration (memory); Vercel deploy + DNS A record; tracker.
- Numbers: revenue $0 · marketing cost $0.

---

## 2026-11-17 (09:55) · Payments blocker
- Polar's Stripe payout onboarding blocks Indian *individuals* from international payments (Stripe India rule). Options: Dodo Payments (individuals OK, TrustMRR-supported) now; Udyam registration → sole proprietorship as backup. Details in `docs/POLAR-SETUP.md`.

---

## 2026-11-17 (10:30) · Rocco becomes a daily AI teammate (MCP-first)
- Praveen's direction: position Rocco as a new AI who does most of the Amazon work; lead the site with the connector so a seller can add it to Claude/ChatGPT and try it immediately; Rocco tracks past actions and suggests new ones.
- **New analyzers** (auto-detected by header row, fixtures + tests): SP campaign report → budget shift (capped profitable winners +25%, losers above breakeven −20%); Business Report → traffic-but-no-conversion ASINs, buy box < 90%, TACoS (uses last ads snapshot); Restock Inventory → stockout guard (≤14 days), no-raise (≤21), overstock, dead stock; bulk file → structure audit (auto w/o negatives, duplicate keywords across campaigns, bid outliers, huge ad groups).
- **Memory** (`lib/store`, `lib/workspace.ts`, `supabase/migrations/001_rocco_memory.sql`): personal workspaces keyed by a secret token; every analysis saves a snapshot + coded proposals (N/H/B/G/S/F); approved codes become logged changes with before-metrics, undo steps and a follow-up date; newer reports automatically judge them (worked / no effect / worse / not enough data) incl. measured savings; per-brand settings (target/breakeven ACoS, click threshold, protected brand terms never negated).
- **MCP v2:** personal connector `rocco.works/mcp/<key>` with tools rocco_brief, analyze_report, apply_changes, list_changes, revert_changes, set_brand_settings, export_changes (fix list + Bulksheets rows with real IDs, incl. budgets), activate_license, workspace_link; shared `/mcp` keeps no-memory tools + create_workspace. Free = top 3 fixes per report (shown, tracked, briefed); license = everything + exports.
- **Site:** homepage now leads with the connector: "Meet Rocco, your new AI Amazon teammate", copy-URL box with Claude/ChatGPT steps and one-click personal workspace, a self-playing chat demo, 8 daily jobs, a live Playground calling the real `/mcp` on sample reports (or your own file), the memory loop, guardrails. `/connect` = full guide (tools in plain English, where to download each report). `/w/<key>` dashboard: trends, open fixes, change log with results.
- Tests: 55 passing. Build clean. Browser flow verified (playground, workspace creation, MCP apply, dashboard); no mobile horizontal scroll.
- **Blocker for memory in production:** Supabase project + migration + 2 env vars (see `docs/GO-LIVE.md` §4).
- Next: deploy; real-world report variants (Sponsored Brands/Display, EU marketplaces); MCP directory listings; OG images; BFCM Post-Mortem.
- Numbers: revenue $0 · marketing cost $0.

---

## 2026-11-17 (08:15) · DNS
- Praveen shared GoDaddy DNS: www CNAME to Vercel already set. Only change left: apex `A @` from Parked → 76.76.21.21 (or Vercel's shown IP); forwarding off. Email DNS (MX/SPF/DKIM) later with the mailbox. Logged in `docs/GO-LIVE.md`.

---

## 2026-11-17 (08:00) · Polar checkout live
- Praveen gave the org ID and saved a Polar token in the secure credential form (never in chat). Claude, via the API: verified 4 one-time products and prices; created 2 License Key benefits (lifetime `ROCCO-…`, Holiday Pass `ROCCOHP-…`) and attached them (the products had none, so buyers would have got no key); created 4 checkout links with success URL `/thanks`.
- Code: checkout links + org ID as defaults; Holiday Pass keys rejected after Jan 31, 2027 (by benefit ID); new `/thanks` page; 5 license tests (41 total passing).
- Next for Praveen: payouts, a test purchase with a 100% code, TrustMRR connection, Vercel deploy + tracker.

---

## 2026-11-17 (07:30) · Mascot, cooler site, aha moments, MCP connector, surge plan, 10 guides
- **Rocco mascot v2** (`components/Rocco.tsx`): original flat-cartoon raccoon in a green hoodie, 4 poses (hero/magnifier, judge, party/coins, wave), pure SVG. New favicon. Public "Meet Rocco" page `/rocco`.
- **Site redesign:** Bricolage Grotesque + Inter, sticky glass header, animated hero (bobbing Rocco, typing roast bubble, live Black Friday countdown), CTA band, quote wall, dark mode.
- **Aha moments:** (1) homepage Leak Estimator: slide spend + waste % → $/year, $/day, "Rocco Pro pays for itself in N days"; (2) self-playing Live Roast Demo stamping CUT/HARVEST/BID DOWN on search terms while the leak counter climbs; (3) roast result: grade stamp, count-up yearly leak, payback days, ACoS now → after bars (sample: 30% → 21%), "Rocco ate these" chips.
- **Brain MCP v1** at `/mcp` (Streamable HTTP, stateless, no auth): `roast_ads_report` (free summary; full fixes with license key), `amazon_ads_playbook` (judgment rules + how to work beside Amazon's Ads MCP), `bfcm_surge_plan`, `breakeven_acos`, `coupon_profit`. Tested with JSON-RPC calls. Setup page `/connect`.
- **BFCM Surge Plan** tool (`/tools/bfcm-surge-plan`): Nov 19 – Dec 2 budget/bid/placement schedule, careful/normal/bold, CSV download, rules.
- **10 SEO/AEO guides** at `/guides/*` with Article + FAQ JSON-LD, inline tool CTAs; in sitemap and llms.txt.
- **Day-1 X posts:** `docs/X-DAY1.md` (15 Rocco + 5 Praveen + reply hooks, UTM'd).
- Tests: 36 passing. Build clean (31 pages). Browser check: no console errors, no horizontal scroll on mobile.
- **Waiting on Praveen:** Polar org ID + 4 checkout links (products with License Keys benefit), then Vercel deploy + tracker (see `docs/GO-LIVE.md`).
- Next (Claude): deploy support once Vercel is connected; OG share images; BFCM Post-Mortem tool (needed by Nov 30); list Rocco on MCP directories (official registry, Smithery, Glama, mcp.so) after deploy.
- Numbers: revenue $0 · marketing cost $0.

---

## 2026-11-17 (05:30) · EXECUTION START: rocco.works v1 built
- Praveen bought **rocco.works**. Built the site + first tools (Next.js 16, TypeScript). Build passes, 25 unit tests pass, browser end-to-end check passes (sample + real upload, mobile has no horizontal scroll, no console errors).
- **Shipped (code):**
  - **Ad Roast** (`/tools/ad-roast`): upload SP search term report (.xlsx/.csv) → Leak Score A–F, $/month leaking, top 3 leaks in Rocco's voice, best term, share card PNG + X/LinkedIn share. Locked: every negative, harvest and bid fix, fix-list CSV, and an upload-ready Bulksheets 2.0 file (needs the seller's bulk export for IDs). Runs 100% in the browser.
  - Rules engine `lib/rules/` (negatives, junk-intent, harvest, bid formula ±20% cap, leak math, coupon math, breakeven ACoS) + parsers `lib/parsers/` (search term report with header detection, bulk export) + fixtures.
  - **Coupon Profit Calculator** and **Breakeven ACoS Calculator** (free SEO bait).
  - Landing page, tools index, pricing (Holiday $99 / Seller $149 / Pro $299 / Agency $399, price steps Nov 27 / Dec 1 / Dec 16), privacy, terms, refunds (7-day draft), waitlist API (Supabase), license unlock API (Polar), sitemap, robots, llms.txt, JSON-LD + FAQ on every tool page, tracker slot.
- **Praveen to do (blocking launch):** see `docs/GO-LIVE.md` — Vercel deploy + DNS, Polar products + license keys, Supabase table, TrustMRR tracker snippet, human@rocco.works inbox, X @roccoworks. Approve: 7-day refund policy, postal address for emails.
- **Next (Claude):** Brain MCP v1 (roast + fixes tools for Claude/ChatGPT), BFCM Surge Plan, first 10 SEO/AEO pages, Day-1 X posts from the hook bank, anonymized Leak Index counter.
- Known limits: paywall is client-side (fine for v1, sellers won't dig into JS); no .xls support; Sponsored Brands/Display reports not parsed yet.
- Numbers: revenue $0 · marketing cost $0 (domain is not a marketing cost).

---

## 2026-11-17 (05:05) · Polar setup guide
- Wrote `docs/POLAR-SETUP.md`: 4 one-time products (Holiday Pass $99, Seller $149, Pro $299, Agency $399), sandbox test, India payouts via Stripe Connect Express, checkout links, discounts, webhook, TrustMRR.

---

## 2026-11-17 (04:20) · Domain options
- raccly.ai (expensive, 2-yr), rackyy.com (cheap but spelling/slang issues), **rocco.works recommended** (keeps Rocco, built-in tagline). Waiting on purchase.

---

## 2026-11-17 (04:10) · Rocco domains taken
- All askrocco/heyrocco/etc. taken. Added a new shortlist (raccoon renamed, otter, owl, coined brands) to `docs/LAUNCH-SETUP.md` §1b for a bulk checker. Chrome extension not connected, so Praveen checks.

---

## 2026-11-17 (04:05) · Mascot approved, launch setup planned
- Praveen approved raccoon "Rocco" and planning email + leads. Wrote `docs/LAUNCH-SETUP.md`: domain shortlist (askrocco.com first), Smartlead + pre-warmed mailboxes (~$200 first month), SmartScout + Apollo for leads (skip scraped Amazon lists), CAN-SPAM rules.
- Blocker: Claude can't check domain availability from the workspace; Praveen to check on a registrar (or open Chrome so Claude can).

---

## 2026-11-17 (03:50) · Plan v2 rewritten
- `docs/AMAZON-BRAIN-PLAN.md` rewritten: $50K math (~220 sales, ~5,500 roasts, ~55K visitors), two lanes vs Amazon's Ads MCP (needs API credentials), raccoon mascot "Rocco", tool shelf, 12 distribution engines (SEO/AEO content engine, Roast Wall, free Claude skill, directories, white-label, affiliates…), X vs LinkedIn, cold email plan, Claude/Grok/Praveen roles, hook-testing loop, calendar.
- Waiting on Praveen: approve mascot/name, approve buying email domains + lead list.

---

## 2026-11-17 (03:40) · Urgency engine + channel playbooks
- Added section 10 to `docs/AMAZON-BRAIN-PLAN.md`: real BFCM calendar (BF week Nov 19–30, post-mortem Dec 1–3), 7-tool shelf (free lead magnet + paid unlock each), $99 Holiday Pass, price steps on Nov 27 / Dec 1 / Dec 16, separate X and LinkedIn playbooks, SEO/AEO.
- Guardrails: tools generate plans/bulk sheets, we never set up inside seller accounts (no services); only real profiles (no sock puppets).

---

## 2026-11-17 (03:30) · DECISION: build Amazon Brain MCP + mascot
- Wrote `docs/AMAZON-BRAIN-PLAN.md`: 70 sales × ~$220 = $15K → ~1,750 free roasts → ~17,500 visitors (~700/day). Buyer #1 = Amazon freelancers/VAs/small agencies. Viral loop = "Roast my Amazon account" shareable cards. Founding lifetime $149/$299/$399.
- Next: pick mascot + name + domain, set up Polar/Razorpay/TrustMRR, landing page.

---

## 2026-11-17 (02:55) · Praveen's notes added to idea bank
- Added P (Builder Pulse widgets, refined; AI-limit trackers crowded, open angle = phone widget + live profit + attention alerts, ~3%), Q (1,000 personal apps), R (Living story → Inkstreak feature), S (₹3,000 cohort: not eligible) and the book "Puer Who Got Enlightened" (personal, not eligible).

---

## 2026-11-17 (02:45) · Homebuyer Case Builder killed for the contest
- Wrote `docs/KILL-MEMO-HOMEBUYER.md`. Only ~1,500–2,000 RERA complaints filed per month nationwide; $15K needs ~250 buyers = 12–15% of all filers. Lawyers win on trust. Killed for the contest (OK as a slow side business).
- Pay-once tools were assessed earlier (ideas N and O in `100k-hackathon-ideas.md`, 1–2% odds). Sharp version = pay-once alternative to one specific hated subscription.

---

## 2026-11-17 (02:40) · Higgsfield idea
- Wrote `docs/HIGGSFIELD.md`. Kill a Higgsfield wrapper product (Higgsfield's own Ads 2.0 / UGC Factory cover it; $1B ARR). Keep Higgsfield as our AI-UGC ad engine for whatever we sell.

---

## 2026-11-17 (02:35) · Kill memo: "TrustMRR but for ads"
- Wrote `docs/KILL-MEMO-ADS-TRUSTMRR.md`. Killed: Meta Ad Library API has no commercial ads outside EU/UK and no spend/results data; ad-spy tools crowded; verified-results leaderboards exist; cold start.
- Parked mutation: verified "ad spend managed" profiles for media buyers (3–4% / <1%).

---

## 2026-11-17 (02:45) · Jobs-to-automate scan
- Wrote `docs/JOBS-TO-AUTOMATE.md`: 2026 job-market data, 8 automatable roles scored on reach / convert / market / competition.
- Result: the most automatable roles (receptionist, telecaller, support, SDR) are red oceans of "AI employee" startups. Useful idea: job posts as buying signals + a free "Hire or AI?" job-description tool (5–7% / 1%).
- Confirms the consumer "AI paralegal" lane (RERA Homebuyer Case Builder) as best fit. **Awaiting Praveen's choice.**

---

## 2026-11-17 (02:30) · Back to drawing board: high-ticket real problems (≤$400)
- Wrote `docs/HIGH-TICKET-SCAN.md`. Crowded: US EB-2 NIW DIY tools, India GST/IT notice reply AI, US insurance-denial appeals (free tools).
- Open-ish: **Homebuyer Case Builder** (India RERA / Consumer Commission self-filing; ₹4,999–9,999 + ₹39,999–49,999 association plan; 10% / 2%). Runner-up: Insurance Ombudsman "Claim Fighter".
- Status: **awaiting Praveen's reaction.**

---

## 2026-11-17 (02:25) · Ad budget is only ₹10–20K
- Constraint: ₹10–20K to start, recycle if profitable. Logged in `docs/MY-PICK.md`.
- Consequence: US paid ads can't be the main engine; organic reels must drive sales; ads only boost proven posts in India.
- Best fit: **Shaadi Party Kit** and **desi personalized songs** (one shared song + video engine). Honest expectation: ₹2–5 lakh is a good outcome; contest-winning needs an organic hit.

---

## 2026-11-17 (02:20) · Ad Library check: "custom song" 12K ads, "song gift" 19K ads
- Interpretation logged in `docs/SONG-GIFT-COMPETITORS.md`: counts are inflated by keyword matching but confirm a busy, expensive auction. Generic entry = too crowded; test only a niche.
- Proposed niche: **Indian diaspora (US/UK/CA/AU) Bollywood/Punjabi personalized song gifts** in USD.
- Next: Praveen checks US ads for Hindi/Bollywood/Punjabi custom-song advertisers.

---

## 2026-11-17 (02:15) · Song gift competitors to check in ad libraries
- Wrote `docs/SONG-GIFT-COMPETITORS.md`: ~25 AI song-gift brands (Songoven, ForeverSongs, TunedForYou, GiftSong, SongGifty, Songilingy, Popgift, Cantoro, etc.), human benchmarks (Songfinch, Songlorious), India players, and how to check ads (Meta Ad Library, TikTok Creative Center, Google Ads Transparency) plus what to note.
- Next: Praveen reviews running ads, then decides go / no-go.

---

## 2026-11-17 (02:10) · No Amazon network → consumer + paid ads
- Praveen: no real Amazon network, so warm B2B is out; he has Meta consumer-ads experience and is split between viral consumer and SaaS.
- Key insight logged in `docs/MY-PICK.md`: because AI costs don't count toward contest profit, **any ROAS above ~1.1 adds contest profit**, so he can outbid established competitors in a proven ad-driven category.
- New pick: **personalized AI song gift for Christmas (USD, Polar)** scaled with Meta ads; backup **Shaadi Party Kit** with Meta "newly engaged" targeting. X ads not recommended.
- Status: **awaiting Praveen's go-ahead.**

---

## 2026-11-17 (02:05) · "If you had to win, what would you build?"
- Claude's pick, written in `docs/MY-PICK.md`: a single Amazon ad-waste + Sponsored Prompts audit tool, sold as capped Founding Lifetime seats ($299 / $799) to Praveen's warm network + LinkedIn + agencies. Reason: profit beats virality; ~50 high-ticket buyers is more reachable than ~3,000 consumer purchases; uses his only real unfair advantage.
- Decision test for Praveen: list Amazon contacts who'd reply personally. **30+ → this; under 15 → Shaadi Party Kit.**
- Status: **awaiting Praveen's decision.**

---

## 2026-11-17 (02:00) · Kill all → explosive new ideas
- Praveen asked to kill all previous ideas and find new viral, contest-winning ones. Wrote `docs/EXPLOSIVE-IDEAS.md`.
- Finding: every tested "explosive" concept already exists (pixel walls, king-of-the-hill billboards, AI wedding songs, wedding quiz games, AI office-party game shows). **The hackathon already has an official leaderboard** (3,492 builders at launch).
- Two plays proposed: **A. Shaadi Party Kit** (live sangeet game + personalized song + invite/thank-you video, ₹2,999–4,999; 12% / 3%) and **B. Hackathon Launchpad + Throne** (entrant directory + paid boosts + escalating top spot; 9% / 2%).
- Status: **awaiting Praveen's pick. No build yet.**

---

## 2026-11-17 (01:40) · How many weddings until Dec 16?
- Added a market timing section to `docs/KILL-MEMO-TREND-STUDIO.md`. 2026 window has only ~11 muhurat dates (Nov 21, 24, 25, 26 + 7 in Dec, last Dec 12; none Dec 13–Jan 14). Estimate ≈ 30–35 lakh weddings (my estimate from CAIT 2023–24 per-date ratios; no 2026 CAIT figure found).
- Key insight: invites for this window are mostly already sent; sell sangeet/countdown/thank-you videos now, and **save-the-dates/invites for the Jan–Mar 2027 season, which get made in December**.

---

## 2026-11-17 (01:35) · Kill + fix: Desi AI Trend Studio
- Wrote `docs/KILL-MEMO-TREND-STUDIO.md`. 8 kill points: the trends are free in Gemini; video API cost; India's Feb 2026 deepfake/SGI rules (labels, metadata, 2–3h takedowns); trends die in days; low ticket needs ~500 paid videos/day; payment friction; watermarks get cropped; model policies on real faces.
- Fix: **AI Shaadi & Occasion Studio**: consent-based occasion videos (weddings, birthdays, anniversaries, New Year), Shaadi packs ₹1,999–4,999, free tier image-only, mandatory AI labels + metadata, and the wedding-invite forwarding loop (hundreds of guests per invite).
- Updated `docs/ODDS-RANKING.md`: fixed version 12% / 3%; original killed (~5%).
- Status: **awaiting Praveen's pick.**

---

## 2026-11-17 (01:25) · All ideas ranked by honest odds
- Wrote `docs/ODDS-RANKING.md`: 17 eligible ideas ranked by P($15K+) and P(#1). Top: (1) Desi AI Trend Studio 10% / 3%, (2) Amazon "small & warm" lifetime seats 10% / 1.5%, (3) AI Shelf 7% / 1.5%.
- Key message: no idea beats ~1 in 10 for $15K; distribution matters most; decide today and ship something payable within 72 hours.
- Status: **awaiting Praveen's pick.**

---

## 2026-11-17 (01:20) · "Phone app audit → pay-once alternatives" idea
- Praveen asked: check all apps on your phone and suggest freer / one-time-fee alternatives. Added as idea **O** in `100k-hackathon-ideas.md`. Already partly built by AI subscription trackers (Subscription Track AI, Trap Scanner, Rocket Money, Bobby, Finny); low-ticket; iOS/Android can't read installed apps (screenshots needed). Possible India/UPI-AutoPay + viral savings-card angle.
- Status unchanged: **no build decision yet.**

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
