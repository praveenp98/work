# Go-live checklist: rocco.works (Nov 17, 2026)

The code is ready. These steps need Praveen's accounts. Each one says which env var it fills (see `.env.example`).

## 1. Deploy (15 min)
1. vercel.com → Add New Project → import `praveenp98/work` (framework: Next.js, root: repo root). Production branch: `main`.
2. Settings → Domains → add `rocco.works` and `www.rocco.works` (redirect www → apex). At the registrar, set the DNS records Vercel shows (A `76.76.21.21` for apex, CNAME `cname.vercel-dns.com` for www, or switch nameservers to Vercel).
3. Env var: `NEXT_PUBLIC_SITE_URL=https://rocco.works`.

### DNS at GoDaddy (checked Nov 17 from Praveen's screenshot)
- `CNAME www → 4415e1e0dfd3209e.vercel-dns-017.com` ✅ already set.
- **Change `A @` from "Parked" to `76.76.21.21`** (or the IP Vercel shows for rocco.works). This is the only change needed for the site.
- Keep NS/SOA/_domainconnect. GoDaddy Domain → Forwarding must be off.
- `_dmarc` is `p=quarantine` with no SPF/DKIM yet: add the email provider's MX/SPF/DKIM when hello@rocco.works is set up, before sending any mail.
- In Vercel: add rocco.works + www.rocco.works, make rocco.works primary (www redirects).

## 2. Hackathon traffic tracker ✅ installed in code
`<script defer src="https://www.ship-or-die.com/hackathon/verify.js" data-site="f9fac6eeac39ef1b81208010816a97a15278f3aa">` is rendered in `<head>` on every page (`components/Tracker.tsx` via `app/layout.tsx`). Verified on the production build (one tag per page).
After deploy: open rocco.works, then press "Check installation" in the hackathon dashboard. Do this before sharing any link.

