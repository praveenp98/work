# Praveen's routine: what to check, how often

Everything here takes minutes. Start every check at **https://rocco.works/api/health**: anything not "set"/"ok" comes first.

## Every day (5 minutes)
- [ ] **Inbox** human@rocco.works: answer within a day, refunds the same day (macros: docs/SUPPORT.md).
- [ ] **Dodo → Transactions**: new hires and refunds. Log every refund in docs/PROGRESS.md (hackathon profit).
- [ ] **Vercel → Logs**, search `[amazon] connect failed`: a seller couldn't connect. Email them (the code in the log tells you why; "ALREADY" = already in DataDoe, link it with the attach command below).
- [ ] **Vercel → Logs**, search `error` and `[ai]` for anything unusual (a spike of `[ai]` lines = someone hammering Ask; limits cap it at 40/team/day).

## Every week (15 minutes, Mondays)
- [ ] **Removed accounts**: Vercel → Logs → search `account removed by team` → delete each one in DataDoe → Accounts (DataDoe has no API for it; they cost rows until deleted).
- [ ] **Expired free audits**: /admin/leads → rows marked "free audit" with an Amazon account, signed up 15+ days ago and still not paid → delete those Amazon accounts in DataDoe → Accounts (they cost rows; the seller keeps the read-only view, and reconnects if they hire later).
- [ ] **DataDoe → Usage**: rows and AI tokens vs. plan. Rows climbing faster than accounts? Check retention is 6 months and only the 9 tables are on (docs/LIGHTS-ON.md step 5).
- [ ] **Anthropic Console → Usage**: AI spend vs. the ~$2.50/seller/month estimate (docs/AI-USAGE.md).
- [ ] **Dodo → Webhooks → Logs**: no failed deliveries. If any failed, click Replay.
- [ ] **Price rise**: hires count ÷ 5. Crossed a step? Raise both Dodo products (+$10 monthly, +$100 yearly) and ask Claude to update `PLAN` in lib/pricing.ts.
- [ ] **What sellers asked for that Rocco can't do** (Vercel Logs → `[ai] Their question`): note the top 3 in docs/PROGRESS.md; the most asked becomes the next job type.
- [ ] **Marketing costs** of the week logged in docs/PROGRESS.md (hackathon rule).

- **Deleted Roccos:** search the Vercel logs for `rocco_deleted` / "delete in DataDoe". Delete the listed Amazon accounts in DataDoe → Accounts (stops the cost) and erase that workspace's stored data within 30 days (promised on the Account page).

## Every month (30 minutes)
- [ ] **Exchange rates** for "N× what I cost" on non-US accounts: if a rate moved more than ~10%, ask Claude to update `lib/currency.ts`.
- [ ] **Help center**: turn the month's repeated questions into /help articles (lib/help.ts).
- [ ] **Security**: rotate `CRON_SECRET` if you shared any admin link; confirm 2-factor is on everywhere (docs/SECURITY.md).
- [ ] **DataDoe write actions**: still all 7 on (Settings → Actions).

## Admin commands (keep `CRON_SECRET` private; run in Terminal)
Give yourself 30 days of free access for testing (fresh team):
```bash
curl -H "Authorization: Bearer $CRON_SECRET" "https://rocco.works/api/admin/tester?email=YOU@gmail.com&fresh=1"
```
Link an Amazon account that's already in DataDoe to someone's Rocco (they signed in with Google first):
```bash
curl -H "Authorization: Bearer $CRON_SECRET" "https://rocco.works/api/admin/attach?email=THEM@gmail.com&account=DATADOE_ACCOUNT_ID"
```
Emergency stop for all Amazon changes: Vercel → Settings → Environment Variables → `ROCCO_WRITES_OFF` = `1` → Redeploy. Remove it to resume.
