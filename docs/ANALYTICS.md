# Analytics

Two separate things, both on every page:
1. **Hackathon traffic tracker** (`components/Tracker.tsx`, ship-or-die.com verify.js): required by the rules. Verified live on /, /pricing, /help (Nov 22). Never remove it.
2. **PostHog** (product analytics: funnel, replays, page views). Free tier is plenty for the hackathon. Off until the key is set.

## Turn PostHog on (5 minutes)
1. Sign up at posthog.com → **US Cloud** → create a project "Rocco" (skip their install snippet; it's already built in).
2. Project settings → copy the **Project API key** (starts with `phc_`; it's public by design, safe in the browser).
3. Vercel → Settings → Environment Variables (Production): `POSTHOG_KEY` = `phc_…` → Redeploy. (No `NEXT_PUBLIC_` prefix: Vercel warns when those are marked Sensitive. Sensitive on or off is fine here.)
   - EU Cloud instead? Also set `POSTHOG_HOST` = `https://eu.i.posthog.com` and `POSTHOG_UI_HOST` = `https://eu.posthog.com`.
4. Check: /api/health shows `analytics: on`; PostHog → Activity shows your own page views within a minute.

## What's built in
- **Page views** on every route, with private team links scrubbed (`/w/rw_…` → `/w/[team]`, `?t=`/`?key=` hidden).
- **Session replays only on public pages** (home, pricing, help…), all inputs masked. Never inside a customer's Rocco (their Amazon numbers stay private).
- **Sent via rocco.works/ingest** (next.config rewrites) so ad blockers don't hide 20–40% of the funnel.
- **Teams are identified by workspace id** (not email) once they reach their Rocco page, so server events join the same person.

## Funnel events
| Step | Event | Where |
|---|---|---|
| Landed | `$pageview` | every page |
| Opened Hire | `hire_sheet_opened` | Hire sheet |
| Started sign-up | `signup_started` | Continue with Google |
| Signed up | `signed_up` (or `signed_in`) | server, Google callback |
| Went to checkout | `checkout_clicked` {plan} | plan step |
| Paid | `paid` {plan} / `renewed` | server, Dodo webhook / welcome |
| Clicked Connect | `amazon_connect_clicked` | connect screen |
| Amazon connected | `amazon_connected` {country, ads, nth} | server, DataDoe callback |
| First data in | `first_data_ready` | server, first pull |
| Approved a job | `job_approved` {kind, changes} | dashboard |
| Changes made | `changes_made` {made, failed} | server, approve |
| Skipped | `job_skipped` {kind, reason} | dashboard |
| Engagement | `reminders_saved`, `team_add`, `ask_rocco`, `email_human_clicked` | dashboard / everywhere |

## Built in PostHog (Nov 22): dashboard "Rocco"
**Open:** https://us.posthog.com/project/760057/dashboard/2397152 (pinned, set as the project's home dashboard). Charts fill in as real people use the site; headless/bot visits are dropped by posthog-js, so test from your own browser.

| Tile | What it answers | Check |
|---|---|---|
| Hires (paid) · Visitors · Sign-ups · Amazon accounts connected | Headline numbers, last 30 days vs the 30 before | daily |
| Revenue (USD, approx) vs refunds | Cumulative new hires $, renewals $, refunds $ (from `paid`/`renewed`/`refunded` `usd`). Dodo stays the source of truth for profit | daily |
| Main funnel: visit → hire → paid → first approval | The one number. 8 steps, 14-day window | daily |
| Hire sheet → paid (same day) | Drop-off between deciding and paying (Google, plan, checkout) | daily |
| Paid → activated | Do payers connect Amazon and approve within 7 days? A drop here = refunds later | daily |
| Visit → paid conversion, weekly | Is the site converting better week over week | weekly |
| Hires per day by plan | Annual vs monthly mix | weekly |
| Where visitors come from · Hire sheet opens by UTM campaign · Visitors by country · Top pages | Which posts/directories bring buyers (not just clicks) | daily during launch |
| Jobs approved vs skipped · Approvals by job type · Why sellers skip jobs | Trust in Rocco's jobs; skip reasons = judgment to-do list | weekly |
| Changes made in Amazon vs failed | Should sit at zero failed; every failure is a ticket | daily |
| Amazon connections by marketplace and Ads | Which countries buy; how many skip Ads | weekly |
| Reminders set up (channel, message style) | Which nudge people choose | weekly |
| Help signals: Ask Rocco + Email a human + rage clicks | Spikes = confusion; open replays from that day | daily |
| Weekly retention: paid teams that keep approving | Refund and renewal predictor | weekly |

**Replays** (Session replay → Playlists, pinned): "Opened Hire: watch where they stop" (watch 5 a day) and "Rage clicks: something is broken". Recording is on (project setting), 3s minimum, public pages only (the code stops it inside /w, /me, /welcome), inputs masked.

**Project settings changed:** session replay on, dead clicks on, JS error capture on, timezone Asia/Kolkata, home dashboard = Rocco.

**Server events carry money:** `paid` / `renewed` {plan, currency, usd}, `refunded` {kind: refund|dispute, usd}. `usd` is approximate (lib/currency.ts rates, Dodo PPP prices are local).

Ideas once there's traffic: alerts on "Changes made… Failed > 0" and on daily hires dropping to 0 for 2 days; a subscription that emails this dashboard every Monday.
