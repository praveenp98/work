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

## 2. Hackathon / TrustMRR tracker (must be live BEFORE any traffic, rule 5)
- Copy the tracker script from the TrustMRR / hackathon dashboard. Put its `src` in `NEXT_PUBLIC_TRACKER_SRC` and the site id in `NEXT_PUBLIC_TRACKER_SITE_ID`. Redeploy. If the snippet uses a different attribute name than `data-site-id` / `data-website-id`, tell Claude and it'll adjust `components/Tracker.tsx`.
- Verify: open rocco.works → view source → script tag present → visit shows in dashboard.

## 3. Payments: Polar (USD) ✅ mostly done
Products, license-key benefits and checkout links are set up and wired into the site (see `docs/POLAR-SETUP.md` → Status). No Polar env vars needed on Vercel.
Left for Praveen: payout account, a test purchase (100% discount code) to see the license email and unlock flow end to end, and connecting Polar to TrustMRR.

## 4. Waitlist: Supabase (5 min)
SQL editor:
```sql
create table waitlist (email text primary key, source text, created_at timestamptz default now());
alter table waitlist enable row level security; -- server uses the service role key, no public policies
```
Fill `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (server-only, never `NEXT_PUBLIC_`).

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
