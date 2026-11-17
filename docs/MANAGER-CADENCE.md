# What a senior Amazon manager does, and what Rocco covers

Purpose: list every recurring job a $100K/yr Amazon manager (or agency account lead) does, mark what Rocco's MCP already does, and rank what to build next. "Data" = where the numbers come from today: **Ads** (Amazon Ads connector or exported report), **SC** (Amazon Selling Partner connector / Seller Central reports), **Both**.

Status: ✅ built · 🟡 partly · ⬜ not yet (build order in brackets)

## Daily (10–20 min per brand)

| Job | Data | Rocco |
|---|---|---|
| Cut search terms that spend with no sales (negatives) | Ads | ✅ N-codes |
| Promote converting search terms to exact (harvest) | Ads | ✅ H-codes |
| Bid up winners / down losers vs target ACoS (±20% cap) | Ads | ✅ B-codes |
| Campaigns out of budget before evening | Ads | ✅ G-codes |
| Spend / sales / ACoS vs target, yesterday vs trend | Ads | ✅ morning numbers |
| Stock that runs out in <14 days; restock qty | SC | ✅ S-codes |
| Total sales, sessions, conversion, TACoS | SC | ✅ |
| Lost Buy Box / suppressed or inactive listings | SC | ✅ 🚨 alerts |
| Account health and policy warnings | SC | ⬜ [2] |
| Price changed (yours or competitor-triggered) | SC | ⬜ [6] |
| New 1–3★ reviews / rating drop | SC | ⬜ [7] |

## Weekly (1–2 h per brand)

| Job | Data | Rocco |
|---|---|---|
| Did last week's changes work? (grade each) | Both | ✅ result checks |
| Placement modifiers (top of search vs product pages) | Ads | ✅ P-codes |
| Campaign structure hygiene (duplicates, match types) | Ads | ✅ F-codes |
| Listing words vs converting search terms | Both | ✅ listing_gaps |
| What's new since last check (new burners, new winners) | Ads | ✅ term diff |
| Weekly client/stakeholder update | Both | 🟡 PDF report; ⬜ weekly auto-summary text/Slack [3] |
| Conversion by ASIN, best/worst movers | SC | ⬜ [4] |
| Inbound shipments stuck or delayed | SC | ⬜ [8] |
| Coupons / deals / Lightning performance | Both | ⬜ [9] |
| Search rank / share of voice for hero keywords | Ads (SQP) | ⬜ [10] |

## Monthly / quarterly

| Job | Data | Rocco |
|---|---|---|
| P&L by ASIN (fees, storage, refunds, ad spend) | SC + Ads | ⬜ [5] |
| FBA reimbursements (lost/damaged inventory) | SC | ⬜ [11] |
| Aged inventory, storage fees, IPI | SC | ⬜ [12] |
| Brand Analytics: Search Query Performance, market basket | SC | ⬜ [10] |
| Seasonal plan (Prime Day, BFCM, Q4 cutoffs) | — | 🟡 season reminders |
| Budget plan next month vs seasonality | Ads | ⬜ [13] |
| Monthly client report / QBR | Both | 🟡 PDF report |
| Benchmarks vs similar sellers | Both | ✅ (10+ peers) |

## Build next (why this order)
1. **Buy Box / suppressed listings** and 2. **account health**: daily "is anything on fire" checks, high fear, easy to text ("🚨 2 listings suppressed").
3. **Weekly summary** to text and Slack: managers forward it to bosses/clients, so Rocco spreads.
4. **ASIN movers** and 5. **P&L by ASIN**: what owners care about most; turns Rocco from "ads tool" into "runs the account".

Each one = a `rocco_plan` recipe (what to pull from Amazon's connector) + an analyzer in `lib/` + a line in the morning text.

## Execution: who presses the button
- Today: the team's AI (Claude/ChatGPT with Amazon's connectors) pulls data and applies approved changes. Rocco (MCP) decides, remembers and checks. The dashboard and texts **show and collect approvals**; they can't touch Amazon on their own.
- After Amazon API approval (Ads API + SP-API): Rocco's server pulls nightly and applies approved codes itself, so the dashboard, texts and Slack can execute directly.
- Follow-ups: calendar (.ics, live), iMessage (live), Slack (to build: one incoming-webhook URL per workspace).
