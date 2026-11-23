# Lights-on checklist (Nov 22, 2026)

What's left before Rocco can take real money and run real accounts. In order. Check progress anytime at
**https://rocco.works/api/health** (shows set / missing for every key, never the values).

## 🔴 Blocks every sale
1. **Dodo: create the two products** (docs/DODO-SETUP.md has exact clicks).
   - "Hire Rocco: yearly": subscription, $1,190 every 1 year. "Hire Rocco: monthly": subscription, $119 every 1 month.
   - Description / checkout note on both: *If you don't like the fixes I give you, you can ask your money back. 7 days guarantee.*
   - Vercel → Settings → Environment Variables (Production): `DODO_PRODUCT_ID_ANNUAL` = pdt_… and `DODO_PRODUCT_ID_MONTHLY` = pdt_… → Redeploy.
   - Until both are set the plan page says "Checkout is being switched on" (it no longer falls back to the old $99 product).
2. **Dodo webhook**: ✅ endpoint created (receives every event). Last step: click the 👁 on "Signing secret", copy it, and paste it in Vercel as `DODO_WEBHOOK_SECRET` (Production) → Redeploy. Don't paste it in chat.
3. **Google sign-in in production mode**: Google Cloud → APIs & Services → OAuth consent screen → **Publish app** ("In production"). In "Testing" only listed test users can sign in, everyone else gets an error. App name Rocco, support email, rocco.works privacy/terms links.

4b. **Dodo: "Extra Amazon account" product** (optional but recommended): subscription, **$49 every 1 month**, name "Rocco · Extra Amazon account", localized pricing on like the others. Vercel: `DODO_PRODUCT_ID_EXTRA_ACCOUNT` = pdt_… → Redeploy. Without it, a team that wants a 4th account is told to email you.
4c. **Supabase → SQL Editor**: paste `supabase/migrations/003_limits.sql` → Run (shared spam limits + "reply once" for texts). /api/health shows `rocco_hits: ok` when done. Until then Rocco uses per-server limits (works, just less strict).
4d. **Supabase → SQL Editor**: paste `supabase/migrations/004_events.sql` → Run (funnel events). Then open `rocco.works/admin/login?key=<CRON_SECRET>` to see `/admin/funnel`. Until it runs, events are dropped quietly.
4e. **Supabase → SQL Editor**: paste `supabase/migrations/005_leads.sql` → Run (lead magnet emails). Leads then show at `/admin/leads`. Until it runs, lead forms still give the download but the email is not saved.

## 🟠 Blocks "Rocco makes the change in Amazon"
4. **DataDoe → Settings → Actions**: turn on `AMAZON_ADS_TARGETS_ADD`, `AMAZON_ADS_TARGETS_UPDATE`, `AMAZON_ADS_CAMPAIGNS_UPDATE`, `AMAZON_ADS_CAMPAIGNS_ADD`, `AMAZON_ADS_AD_GROUPS_ADD`, `AMAZON_ADS_ADS_ADD`, `AMAZON_ADS_PORTFOLIOS_ADD`. (All are off by default; approvals fail without them.)
5. **DataDoe → Settings → Data** (checked against the code: Rocco reads exactly these **9 tables**, nothing else):
   - Fastest way: turn **everything off**, then switch **on** only these 9, each with **6-month retention**:
     1. `amazon_ads_search_terms_by_campaign_by_date` (search terms: negatives, new exact campaigns)
     2. `amazon_ads_performance_by_campaign_by_date` (campaign results: bids, budgets)
     3. `amazon_ads_campaigns_raw` (campaign names, state, portfolios: Tidy)
     4. `amazon_ads_targets_raw` (keywords and targets: Tidy, bids)
     5. `amazon_ads_ads_raw` (which products each campaign advertises: new campaigns, Tidy)
     6. `amazon_ads_product_catalog` (product titles: readable names)
     7. `amazon_ads_entity_history` ("Before Rocco" change history)
     8. `amazon_sales_and_traffic_with_cogs` (sales, sessions, Buy Box: listing jobs)
     9. `amazon_fba_inventory_health` (stock: restock jobs)
   - If DataDoe asks "delete existing data?" for the ones you turn off, yes is fine: Rocco never reads them.
   - Saves the row bill: ~$440–1,420/mo → ~$100–350/mo at 100 sellers.
