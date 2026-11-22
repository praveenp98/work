# Real costs at 100 sellers (not hackathon profit)

Written Nov 22, 2026. Estimates are marked **(est.)**; check the unverified ones before relying on them.

## Revenue
| | Per seller | 100 sellers |
|---|---|---|
| First quarter | $199 | $19,900 |
| Each quarter after | $249 | $24,900 |
| Per month (first / after) | $66 / $83 | $6,630 / $8,300 |

## Paid once before the first customer
| Item | Cost |
|---|---|
| Domain rocco.works | already paid (~$30/yr renewal) |
| Vercel Pro (Hobby is non-commercial and caps functions at 60s; the pulls need 300s) | $20/mo |
| DataDoe base plan once the trial ends | $97/mo |
| Anthropic API credits (prepaid) | ~$25 to start |
| Supabase | $0 (free tier is enough to start) |
| Google sign-in, Cloudflare email worker | $0 |
| **Month one before any sale** | **~$140** |

## Fixed monthly
Vercel $20 + DataDoe $97 + Supabase $0–25 + domain ~$3 = **$120–145/mo**.

## Per seller per month
| Item | Per seller | 100 sellers | Notes |
|---|---|---|---|
| DataDoe data rows | ~$4–14 (est.) | $440–1,420 | 10M rows included, +$49 per 10M. Habit Nest is at 542k rows and still loading; DataDoe says 0.5–10M is typical. **Biggest unknown.** |
| DataDoe AI tokens, exports | ~$9 (est.) | ~$880 | 4 exports/day/account × 2 tokens = 240/mo/account; 2,000 included per org. **Unverified:** whether a scheduled export run is charged like a one-off export. |
| DataDoe AI tokens, write actions | ~$2.40 (est.) | ~$240 | 3 tokens per action of ≤100 items, ~20 approvals/mo/account (est.). Dry runs are free. |
| Claude (Opus 5.5, $4 in / $20 out per 1M tokens) | ~$2.50 | ~$250 | Manager pass ≤1/day, and only when fixes change (~$0.05 each), plus ~30 Ask questions/mo (~$0.03 each). |
| Dodo fees | ~$2.80–3.50 | ~$280–350 | Assumed ~4% + $0.40 per charge, spread over 3 months. **Verify** the rate in the Dodo dashboard (international cards can cost more). |
| **Total** | **~$21–31** | **~$2,100–3,100/mo** | |

## Profit at 100 sellers
| | First quarter | Each quarter after |
|---|---|---|
| Revenue | $19,900 | $24,900 |
| Dodo fees | −$840 | −$1,040 |
| Infra (3 months, design as of today) | −$5,800 to −$8,800 | same |
| **Real profit before marketing** | **~$10,300–13,300** | **~$15,100–18,100** |
| Hackathon profit (only fees + marketing count) | ~$19,000 − marketing | |

Pay at signup means unpaid sign-ups cost $0: no DataDoe invite, no pulls, no Claude calls until they pay, and lapsed accounts drop out of the daily pull.

## Cheaper options, biggest saving first
1. **One export per table for all accounts.** DataDoe exports take a list of seller IDs, so 4 exports a day could cover every account instead of 400. That's about 240 tokens a month, inside the 2,000 included, saving ~$880/mo. Before building it, confirm with DataDoe that cost is per export (not per account) and that the file includes a seller-ID column.
2. **Fewer rows.** Ask DataDoe whether rows count stored history; a shorter backfill (90 days), plus turning off the tables Rocco doesn't read, could cut rows several times over. Ask for agency/partner pricing at 50+ accounts.
3. **Own Amazon APIs (Ads API + SP-API, both free).** This removes DataDoe entirely, roughly $1,500–2,500/mo saved at 100 sellers, but it needs Amazon approval (the partner form needs a registered business) and weeks of build. Do it after the first revenue.
4. **Claude Haiku 5.5 for the daily manager pass** ($0.10 / $0.50 per 1M tokens): ~$6/mo for 100 sellers instead of ~$250. The trade-off is weaker judgment; Opus stays the default unless Praveen picks Haiku. The Batch API also halves the cost of the nightly pass.
5. **Inventory weekly instead of daily**, which cuts one export a day.
6. **Supabase free tier** is likely enough at 100 sellers (small JSON per team).
