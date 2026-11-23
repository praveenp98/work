# Pricing (current, Nov 22, 2026)

**$119 a month, or $1,190 a year (2 months free).** Yearly is shown first and preselected. 7-day money-back guarantee on both. Whole team, unlimited brands, no free plan, pay at signup. Source of truth in code: `lib/pricing.ts`. Dodo setup: `docs/DODO-SETUP.md`.

**Price rise (Nov 22, Praveen):** every 5 hires, +$10 on monthly and +$100 on yearly (keeps 2 months free). Shown on the plan step and pricing page with hires left at today's price. Applied by hand: raise both Dodo products and `PLAN` in `lib/pricing.ts` together (next: $129/mo, $1,290/yr).

**Team:** the owner adds teammates by email from the dashboard (they sign in with Google), can remove them, hand the Rocco over, and reset the private link. Billing stays on the card that paid.

---

Older history below.

# Pricing model: CURRENT (Nov 19, 2026): quarterly, $199 first 3 months, then $249 every 3 months

- One plan, "Hire Rocco", whole team, unlimited brands. No free plan, no trial. No price ladder any more.
- Dodo: one subscription product at **$249 every 3 months** + discount code **$50 off the first cycle** (env `DODO_DISCOUNT_CODE`, added to checkout links as `discount_code=`; param name still to be verified with one live checkout).
- Contest math: profit counts payments made by Dec 16, so a new team is worth $199 (first quarter); renewals land after the contest. 50 teams = ~$9,950, 100 = ~$19,900, 250 = ~$49,750 (minus Dodo fees). Yearly upfront would book more per team; Praveen chose quarterly (Nov 19).
- Homepage no longer compares against a manager's salary: Amazon managers are buyers too.

---
(History below.)

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


## Nov 18, 2026 (later, approved by Praveen): no trial, +$10 with every hire, email before checkout
- **$99/year, paid up front** (no trial, no free plan). Dodo subscription product without a trial period.
- **Ladder: +$10 after every single hire** (was every 5), cap $499 (reached at hire #41). Counts paying customers only.
  | Hires | Last price | Revenue |
  |---|---|---|
  | 40 | $489 | $11,760 |
  | 100 | $499 | $41,700 |
  | 200 | $499 | $91,600 |
- **Flow (like localseo.to):** Hire Rocco → sheet asks work email (the account) → Dodo checkout prefilled + tagged with the team → /welcome → their Rocco page → setup. Email confirmation link comes when Resend is added; until then the Dodo receipt confirms it.
- Copy everywhere: "$99/year for your whole team · +$10 with every hire".

## Local prices (Dodo purchasing power parity), Nov 23
Dodo charges each buyer in their own currency at a PPP-adjusted price; the site's list price stays **$1,190/yr or $119/mo**.
- **Default (nothing to set):** visitors outside the US see "In India? Checkout shows your price in your own currency, often lower than USD." (country from Vercel's geo header). No mismatch possible because the site never claims a local number.
- **Exact local prices (optional, recommended for big markets):** copy the amounts Dodo shows for each country into the Vercel env var `LOCAL_PRICES`, e.g.
  `{"IN":{"currency":"INR","symbol":"₹","annual":39900,"monthly":3990}}` → the pricing page and plan picker show "₹39,900/year", "Continue · ₹39,900 a year", with "List price $1,190 / $119" underneath.
- **Drift alarm:** every payment is compared with `LOCAL_PRICES` (2% tolerance). A mismatch logs `[pricing] local price drift` in Vercel and sends a `price_mismatch` event to PostHog, so a stale entry is caught on the first sale. Fix: update the env var (or remove that country to fall back to the note).
- How to read Dodo's local price: open the checkout link from a browser/VPN in that country, or check the PPP table on each product in the Dodo dashboard. If Dodo's PPP is automatic (changes over time), prefer fixed per-currency prices in Dodo where possible, or only list your top 2-3 countries.
- The "prices go up" line is about the USD list price; local prices follow only when Praveen raises the Dodo product price.
- Contest: TrustMRR counts revenue at what Dodo actually charged, so PPP sales count at their lower value.
