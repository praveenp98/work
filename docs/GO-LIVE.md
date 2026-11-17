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
1. supabase.com → New project (free tier is fine).
2. SQL editor → run `supabase/migrations/001_rocco_memory.sql` (workspaces, snapshots, runs, actions).
3. SQL editor → waitlist table:
```sql
create table if not exists waitlist (email text primary key, source text, created_at timestamptz default now());
alter table waitlist enable row level security;
```
4. Vercel env vars (server-only, never `NEXT_PUBLIC_`): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`. Redeploy.
5. Test: rocco.works → "Get my personal Rocco" → add that URL in Claude → "Rocco, brief me".

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
