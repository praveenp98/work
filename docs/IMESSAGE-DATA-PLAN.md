# How Rocco gets Amazon data into iMessage (Nov 18, 2026)

**Problem:** in Claude/ChatGPT, Amazon's own connectors give the AI live data and Rocco does the manager job. In iMessage there's no AI app in between, so Rocco only knows what was last saved to its memory (from a Claude check, or a texted CSV). The homepage promises iMessage numbers, so iMessage needs its own data path.

## Options (ranked)

| # | Path | Live data in iMessage? | Works today? | Effort |
|---|---|---|---|---|
| 1 | **Rocco's own Amazon connection** (Login with Amazon for Ads API + SP-API). Team taps "Connect Amazon" once on their Rocco page; Rocco's server pulls nightly and on demand, and applies approved codes itself. | Yes, fully | After Amazon approves our developer apps (applications drafted in docs/AMAZON-API-APPLICATIONS.md) | 2-3 days to build; can be built now and switched on at approval |
| 2 | **Claude does the pull on a schedule** (bridge). The team's Claude/Claude Code with Amazon's connectors runs "Rocco, morning check" daily (Claude Code cron autopilot already exists; Claude/ChatGPT scheduled tasks where available). Results land in Rocco's memory; iMessage reads memory and shows freshness. Approvals by text queue up and apply on the next run. | Daily, not live | Yes | Mostly built; needs a "set up your daily check" step + freshness nudges |
| 3 | **Text Rocco the report** (CSV today; screenshots with the Anthropic key). | On demand | Yes | Built |
| 4 | **Forward Amazon report emails** to reports@rocco.works (scheduled Ads reports). | Daily | Needs inbound email + verifying Amazon's email format | 1 day, uncertain |

## Recommendation
Build **1 now** (OAuth + token vault + nightly sync into the same analyze pipeline + on-demand pulls for texts), behind env flags so it switches on the day Amazon approves. Ship **2** as the bridge until then. Keep **3** as the zero-setup fallback.

## The AI layer (with ANTHROPIC_API_KEY)
Texts go to Claude with **tools** over the team's data: `get_numbers(range)`, `search_terms(filter)`, `stock(sku)`, `listing_health()`, `queue_change(codes)`, `history()`. Today the tools read Rocco's memory; with option 1 they call Amazon's APIs live. So "how are sales today?" or "why is the blue board not selling?" gets a real answer in iMessage, same as in Claude.

## Homepage honesty until option 1 is live
- iMessage card label: "online · Amazon connected" is true only for teams with a daily check (2) or direct connection (1). The first-run text explains how to connect.
- Morning texts always show data freshness ("from this morning's check" / "last checked 2 days ago").

## Status (Nov 18)
- Option 2 (Claude bridge) shipped: connect link in onboarding, 🔔 on first use, push on fresh check, one-tap morning link, setup reminders.
- Option 1 on hold until the Amazon API applications are submitted.
