# Customer support: what to expect and exact replies

Customer-facing answers live in **/help** (source `lib/help.ts`) and in one plain file for AI assistants at
**/llms-full.txt**. When a ticket repeats, add or fix a help article instead of answering it twice.

## Predicted volume (first 100 sellers)
Most sellers will paste rocco.works links into Claude/ChatGPT before writing to you; /llms-full.txt answers those.
Expect roughly **15–25 emails per 10 new sellers in week one**, then **~1 per seller per month**.

| Rank | Ticket | Share | Self-serve answer | What you do |
|---|---|---|---|---|
| 1 | "Connected but no jobs yet" | 25% | /help/first-jobs-not-showing | Check /api/health; in DataDoe check the account's first load. Reply with the macro below. |
| 2 | Amazon sign-in / permission errors | 15% | /help/connect-errors | Tell them to use the primary user, connect Ads on step 2. |
| 3 | "Approval failed" | 10% | /help/approve-failed | Check DataDoe → Actions are on (all 7). Reconnect if needed. |
| 4 | Refund within 14 days | 10% | /help/refund | Dodo → Transactions → Refund (full) → Subscriptions → cancel. Access ends automatically. |
| 5 | Cancel / invoice | 10% | /help/cancel, /help/invoice | Point to the Dodo receipt link. |
| 6 | Can't get back in / wrong Google account | 10% | /help/sign-in-problems | Ask which email they paid with; check it's the owner on the team. |
| 7 | Teammate access / hand over | 5% | /help/add-teammates | — |
| 8 | "Why did Rocco suggest X?" / disagree | 5% | /help/skip-a-fix | Tell them to Skip with "not my strategy": Rocco learns. |
| 9 | Wants something Rocco doesn't do | 5% | /help/what-rocco-does-not-do | Log it as a feature request in PROGRESS. |
| 10 | Currency / marketplace questions | 5% | /help/currency-and-marketplaces | — |

## Macros (copy, fill the brackets)
**No jobs yet**
> Hi [name], Amazon sends the first reports in batches, so it can take a few hours after connecting. Your Rocco page opens today's jobs by itself when they land, and you can tap Check now once an hour. If it's been more than 24 hours, please check that Amazon Ads was connected on the second step. I'm watching your account too. Praveen

**Refund**
> Hi [name], done: your refund of [amount] is on its way (3–10 business days back to your card) and you won't be charged again. Thanks for trying Rocco. If you have a minute, what would have made it worth it? Praveen

**Approval failed**
> Hi [name], nothing was changed: Rocco checks every change with Amazon first, and Amazon declined this one because [reason]. [Fixed now / Here's the manual step: …]. Praveen

**Wants a feature Rocco doesn't do**
> Hi [name], Rocco doesn't do [thing] yet. Here's how to do it in Seller Central: [steps]. I've noted it; if more sellers ask, it's next. Praveen

## Where to look when something's wrong
1. **https://rocco.works/api/health**: shows which settings are missing.
2. **Vercel → Logs**: filter `[amazon]`, `[ai]`, `[brain]`, `[dodo]`.
3. **DataDoe**: account load status, Actions on, last exports.
4. **Dodo**: payment, subscription, webhook deliveries (Webhooks → Logs).
5. **Emergency**: `ROCCO_WRITES_OFF=1` + Redeploy stops every Amazon change at once.

## Inbox
human@rocco.works should forward to Praveen's inbox. Reply within one business day; refunds same day.
