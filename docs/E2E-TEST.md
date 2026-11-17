# End-to-end launch test (do in this order)

Tick each line; if a step fails, note what you saw and tell Claude.

## 0. Infrastructure (Praveen)
- [ ] Vercel project deployed from `main`; Production URL loads.
- [ ] GoDaddy `A @` → `76.76.21.21` (or Vercel's IP); domain shows "Valid" in Vercel; https://rocco.works loads.
- [ ] Vercel env vars set, then **redeployed**: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (secret key), `DODO_API_KEY`, `CRON_SECRET` (random), `TEXT_WEBHOOK_SECRET` (random). Later: `LOOPMESSAGE_AUTH_KEY`, `LOOPMESSAGE_SECRET_KEY`, `LOOPMESSAGE_SENDER`, `NEXT_PUBLIC_ROCCO_IMESSAGE`.
- [ ] Supabase SQL Editor: run all of `supabase/setup.sql` → lists actions, phones, runs, snapshots, waitlist, workspaces.
- [ ] https://rocco.works/api/health → `"ok": true`, every table "ok", dodoApiKey "set".

## 1. Hackathon tracker
- [ ] Open rocco.works in a normal browser → hackathon dashboard → "Check installation" turns green. **No links shared before this.**

## 2. Website
- [ ] Homepage, /pricing, /setup, /connect, /press, /tools/account-check load on phone and desktop.
- [ ] /pricing shows $99, "Goes to $109 after 5 more hires", hire #1.
- [ ] Homepage "Text Rocco" → asks for phone/email → submit → appears in Supabase `waitlist` (phones stored as `tel:+…`).
- [ ] /tools/account-check → "Try it with a sample account" → score + actions.

## 3. Memory + connector (Claude)
- [ ] /setup → "Create my personal Rocco" → personal URL + dashboard link appear; a row appears in Supabase `workspaces`.
- [ ] Claude → Settings → Connectors → add custom connector (personal URL). New chat: "Rocco, brief me" → brief returns.
- [ ] Attach `fixtures/sp-search-term-report.csv` (or real data) → "analyze this" → approval list with N/H/B codes.
- [ ] "Approve N1, I applied it" → Rocco logs it; dashboard shows it in the change log.
- [ ] Dashboard: calendar link downloads/subscribes; "Client report (PDF)" opens and prints.

## 4. Amazon connectors (needs access)
- [ ] Claude: add Amazon Selling Partner connector (directory) → sign in to Seller Central.
- [ ] Claude: add Amazon Ads connector (`https://advertising-ai.amazon.com/mcp`, needs Ads API access) → sign in.
- [ ] "Rocco, morning check" → Rocco calls rocco_plan → Claude pulls reports with Amazon's connectors → analyze_report → approval list with real IDs.
- [ ] Approve one small, safe change (e.g. one negative) → Claude applies via Amazon's connector → apply_changes logs it → visible in Amazon Ads.

## 5. Payments (after Dodo KYC approval)
- [ ] Dodo dashboard (Live mode): webhook → `https://rocco.works/api/dodo/webhook` (payment events).
- [ ] Buy on /pricing with a real card ($99) → redirected to /thanks → receipt email has a license key.
- [ ] In Claude: "Rocco, activate my license" + key → "License active". Approval lists now show all fixes; export_changes works.
- [ ] Website Ad Roast unlock box accepts the key.
- [ ] /api/price shows sold: 1, live: true. (Ladder steps at 5 sales.)
- [ ] Refund the test purchase in Dodo (refunds count against contest profit; do it before real customers).
- [ ] TrustMRR shows the Dodo-verified revenue.

## 6. Text Rocco (after LoopMessage signup)
- [ ] LoopMessage webhook → `https://rocco.works/api/text/inbound`, Authorization header = `TEXT_WEBHOOK_SECRET`.
- [ ] From your iPhone text "hi" → onboarding reply.
- [ ] Dashboard → "Text Rocco now" (sends `link CODE`) → "You're in".
- [ ] Text "numbers" → morning numbers; "yes N1" → "Approved ✅"; in Claude "Rocco, brief me" → shows "Approved by text: APPLY N1".
- [ ] Text "STOP" → paused; "START" → back.
- [ ] Next morning (12:30 UTC) the daily numbers arrive (or trigger once: `curl -H "Authorization: Bearer $CRON_SECRET" https://rocco.works/api/cron/daily`).
- [ ] If any LoopMessage call fails, send Claude their docs page: endpoint/payload names in `lib/text/provider.ts` and `app/api/text/inbound/route.ts` are unverified.
