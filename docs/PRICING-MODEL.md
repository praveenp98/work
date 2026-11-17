# Pricing model discussion (Nov 17, 2026) — PROPOSAL, awaiting Praveen's OK

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
