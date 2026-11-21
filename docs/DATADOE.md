# DataDoe as Rocco's Amazon data + action layer (assessed Nov 21, 2026)

Source: DataDoe Hub docs (invitation-links, external-invitation-links, how-to-connect, sellers-and-vendors, subscription-pricing, data-sources, data-fetch-periods, actions/introduction) and api.datadoe.com/api/v1/spec/datadoe_api.md.

## Verdict: yes, it fits, and it solves Rocco's biggest gap
DataDoe is an approved Amazon SP-API + Ads API developer. One DataDoe Organization (ours) can connect unlimited Seller Central / Vendor Central / Amazon Ads accounts through invitation links, read their data through a REST API, and make changes (bids, budgets, negatives, listings) through write "Actions". That gives Rocco, in any marketplace (India included), without Claude and without our own Amazon API approval:
1. One-click connect: Rocco creates an invite link → seller signs in to Amazon → Seller Central (+ optional Ads) lands in our org → callback tells Rocco which account.
2. Daily data: exports of ads search terms, campaigns, sales & traffic, inventory → Rocco's engine → morning text with fixes.
3. Approved changes applied by Rocco itself: write Actions with a free dry run first, auditable; only on accounts invited with read-and-write access.

## How it works (from the docs)
- Invite: `POST /api/v1/util/sellers-and-vendors/invite` `{ name, tenantType: "SELLER", accessLevel: "READ_ONLY" | read-write, redirectUrl: https }` → `{ id, invitationUrl, expiresAt }`. Single use, 7 days. Seller picks marketplace, authorizes Seller Central, Ads optional. Redirect back with `success, error, sellerOrVendorId, sellerOrVendorMarketplaceCountryCode, invitationId`. Status also readable via `GET .../invitations/{id}`. Reconnect links when `needsReauthorization`.
- Auth: header `datadoe-api-key`. Base `https://api.datadoe.com/api/v1`. Rate limit 3 req/s per org (429 + Retry-After).
- Data: async Exports (create → poll ~5s → download CSV/JSON; up to 5M rows). Sources found via `GET /api/v1/exports/sources`. Daily fetch at 2am seller-local, 95% ready by 5am; ads performance also refetched 8am/1pm/4pm; Recurring Exports (schedules) exist.
- Actions: `POST /api/v1/actions`, `dryRun: true` validates for free; write Actions need the account's access level "Read and write". Ads changes apply in real time.

## Costs (their pricing page)
- $97/month Base plan after a 14-day trial; unlimited connections; 1 seat; 10M stored data rows; 2,000 AI Tokens/month (4,000 for the first 3 months).
- Exports cost 2 tokens (standard table), write Action 3 tokens per ≤100 items, BigQuery query 0.2, dry runs free.
- Watch-outs: a typical seller uses 0.5M–10M data rows/month → +$49 per extra 10M rows. Turn off tables Rocco doesn't need and set 6-month retention. ~4 exports/day/account ≈ 240 tokens/month/account → the included tokens cover ~8 accounts (~16 in the first 3 months); beyond that ~$9/account/month in token bundles.
- Contest: software costs are not deducted from hackathon profit (hard rule 3), but they are real money for Praveen. Ask before subscribing.

## Risks / open questions
- Terms: confirm with DataDoe (contact@datadoe.com) that powering a self-serve product for third-party sellers is allowed on the Base plan. White label is a paid add-on (invites show DataDoe branding without it).
- Dependency: if DataDoe changes pricing or shuts the API, Rocco loses this data path. Keep the Claude and report-inbox paths.
- Export column names differ from Amazon's report headers → Rocco needs a small adapter per export source.
- Hard rules stay: official APIs only (DataDoe uses SP-API/Ads API), every write needs the seller's explicit approval, is logged, and is reversible.