6. **Habit Nest**: reconnect with read & write (the founder test does this).

## 🟡 Before you send traffic
7. **Founder test** (docs/FOUNDER-TEST.md, ~20 min): `/api/admin/tester?email=you@gmail.com&fresh=1` with header `Authorization: Bearer <CRON_SECRET>` → sign in → connect Habit Nest → first jobs → approve one small negative → change log → Tidy scan → team test with a second Gmail.
8. **One real payment test** on the live site with the cheapest path: buy monthly ($119) with your card → check you land on Connect Amazon and get the "You hired me" text → refund it in Dodo → check access ends. Costs only Dodo's fee.
9. **Slack**: either create the Slack app (docs/slack-manifest.yml → `SLACK_CLIENT_ID`, `SLACK_CLIENT_SECRET`, `SLACK_SIGNING_SECRET`, ~10 min) or tell me to take Slack out of the homepage. Today the homepage promises Slack approvals but the option is hidden for customers.
10. **TrustMRR**: connect the Dodo account so revenue shows on the leaderboard.
11. **Hackathon tracker**: already on every page; open the Ship or Die dashboard and confirm visits show up.

## 🟢 Support + AI (15 minutes)
- Make sure **human@rocco.works** forwards to your inbox (every help page and message points there). Macros: docs/SUPPORT.md.
- Anthropic Console → Settings → Limits: set a monthly spend limit (suggested $400). Where AI is used and why: docs/AI-USAGE.md.

## 📈 Analytics (5 minutes)
- PostHog: create a free project, paste the `phc_…` key into Vercel as `POSTHOG_KEY` (no `NEXT_PUBLIC_` prefix), redeploy, then build the funnel. Exact steps: docs/ANALYTICS.md. The hackathon tracker is already on every page (verified).

## 🔐 Security (10 minutes, do once)
12. 2-factor login on Vercel, Supabase, Dodo, DataDoe, Google Cloud, GitHub, LoopMessage.
13. `CRON_SECRET`: make sure it's long (40+ random characters). Change it if you ever pasted an admin link anywhere.
14. Don't add or change `ROCCO_VAULT_KEY` (saved team links would stop opening). Keep `DODO_MODE` unset (live).
15. Emergency stop: set `ROCCO_WRITES_OFF=1` + Redeploy → no changes are made in any Amazon account until you remove it.

## 🔁 Ongoing
16. **Every 5 hires**: raise both Dodo products (+$10 monthly, +$100 yearly) and tell me to update `PLAN` in lib/pricing.ts (next: $129 / $1,290).
17. Log every marketing cost in docs/PROGRESS.md (hackathon rule).

## Weekly (5 minutes)
- Vercel → Logs → search `account removed by team` → delete those accounts in DataDoe → Accounts (DataDoe has no API for it; they keep costing rows until removed).

## Decisions waiting on you
- ✅ Accounts per plan: 3 included, +$49/mo each (built Nov 22).
- ✅ Currencies: each account shows money in its marketplace currency (built Nov 22). Rocco's own price is USD on the site; Dodo checkout shows local prices (PPP on).
- ✅ Remove / swap an account: owner only, slot frees after 30 days (immediately if removed within a day of connecting).

## Known, not fixed yet
- Nothing open from the audit (all fixed Nov 22).

## Restock (new, Nov 23)
- [ ] DataDoe → Settings → Actions: enable the 6 FBA inbound Action types listed in docs/RESTOCK.md.
- [ ] Test once on Habit Nest US with 1 SKU, small quantity: plan appears in Send to Amazon → cancel it from Rocco.
