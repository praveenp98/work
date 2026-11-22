# Founder test: connect Habit Nest from rocco.works, no paywall

Fresh run of the real customer flow (sign in → connect Amazon → first pull → today's work → approve), with free test access instead of paying. Test access never touches Dodo, so it's not counted as a hire or revenue.

## Before you start (once)
1. **Vercel env** (Settings → Environment Variables, Production), then redeploy:
   - `CRON_SECRET`: any long random string (also protects the daily job)
   - `DATADOE_API_KEY`: already set
   - `ANTHROPIC_API_KEY`: for Rocco's picks, the morning brief and Ask Rocco (without it the dashboard still works, ranked by rules)
2. **DataDoe → Settings → Actions**: turn on `AMAZON_ADS_TARGETS_ADD`, `AMAZON_ADS_TARGETS_UPDATE`, `AMAZON_ADS_CAMPAIGNS_UPDATE`, `AMAZON_ADS_CAMPAIGNS_ADD`, `AMAZON_ADS_AD_GROUPS_ADD`, `AMAZON_ADS_ADS_ADD`. (All change types are off by default; without this, approvals come back as "switched off in DataDoe".)

## The test
1. Open (replace the two values):
   `https://rocco.works/api/admin/tester?key=YOUR_CRON_SECRET&email=YOUR_GOOGLE_EMAIL&fresh=1`
   You should see `{"ok":true,"mode":"fresh",...}`. Your old Rocco (with Habit Nest attached by hand) is archived; a new one has 30 days of access.
2. On rocco.works: **Sign out** if you're signed in (bottom of your Rocco page), then **Sign in** (top right) with that Google account.
3. You land on **Connect your Amazon** (no paywall). Tap **Connect Amazon →**, pick Habit Nest's Seller Central, then Amazon Ads, and allow **read & write** access.
4. Back on rocco.works you'll see "Amazon is sending me your data" with live steps. Habit Nest's history is already in DataDoe, so the first pull starts immediately and the page should open your dashboard by itself in about 1–2 minutes.
5. Check: today's jobs (grouped), "Rocco found you ~$X a month", Ask Rocco. Rocco's picks and the one-line brief appear about a minute after the first load (refresh).
6. **Live changes (real account):** approving makes real changes in Habit Nest's Amazon Ads. Start small: open a job, "Show all · choose", untick all but one, Approve. Check it in the Ads console. Undo = remove that negative / set the bid back.
   - **Create campaign** creates a real Sponsored Products campaign ($10–50/day). Try it only if you're happy to; pause it in the Ads console afterwards if it was just a test.

## If something's off
- DataDoe sends you back with an error because Habit Nest is already connected: use the fallback `https://rocco.works/api/admin/attach?key=YOUR_CRON_SECRET&email=YOUR_GOOGLE_EMAIL&account=d7896284-b29d-42b0-ad5f-f5d31132cb31`, then open rocco.works/me.
- Approvals say "read-only access": reconnect Habit Nest (banner on the dashboard) and allow read & write.
- Tell Claude exactly what you saw (screenshot), so it can be fixed the same day.
