# Lights-on checklist (Nov 22, 2026)

What's left before Rocco can take real money and run real accounts. In order. Check progress anytime at
**https://rocco.works/api/health** (shows set / missing for every key, never the values).

## 🔴 Blocks every sale
1. **Dodo: create the two products** (docs/DODO-SETUP.md has exact clicks).
   - "Hire Rocco: yearly": subscription, $1,190 every 1 year. "Hire Rocco: monthly": subscription, $119 every 1 month.
   - Description / checkout note on both: *If you don't like the fixes I give you, you can ask your money back. 30 days guarantee.*
   - Vercel → Settings → Environment Variables (Production): `DODO_PRODUCT_ID_ANNUAL` = pdt_… and `DODO_PRODUCT_ID_MONTHLY` = pdt_… → Redeploy.
   - Until both are set the plan page says "Checkout is being switched on" (it no longer falls back to the old $99 product).
2. **Dodo webhook**: Dodo → Developer → Webhooks → add `https://rocco.works/api/dodo/webhook`, events: payment, subscription, refund, dispute (all). Copy its signing secret → Vercel `DODO_WEBHOOK_SECRET` → Redeploy.
3. **Google sign-in in production mode**: Google Cloud → APIs & Services → OAuth consent screen → **Publish app** ("In production"). In "Testing" only listed test users can sign in, everyone else gets an error. App name Rocco, support email, rocco.works privacy/terms links.

## 🟠 Blocks "Rocco makes the change in Amazon"
4. **DataDoe → Settings → Actions**: turn on `AMAZON_ADS_TARGETS_ADD`, `AMAZON_ADS_TARGETS_UPDATE`, `AMAZON_ADS_CAMPAIGNS_UPDATE`, `AMAZON_ADS_CAMPAIGNS_ADD`, `AMAZON_ADS_AD_GROUPS_ADD`, `AMAZON_ADS_ADS_ADD`, `AMAZON_ADS_PORTFOLIOS_ADD`. (All are off by default; approvals fail without them.)
5. **DataDoe → Settings → Data**: retention 6 months on every table; turn off tables Rocco doesn't read. Keep: ads search terms / targeting / placement by campaign, campaign performance, negative keywords, targets raw, campaigns raw, ads raw, product catalog, FBA restock, seller performance, **ads entity history**. (Cuts the row bill from ~$440–1,420/mo to ~$100–350/mo at 100 sellers.)
6. **Habit Nest**: reconnect with read & write (the founder test does this).

## 🟡 Before you send traffic
7. **Founder test** (docs/FOUNDER-TEST.md, ~20 min): `/api/admin/tester?email=you@gmail.com&fresh=1` with header `Authorization: Bearer <CRON_SECRET>` → sign in → connect Habit Nest → first jobs → approve one small negative → change log → Tidy scan → team test with a second Gmail.
8. **One real payment test** on the live site with the cheapest path: buy monthly ($119) with your card → check you land on Connect Amazon and get the "You hired me" text → refund it in Dodo → check access ends. Costs only Dodo's fee.
9. **Slack**: either create the Slack app (docs/slack-manifest.yml → `SLACK_CLIENT_ID`, `SLACK_CLIENT_SECRET`, `SLACK_SIGNING_SECRET`, ~10 min) or tell me to take Slack out of the homepage. Today the homepage promises Slack approvals but the option is hidden for customers.
10. **TrustMRR**: connect the Dodo account so revenue shows on the leaderboard.
11. **Hackathon tracker**: already on every page; open the Ship or Die dashboard and confirm visits show up.

## 🔐 Security (10 minutes, do once)
12. 2-factor login on Vercel, Supabase, Dodo, DataDoe, Google Cloud, GitHub, LoopMessage.
13. `CRON_SECRET`: make sure it's long (40+ random characters). Change it if you ever pasted an admin link anywhere.
14. Don't add or change `ROCCO_VAULT_KEY` (saved team links would stop opening). Keep `DODO_MODE` unset (live).
15. Emergency stop: set `ROCCO_WRITES_OFF=1` + Redeploy → no changes are made in any Amazon account until you remove it.

## 🔁 Ongoing
16. **Every 5 hires**: raise both Dodo products (+$10 monthly, +$100 yearly) and tell me to update `PLAN` in lib/pricing.ts (next: $129 / $1,290).
17. Log every marketing cost in docs/PROGRESS.md (hackathon rule).

## Decisions waiting on you
- **Accounts per plan**: today one plan covers unlimited Amazon accounts. An agency could connect 30 accounts for $119/mo, and DataDoe rows grow with every account. Suggested: up to 3 accounts included, each extra +$49/mo (or "talk to us"). Your call.
- **Currencies**: non-US accounts (India ₹, UK £, EU €…) still show "$". Needs a build (~half a day). Say go.
- **Remove / swap an Amazon account**: not built yet (small). Say go.

## Known, not fixed yet (low risk at launch volume)
- Two saves at the same instant can overwrite each other (whole-record saves). Rare; fix = field-level updates.
- If Dodo's return link only carries a subscription id, the welcome page waits for the webhook (≤ 1 min).
- A slow AI reply by text can occasionally be sent twice (LoopMessage retry).
- Some spam guards (sign-up taps, text opt-in, new workspaces) count per server, not globally.
