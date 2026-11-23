# One-tap restock (FBA shipment plans)

Built Nov 23. Code: `lib/restock.ts`, `app/api/w/restock/route.ts`, `components/dash/RestockPanel.tsx`. Tests: `lib/restock.test.ts`.
Source: DataDoe Actions docs (hub/docs/datadoe-actions/fba-inbound, types/fba-inbound, fba-eligibility) read Nov 23.

## What the seller sees
The restock job ("Restock 2 products before they run out") lists each product with an editable quantity (pre-filled for ~60 days of sales,
minus stock on hand and already inbound). First time only: ship-from address + who labels / preps. One tap: **Create shipment plan · N units**.
Rocco creates the plan in Amazon ("Rocco restock Nov 23"), then: **Finish in Send to Amazon →** (boxes, weights, carrier, labels) or **Cancel plan**.

## Why not the whole shipment in one tap
Amazon's inbound flow is 6–10 steps (DataDoe: 50 FBA inbound Actions). After the plan, every step needs physical facts only the seller has
(carton contents, dimensions, weights, pickup, appointments) or commits money (packing/placement fees, carrier). DataDoe's own guidance: ask
the seller before each cost commitment. So Rocco does the part that's pure data (what to send, how many) and hands off at the first physical step.
Creating a plan is free on Amazon's side and cancellable until a shipment is confirmed.

Phase 2 (later, if sellers ask): compare placement splits + fees and carrier quotes inside Rocco, one tap each, then labels PDF.

## Praveen: enable in DataDoe (once)
1. DataDoe → **Settings → Actions** (app.datadoe.com/settings?tab=actions): enable
   `AMAZON_FBA_INBOUND_PLANS_ADD`, `AMAZON_FBA_INBOUND_PLANS_GET`, `AMAZON_FBA_INBOUND_PLANS_FIND`, `AMAZON_FBA_INBOUND_PLANS_CANCEL`,
   `AMAZON_FBA_INBOUND_OPERATIONS_GET`, `AMAZON_FBA_INBOUND_PREP_DETAILS_FIND` (and `AMAZON_FBA_ELIGIBILITY_FIND` for later). New Action types start disabled.
2. The API key's user/service account must have access to these Action types and to each seller (Settings → keys / users).
3. Each seller account: access level **Read and write** (same as ads changes).
4. The account's Amazon authorization must include the **Amazon Fulfillment** role. If Amazon says role/authorization, reconnect that account.
5. Token spend: 0.3 AI Token per plan created, 0.1 per read. Negligible.
6. First live test: Habit Nest US, 1 SKU, small quantity → check the plan shows up in Seller Central → Send to Amazon → cancel it from Rocco.
   **Unverified until that test:** that an API-created plan can be finished in Send to Amazon (DataDoe warns some plans aren't editable there
   right away). If it isn't, phase 2 becomes necessary.

## Edge cases and what Rocco does
| Case | Handling |
|---|---|
| Double tap / retry | Idempotency key per SKU×qty set; plus a 7-day block on a second plan for the same SKU (finish or cancel the first). |
| Stock already inbound | Pulled daily (`inbound_quantity`) and subtracted. If inbound covers 60 days, no restock card, a "make sure it's on its way" note instead. |
| Quantity sanity | Whole numbers 1–10,000 per SKU, ≤200 SKUs, 0 skips a SKU. Seller edits before creating. |
| Missing prep details | Amazon rejects; Rocco says "add prep details in Seller Central" (prep check Action enabled for a pre-check later). |
| Expiry-dated SKUs | Need separate plans with dates (DataDoe doesn't split). Rocco tells them to create that one in Seller Central. |
| Hazmat / restricted / not FBA-eligible | Amazon rejects; plain-English message. |
| Amazon still processing (>~75s) | Saved as "pending" with the Action ID; "Check again" reads it. Never resubmitted automatically (could duplicate). |
| Uncertain outcome (`AMAZON_SUBMISSION_UNKNOWN`) | Treated as failed with the reason; Praveen checks with DataDoe's acknowledge flow if it ever happens (support case). |
| Cancel | `PLANS_CANCEL` only for plans Rocco created, before shipments are confirmed. After that: Seller Central (fees outside Amazon's void window: 24h SPD, 1h LTL). |
| Marketplaces | All Amazon marketplaces except Brazil (DataDoe can't create plans there). India: plan creation works; later steps follow India's flow in Seller Central. |
| Vendor / ads-only accounts | Not offered (Seller Central FBA only). |
| Kill switch | `ROCCO_WRITES_OFF=1` stops plan creation too (dry runs still work). |
| Safety limit | Counts against the daily "writes" limit. |
| Who did it | Plan record keeps who tapped (team member name) and shows it on the card. |
| Address privacy | Ship-from address stored on the team (Supabase), only sent to Amazon in the plan. |
