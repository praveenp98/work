# Pricing model (Nov 17, 2026) — APPROVED: one plan named **"Hire Rocco"** (renamed from Founding Lifetime), $99, +$10 every 5 sales, cap $499 — LIVE

## Praveen's idea
One plan, everything lifetime, price goes up every 5 sales.

## Claude's view: yes, for the contest
- One decision instead of four → higher conversion. Real, verifiable urgency ("price goes up in 3 sales"). Lifetime upfront counts fully toward contest profit. Early buyers feel rewarded.
- Gives up: agencies pay the same as solo sellers. Accept for 29 days; add per-brand subscription after Dec 16.

## Proposed ladder
"Rocco Founding Lifetime": everything, unlimited brands, client reports. Start $99, +$10 every 5 sales, cap $499.

| Sales | Last price | Revenue |
|---|---|---|
| 50 | $189 | ~$7.2K |
| 100 | $289 | ~$19.4K |
| 150 | $389 | ~$36.6K |
| 180 | $449 | ~$49.3K |
| 200 | $489 | ~$58.8K |
(minus ~5% Dodo fees). Current 4-tier plan needed ~220 sales for ~$52.8K.

## What people are buying (the pitch)
Not "analysis" (Claude + Amazon's connector can analyze). They buy:
1. A senior Amazon manager's judgment, consistently (thresholds, ±20% caps, protected terms).
2. Memory + proof: change log, measured results, savings.
3. Safety: approval codes, undo, guardrails before AI touches live ads.
4. Time: "morning check" replaces an hour of reports.
5. Agencies: white-label proof for clients.
Line: "Hire Rocco once. Your Amazon teammate who remembers everything, for life."

## Ceiling
Contest: $15–50K realistic, gated by distribution. Long term: the AI operating layer on top of Amazon's connectors (judgment + memory + cross-account benchmarks + approve-from-phone autopilot), sold per brand/month; agencies at scale. $1M+ ARR niche is plausible.

## Build needed if approved (~1 hour)
Dodo webhook (payment.succeeded) → count sales → update product price via Dodo API; live counter on pricing page + MCP paywall text; replace 4 products with 1 (archive others). Needs DODO_API_KEY + webhook secret in Vercel.


## Paywall timing (Nov 17, 2026)
Free forever: demo, setup, first numbers, the top 3 fixes per report, result checks. Rocco asks for money only at value moments (lib/paywall.ts), each throttled:
| Moment | When | Throttle |
|---|---|---|
| found | a check found money and some fixes are locked ("I found ~$1,240/mo; top 3 free; 4 more (~$890/mo) unlock when you hire me") | every 3 days max |
| worked | a proposed change was measured as working | once per win |
| locked | someone replies YES to a locked code | always |
| team | a second teammate joins | once |
Shown in: texts (pitch bubble + checkout link alone), morning text, Claude/ChatGPT (rocco_brief, analyze_report), dashboard (locked row with $ value). Urgency is real: "Goes to $109 after N more hires" from the live ladder.
Unlock: Rocco's checkout links carry metadata_ref = workspace id. The Dodo webhook fetches the payment from Dodo's API (body untrusted), and if it succeeded, unlocks that workspace and texts the team "You hired me 🎉". Pricing-page buyers text "activate <key>" or tell Rocco in Claude.


## Nov 18, 2026 change (approved by Praveen): yearly plan with a 3-day card trial, no free plan
- **Price:** $99/year for the whole team after a **3-day free trial** (card required, charged automatically on day 4). Dodo subscription product (DODO_PRODUCT_ID).
- **Ladder stays:** +$10 every 5 hires, cap $499, counting **only paid charges** = unique paying customers (trials and renewals don't move it). Legacy one-time buyers keep lifetime access and count as hires.
- **No free plan.** Without a trial/paid plan: the demo, setup steps, and a teaser total ("I found ~$X/mo across N fixes") with the trial link. Numbers, fixes, approvals, morning texts, Slack posts, analytics all need access.
- **Trial moments:** closable trial sheet after the setup steps (at "Now just ask"); trial banner + sheet on the dashboard when data exists; teaser after the first check (text/Slack/Claude); max 3 teaser texts, 2+ days apart.
- **Reminder:** ~1 day before the trial ends: "⏰ Your free trial ends tomorrow… Reply CANCEL." CANCEL text cancels the Dodo subscription.
- **Billing sync:** lib/billing.ts verifies every webhook with Dodo's API (subscription active → trial; payment succeeded → paid for a year; failed/expired/on_hold → access ends; cancelled → runs to period end).
- **To verify in Dodo test mode:** trial field + card collection, metadata_ref carried onto subscriptions, PATCH status=cancelled, and whether renewals keep the original price after the ladder raises the product price (don't promise a locked price until confirmed).
