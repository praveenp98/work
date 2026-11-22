# Security: how Rocco protects sellers' Amazon accounts and the business

Last reviewed: 2026-11-22. Re-check this list whenever a route that touches payments, Amazon or a team's data changes.

## Who might attack, and what they want
| Attacker | Goal | Main defence |
|---|---|---|
| Freeloader | Use Rocco without paying (connect Amazon, get fixes) | Access only from a **succeeded Dodo payment fetched from Dodo's API**; every Amazon route checks `hasAccess` |
| Refund abuser | Pay, refund under the guarantee, keep using it | Refunds/chargebacks end access; replayed old webhooks can't switch it back on; paid period counts from the payment date |
| Saboteur (competitor, troll) | Mess with **another seller's** Amazon account | Accounts are bound to the invite DataDoe really completed; one account = one team; writes need that team's own secret link |
| Account hijacker | Get into a victim's Rocco | Ownership only from Google-verified email; team links are 24 random bytes, stored hashed |
| Cost attacker | Burn DataDoe tokens / Claude credits / LoopMessage contacts | Per-team limits stored on the team; IP limits and bot checks on public endpoints |
| Anyone, if something goes wrong | Bad changes in many accounts | Kill switch `ROCCO_WRITES_OFF=1`, daily write cap per team, dry run before every live change, everything logged and undoable |

## What's in place
**Payments (lib/billing.ts, app/api/dodo/webhook)**
- The webhook body is never trusted: it only names a payment/subscription id, which Rocco fetches from Dodo with the server key.
- Signed webhooks: set `DODO_WEBHOOK_SECRET` (Dodo dashboard → Webhooks → signing secret) and unsigned calls get 401. Without it, unsigned calls are rate-limited and still can't unlock anything.
- Only our products (`DODO_PRODUCT_ID_ANNUAL/MONTHLY`, legacy ids) unlock Rocco.
- Only a **succeeded payment** unlocks. A pending or trialing subscription alone unlocks nothing (no trials anymore).
- Paid period = from the payment date (≈1 month or ≈1 year), capped by the next billing date. An old payment can't buy a new year.
- A refund or open dispute on the payment ends access now, checked on the payment itself, so replays don't help.
- Dodo must run in **live mode** in production (`DODO_MODE` unset). Test mode in production would let test cards in.

**Connecting Amazon (app/api/w/amazon, app/api/datadoe/callback)**
- Only paying teams get a connect link (checked again on return). Max 10 connect links a day per team.
- On return, the account id in the URL is not trusted: Rocco asks DataDoe which account the invite connected and refuses a mismatch. Reconnect links are bound to their one account.
- An Amazon account already linked to another Rocco team is refused ("write to us").
- The invite must match the one created for that team (single use).

**Changes in Amazon (lib/datadoe.ts runAction, app/api/w/approve, create-campaign, tidy, text YES)**
- Paying teams only (the old "first fix free" no longer applies to live Amazon changes).
- Dry run with Amazon first, idempotency key, logged in the change log, undoable.
- Daily caps per team: 300 changed items, 10 new campaigns, 6 tidy runs.
- Approve-by-text only after the team switched it on (after seeing their fixes); texts come only from the verified LoopMessage webhook (`TEXT_WEBHOOK_SECRET`).
- Kill switch: set `ROCCO_WRITES_OFF=1` in Vercel and redeploy → every live change stops, dry runs and reading keep working.

**Accounts and sign-in (lib/signin.ts, app/api/hire)**
- A team's link (`/w/rw_…`) is a 24-byte random secret, stored only as a SHA-256 hash. Team pages send no Referer, aren't indexed or cached.
- The email typed on the Hire sheet only prefills checkout. Ownership comes from Google sign-in (`ownerVerified`), so nobody can plant a team for your email and wait for you to connect Amazon in it.

**Costs (lib/security.ts `spend`)** — per team, stored on the team (works across servers): Ask Rocco 40/day, data refresh 6/day, history 3/day, tidy scan 6/day.

**Admin and cron** — `CRON_SECRET` with constant-time checks; admin routes accept it as `Authorization: Bearer` (preferred over `?key=`, which ends up in logs). Rotate it after sharing a link.

**Headers** — no framing (clickjacking on Approve), nosniff, HSTS, tight Permissions-Policy.

## What Praveen must set (Vercel → Settings → Environment Variables)
1. `DODO_WEBHOOK_SECRET` = the signing secret from Dodo → Developer → Webhooks.
2. `CRON_SECRET` = a long random string (e.g. 40+ characters). Rotate if a tester link was shared.
3. `TEXT_WEBHOOK_SECRET` when LoopMessage goes live (the route refuses texts without it in production).
4. Keep `DODO_MODE` unset (live) in Production.
5. Know the kill switch: `ROCCO_WRITES_OFF=1`.
6. Turn on 2-factor login on Vercel, Supabase, Dodo, DataDoe, Google Cloud and GitHub. These hold the keys to every seller.

## Known limits (honest)
- DataDoe's API key can change every connected account: it lives only in Vercel env vars. If Vercel or the key leaks, rotate it in DataDoe at once.
- IP rate limits for public endpoints are per server instance (best effort); the per-team limits are durable.
- A seller who shares their own Rocco link shares their dashboard. Sign out / new link on request (hello@rocco.works).
