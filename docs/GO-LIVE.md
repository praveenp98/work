# Go-live checklist: rocco.works (Nov 17, 2026)

The code is ready. These steps need Praveen's accounts. Each one says which env var it fills (see `.env.example`).

## 1. Deploy (15 min)
1. vercel.com → Add New Project → import `praveenp98/work` (framework: Next.js, root: repo root). Production branch: `main`.
2. Settings → Domains → add `rocco.works` and `www.rocco.works` (redirect www → apex). At the registrar, set the DNS records Vercel shows (A `76.76.21.21` for apex, CNAME `cname.vercel-dns.com` for www, or switch nameservers to Vercel).
3. Env var: `NEXT_PUBLIC_SITE_URL=https://rocco.works`.

## 2. Hackathon / TrustMRR tracker (must be live BEFORE any traffic, rule 5)
- Copy the tracker script from the TrustMRR / hackathon dashboard. Put its `src` in `NEXT_PUBLIC_TRACKER_SRC` and the site id in `NEXT_PUBLIC_TRACKER_SITE_ID`. Redeploy. If the snippet uses a different attribute name than `data-site-id` / `data-website-id`, tell Claude and it'll adjust `components/Tracker.tsx`.
- Verify: open rocco.works → view source → script tag present → visit shows in dashboard.

## 3. Payments: Polar (USD)
1. polar.sh → new organization "Rocco". Connect payouts.
2. Create 4 one-time products: Holiday Pass $99, Seller Lifetime $149, Pro Lifetime $299, Agency Lifetime $399.
3. On each product add the **License Keys** benefit (prefix `ROCCO`, no expiry; Holiday Pass expiry Jan 31, 2027).
4. Create a checkout link for each → paste into `NEXT_PUBLIC_POLAR_HOLIDAY_URL`, `_SELLER_URL`, `_PRO_URL`, `_AGENCY_URL`. Success URL: `https://rocco.works/tools/ad-roast?bought=1`.
5. `POLAR_ORGANIZATION_ID` = org id (Settings). `POLAR_ACCESS_TOKEN` not needed yet.
6. Connect Polar to TrustMRR so revenue is verified.
- Razorpay (INR) later only if Indian buyers show up.

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
- Google Search Console + Bing Webmaster: add property, submit `/sitemap.xml`.
- Test a real purchase with a Polar test/discount code → paste key in the Ad Roast unlock box → fixes unlock.

## Local dev
```bash
npm install
npm run dev     # http://localhost:3000
npm test        # rules + parsers unit tests
```
