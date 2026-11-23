# Marketing log

What has been done on the `marketing` branch and where each output lives. Newest at the top. One entry per working session.

Prompt numbers are only given where Praveen's prompts named them (P04, P18, P24, P25, P29). The other prompts are listed by what they asked for.

## 2026-11-23

Done: 13 prompts, all committed and pushed on `marketing`. Not merged into `main` (which has moved ahead: merge needed before anything here ships).

| # | Prompt | Status | Where the output is |
|---|---|---|---|
| 1 | Setup: brief, folder layout, one price source, copy lint | Done | `marketing/BRIEF.md`, `marketing/config/offer.ts`, `marketing/config/sample.ts`, `marketing/scripts/lint-copy.mjs` |
| 2 | Remotion video studio, nine scene templates, three formats | Done | `marketing/video/` (README inside). Renders: `marketing/out/video/` |
| 3 | Share images in code, per page (P24) | Done | `lib/og.tsx`, `app/**/opengraph-image.tsx` and `twitter-image.tsx`, `public/og.png` |
| 4 | Brand guide: positioning, one-liners, voice, word lists | Done | `marketing/brand/BRAND.md` |
| 5 | Funnel events and `/admin/funnel` (P29) | Done | `lib/events.ts`, `lib/track.ts`, `components/Analytics.tsx`, `app/admin/funnel/`, `supabase/migrations/004_events.sql` |
| 6 | Lead capture: table, `/api/leads`, form, unsubscribe, admin | Done | `lib/leads.ts`, `components/LeadCapture.tsx`, `app/api/leads/`, `app/unsubscribe/`, `app/admin/leads/`, `supabase/migrations/005_leads.sql` |
| 7 | Black Friday checklist lead magnet (includes the PDF script, P18) | Done | `public/downloads/bfcm-checklist-2026.pdf`, `marketing/pdf/`, `marketing/scripts/pdf.mjs`, `app/free/black-friday-checklist/`, `components/SeasonBanner.tsx`, `marketing/copy/bfcm-posts.md` |
| 8 | One look everywhere: tokens, logo files, signature elements, `/brand` | Done | `marketing/brand/tokens.ts`, `marketing/brand/components/`, `marketing/brand/build-logos.mjs`, `public/brand/logos/`, `public/brand/rocco-brand-kit.zip`, `app/brand/` |
| 9 | Profiles kit for X, Instagram, LinkedIn, YouTube | Done | `marketing/brand/profiles/<account>/` (copy.md and images), `marketing/video/src/profiles/` |
| 10 | Short profile links and link-in-bio hub (P25) | Done | `/x`, `/ig`, `/yt`, `/linkedin` in `next.config.ts`, `app/start/` |
| 11 | Site capture script | Done | `marketing/video/scripts/capture.mjs`. Clips: `marketing/video/footage/site/` |
| 12 | 30s and 15s demo videos, hook variants, captions (P04) | Done | `marketing/video/specs/demo-30s.json`, `demo-15s.json`, `marketing/video/batches/demo-hooks.csv`, `marketing/video/scripts/batch.mjs`, `marketing/copy/demo-captions.md`. Renders: `marketing/out/video/` |
| 13 | Zip of everything for Praveen's laptop | Done | Sent in chat as three zips (not in the repo) |

Not in GitHub, on purpose (large renders are gitignored): `marketing/out/` and `marketing/video/footage/site/`. They exist only where they were rendered. Rebuild with `npm run render`, `npm run batch` and `npm run capture` in `marketing/video`.

Not started (named in prompts, nothing built yet): image templates (P34), carousels (P32). Their folders `marketing/images/` and `marketing/carousels/` are empty.

Waiting on Praveen:
- Run `supabase/migrations/004_events.sql` and `005_leads.sql` in Supabase.
- Setup calls: allowed or not under the hackathon's self-serve rule? Until then there is no `/call` and no booking button.
- Blue or green as the lead colour, and whether to swap the yellow profile picture (BRAND.md open questions).
- Confirm the origin line ("runs amazon accounts every day") and the "5 dashboards" hook.
- YouTube handle and latest-video link, once the channel exists.