## 3. Payments: Dodo Payments (USD) — single Founding Lifetime plan on a price ladder
Vercel env: `DODO_API_KEY` (required for the ladder). Dodo webhook → `https://rocco.works/api/dodo/webhook`.
Polar is out (doesn't support individuals in India). Code now uses Dodo: see `docs/DODO-SETUP.md`.
✅ Products created and wired by Claude (IDs in `docs/DODO-SETUP.md`). Praveen: finish KYC/payouts, click a checkout link once, make one real purchase (refund after) to confirm the license email + unlock, connect Dodo to TrustMRR.

## 4. Supabase: memory + waitlist (REQUIRED for personal connectors)
Without Supabase, "Get my personal Rocco" and `/mcp/<key>` return "memory isn't switched on" in production. The shared `/mcp` and all web tools still work.
1. Supabase project → **SQL Editor** → New query → paste all of `supabase/setup.sql` → **Run**. The last line lists the tables: actions, runs, snapshots, waitlist, workspaces.
2. **Project Settings → API**: copy **Project URL** and the **service_role** key (secret, not the anon key).
3. **Vercel → Project → Settings → Environment Variables** (Production): `SUPABASE_URL` = Project URL, `SUPABASE_SERVICE_ROLE_KEY` = service_role key. Never prefix with `NEXT_PUBLIC_`. Redeploy.
4. Redeploy, then open **rocco.works/api/health**: every table should say "ok". It names the exact problem otherwise (missing URL, publishable key used instead of secret key, key rejected, tables missing).
5. Test: rocco.works/setup → "Create my personal Rocco" → open the dashboard link.

## 5. Email + handles
- `hello@rocco.works` (Google Workspace, Zoho or Cloudflare Email Routing → Gmail). Set SPF/DKIM/DMARC.
- Grab @roccoworks on X, Instagram, TikTok, YouTube; LinkedIn page "Rocco Works".
- Cold-email sending domains stay separate (`docs/LAUNCH-SETUP.md`); ask before buying.

## 6. Decisions Praveen needs to approve
- [ ] Refund policy: 7 days, "if Rocco finds nothing useful" (refunds reduce contest profit; short window recommended).
- [ ] Pricing as on `/pricing` (from plan v2).
- [ ] Business postal address for email footers (CAN-SPAM) and Polar.

## 7. After deploy
- Test the connector: Claude → Settings → Connectors → Add custom connector → `https://rocco.works/mcp`.
- List Rocco on MCP directories (Claude does the submissions text).
- Google Search Console + Bing Webmaster: add property, submit `/sitemap.xml`.
- Test a real purchase with a Polar test/discount code → paste key in the Ad Roast unlock box → fixes unlock.

## Local dev
```bash
npm install
npm run dev     # http://localhost:3000
npm test        # rules + parsers unit tests
```

## 8. Seller onboarding (built Nov 17)
- `/setup` wizard: pick AI app (Claude, Claude Code, ChatGPT, Cursor) + marketplace region → official Amazon Ads MCP URL for the region (advertising-ai[-eu|-fe].amazon.com/mcp), Amazon Selling Partner connector (sellingpartner-ai.amazon.com/mcp, beta, Claude directory), Rocco URL (personal with one click), Claude Code `claude mcp add` commands, `.mcp.json`, Cursor `mcp.json`, and a `/morning-check` Claude Code command.
- MCP `setup_check` tool walks sellers through whatever connector is missing from inside the chat.
- Caveats: Amazon Ads connector needs an approved Amazon Ads API app (Login with Amazon); Selling Partner connector is beta and US-first. Verify these URLs in a real account once (Praveen).

## 9. Text Rocco (LoopMessage) — matched to loopmessage.com/apidocs (Nov 17)
**Vercel → Environment Variables (Production), then Redeploy:**
- `LOOPMESSAGE_API_KEY` = LoopMessage → API → Settings → API key
- `LOOPMESSAGE_SENDER_TYPE` = `shared` (you're on the shared-sender plan)
- `TEXT_WEBHOOK_SECRET` = any long random string
- `CRON_SECRET` = another long random string
- `ROCCO_OPTIN_URL` = the iMessage opt-in link from the LoopMessage dashboard (homepage "Text Rocco" button)
**LoopMessage → API → Webhook settings:**
- Webhook URL: `https://rocco.works/api/text/inbound`
- Webhook header: the same value as `TEXT_WEBHOOK_SECRET` (sent as the Authorization header) → Save
- Webhook alerts: Message Inbound must be on (others are fine; Rocco ignores them)
**Test:** /api/health shows loopmessage "set". From your iPhone text Rocco "hi" → onboarding reply. Open your dashboard → "Text Rocco from this phone" (personal opt-in link, links your phone automatically) or text `link CODE` → "numbers" → "yes N1" → in Claude "Rocco, brief me" shows the text approval.
**Sandbox notes (from LoopMessage helpdesk):** up to 5 sandbox contacts; a contact must message first, which opens a 24-hour window (resets on every inbound); while your number is in the sandbox list, all sends/webhooks for it go through the sandbox. Remove it from the sandbox list when you move to the real sender. Morning texts only reach people inside their window on sandbox/shared senders.


## 10. Rocco's brain (optional, recommended)
Add `ANTHROPIC_API_KEY` (console.anthropic.com → API keys) in Vercel → redeploy. Turns on: real answers to free-text texts (from the team's own data) and reading screenshots people text Rocco. Model: Claude Opus 5.5 at low effort, with Anthropic's automatic refusal fallback. Without it, Rocco uses rule-based replies, and texted CSV reports still work. Check /api/health → brain.


## 11. Rocco in Slack
1. api.slack.com/apps → Create New App → From an app manifest → paste `docs/slack-manifest.yml` → Create.
2. Basic Information → copy Client ID, Client Secret, Signing Secret → Vercel env `SLACK_CLIENT_ID`, `SLACK_CLIENT_SECRET`, `SLACK_SIGNING_SECRET` → redeploy.
3. Display information → upload `public/rocco-avatar.png` as the app icon.
4. Test: open your Rocco page → Add to Slack → pick a channel. Rocco says hi there; mention @Rocco with "help". Check /api/health → slack: set.
5. Later (for other teams to install): Manage Distribution → activate public distribution (no Slack review needed unless listing in the Slack Marketplace).


## 12. Switch Dodo to the yearly plan with a 3-day trial (Nov 18)
1. Dodo (live mode) → Products → Add product → **Subscription**: name "Hire Rocco", price **$99**, billing **every 1 year**, **free trial 3 days**, tax category SaaS. Save and copy the product id (pdt_…).
2. Vercel → env `DODO_PRODUCT_ID` = that id → redeploy. (The old one-time product stays as legacy; its buyers keep lifetime access.)
3. Dodo → Developer → Webhooks → endpoint `https://rocco.works/api/dodo/webhook`, events: all `subscription.*` and `payment.*`.
4. Test in test mode first if possible: start a trial with a test card → your Rocco page shows "Free trial: 3 days left" and the team gets "🎉 Your 3-day free trial is on". Then text CANCEL → "Cancelled ✅".
5. Check: does Dodo keep an existing subscriber's renewal price when the product price goes up (ladder)? Tell Claude the answer before we promise "your price stays locked".
