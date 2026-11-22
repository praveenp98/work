# Analytics

Two separate things, both on every page:
1. **Hackathon traffic tracker** (`components/Tracker.tsx`, ship-or-die.com verify.js): required by the rules. Verified live on /, /pricing, /help (Nov 22). Never remove it.
2. **PostHog** (product analytics: funnel, replays, page views). Free tier is plenty for the hackathon. Off until the key is set.

## Turn PostHog on (5 minutes)
1. Sign up at posthog.com → **US Cloud** → create a project "Rocco" (skip their install snippet; it's already built in).
2. Project settings → copy the **Project API key** (starts with `phc_`; it's public by design, safe in the browser).
3. Vercel → Settings → Environment Variables (Production): `NEXT_PUBLIC_POSTHOG_KEY` = `phc_…` → Redeploy.
   - EU Cloud instead? Also set `POSTHOG_HOST` = `https://eu.i.posthog.com` and `NEXT_PUBLIC_POSTHOG_UI_HOST` = `https://eu.posthog.com`.
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

## Build these in PostHog (once, 10 minutes)
1. **Insight → Funnel**: `$pageview` (URL = rocco.works/) → `hire_sheet_opened` → `signed_up` → `checkout_clicked` → `paid` → `amazon_connected` → `first_data_ready` → `job_approved`. Conversion window 14 days. This is the one number to watch daily.
2. **Trend**: `paid` per day, broken down by `plan`.
3. **Trend**: `$pageview` by `$referring_domain` (which posts and directories send buyers; pair with UTM links from docs/X-DAY1.md).
4. **Replays**: filter to sessions with `hire_sheet_opened` but no `signup_started`: watch 5 a day to see what stops people.
5. Pin all four to a dashboard "Rocco".
