# Real costs at 100 sellers (not hackathon profit)

Updated Nov 22, 2026 from DataDoe's pricing page + Hub docs (subscription-pricing, managing-data-tables, initial-loads) and MarketplaceAdPros' plans/agency/API pages. Estimates marked **(est.)**.

## How DataDoe really bills (checked)
- $97/mo base: unlimited Amazon accounts (no per-account fee), 10M stored rows, 2,000 AI tokens/mo (4,000 for the first 3 months), 1 seat.
- **Rows** = everything stored across all accounts. +$49 per extra 10M. On connect, DataDoe backfills **up to 2 years** and keeps data **forever** by default. That's what makes rows grow.
- **Tokens** are spent per operation, not per account: an export = **2 tokens at any size**, a write Action = 3 tokens for up to 100 items (+1 per extra 100), dry runs free. Extra tokens $0.04 each (opt-in) or bundles ~$0.036, valid 1 year.
- Every table has a `seller_or_vendor_id` column, so **one export can cover every account** and Rocco splits the rows.
- Controls (Settings → Data, organization-wide, **not in the API**): turn tables off; set retention per table to 6/12/18/24 months. 22 default tables can't be turned off. Habit Nest's org currently has 134 tables on.

## Revenue
$199 per seller for the first 3 months (= $66/mo), then $249 per 3 months (= $83/mo). 100 sellers = **$6,630/mo first quarter, $8,300/mo after**.

## Monthly costs at 100 sellers
| Item | Today's setup | After the fixes below |
|---|---|---|
| DataDoe base | $97 | $97 |
| DataDoe rows | $440–1,420 (2 yrs history, 134 tables, kept forever) | $100–350 (est.) (6-month retention, unused tables off) |
| DataDoe tokens, daily pulls | ~$800 (4 exports × each account × every day) | $0 (4 exports a day for all accounts, inside the 2,000 included) |
| DataDoe tokens, approved changes | ~$150 | ~$150 (less if approvals are batched) |
| Claude Opus 5.5 (daily manager + Ask) | ~$250 | ~$250 |
| Vercel Pro + Supabase + domain | ~$48 | ~$48 |
| Dodo fees (~4% + $0.40 per charge, verify) | ~$280–345 | ~$280–345 |
| **Total** | **~$2,100–3,100** | **~$930–1,240** |
| **Margin** | **53–68%** | **82–88%** |

Per seller after the fixes: about **$9–12/mo cost** against $66–83/mo revenue.

Up front before the first sale: ~$140 (Vercel Pro $20, DataDoe $97 after the trial, ~$25 Claude credits). Unpaid sign-ups cost $0 unless they start the free audit (below).

## Free read-only audit (Nov 25)
**One export set per audit.** An audit team connects one Amazon account and gets one pull: 4 report exports + 2 daily-numbers exports (180-day backfill) = 6 exports × 2 tokens = **12 tokens (~$0.45)**. A retry is allowed only after a failed pull, max 3 pulls total = **36 tokens (~$1.40) worst case**. No history read, no Claude calls, no daily pulls (cron skips audit teams). The bigger cost is **rows**: DataDoe backfills history for every connected account, so delete expired unpaid audit accounts in DataDoe weekly (docs/ROUTINE.md). Abuse cap: 3 audit starts per IP per day, one Amazon account per audit, one account can't sit in two Roccos. 100 audits ≈ 1,200 tokens (~$45, mostly inside the 2,000 included) plus their rows until deleted. Not a hackathon cost (AI/API/software isn't deducted), but it is real money.

## "Before Rocco" history read (built Nov 22)
Once per account at connect: 2 DataDoe exports (Amazon's change history + campaign names) = 4 tokens (~$0.15), plus one short Claude call over a rules-made summary (a few cents). At 100 sellers that's ~$15–25 **one time**, not monthly. Included in the plan, not an add-on.

## The fixes
1. **DataDoe settings (Praveen, ~10 min in Settings → Data). Exact 9-table keep list: docs/LIGHTS-ON.md step 5.** set every table to 6 months; turn off tables Rocco doesn't read (keep the defaults plus: ads search terms by campaign, targeting by campaign, placement by campaign, negative keywords, targets raw, campaigns raw, FBA restock recommendations, seller performance, **ads entity history** (the "Before Rocco" read)).
2. **One export per report per group of 10 accounts (built Nov 22, live-tested):** 40 exports/day at 100 sellers (~2,400 tokens/mo, ~$15 over the included 2,000), split by `seller_or_vendor_id`. Old per-account schedules are deleted automatically.
3. **Batch approvals (code, optional):** "Approve all" sends one Action per change type instead of one per fix.

## MarketplaceAdPros instead of DataDoe?
- AI Connect: $39/mo for 5 brands, +$10/mo per extra brand → 100 sellers ≈ **$990/mo**.
- Boost: $449/mo billed annually ($579 monthly), 100 brands; plus Partner Connect (client connect links back to your app + webhooks) $19/mo → **~$470–600/mo**.
- REST API limits: 100 requests/min, 10 exports/min, 30 writes/min per token. Full white-labeling is "in build", not available.
- Verdict: **not cheaper** than DataDoe after the fixes (~$350–600/mo all-in for DataDoe), it's a competitor (they sell daily AI recommendations with approve/reject), and switching means rebuilding the connection, pulls and writes. Stay on DataDoe.
