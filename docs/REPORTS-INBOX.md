# Rocco's report inbox (outside the US / no Claude) — built Nov 19, 2026

**What it is:** each team gets `<code>@in.rocco.works`. Sellers schedule Amazon's own report emails (Ads console → Reports → Schedule) to it once. Every email is read by `/api/inbound/email`. Attachments (CSV/TSV/XLSX/.gz) go through the same engine as Claude. The team gets the morning text/Slack. Approved fixes come with exact Ads console clicks; the team taps "I've made this change" (or texts DONE N1) and Rocco checks the result when the next reports land.

**Who sees it:** visitors outside the US (Vercel `x-vercel-ip-country`), or anyone who picks it. Switch: `rocco.works/api/region?r=intl` or `?r=us`. A team can also switch on its setup page ("No Claude? Have Amazon email me…").

**Rules kept:** Rocco never logs in to Amazon. Download links in emails are followed only if they are pre-signed file links (S3/CloudFront signatures). An email with only a sign-in link → Rocco texts the team to set delivery to "attach file", or to forward the file. No scraping (hard rule 6).

## Setup (Praveen) — pick ONE way to receive email on `in.rocco.works`

### A. Cloudflare Email Routing (free) — if rocco.works DNS is on Cloudflare (or you move it there, also free)
1. Cloudflare → rocco.works → Email → Email Routing → enable for subdomain `in.rocco.works` (Cloudflare adds the MX/TXT records).
2. Workers & Pages → Create → Worker → paste `workers/email-inbound.js` → Deploy. Variables: `ROCCO_URL` = `https://rocco.works/api/inbound/email`, `ROCCO_INBOUND_SECRET` = a long random string.
3. Email Routing → Routing rules → Catch-all for `in.rocco.works` → Action "Send to a Worker" → the worker.

### B. Postmark inbound (paid after the free dev tier; ask before spending)
1. Postmark → Server → Inbound stream → Inbound domain `in.rocco.works`; add the MX record Postmark shows (`inbound.postmarkapp.com`).
2. Webhook URL: `https://rocco:<ROCCO_INBOUND_SECRET>@rocco.works/api/inbound/email`. Include raw email content: off (JSON is fine).

### Then (both)
- Vercel env: `ROCCO_INBOUND_SECRET` (same string as above, never in chat), optional `ROCCO_INBOX_DOMAIN` (default `in.rocco.works`). Redeploy.
- Test: email any CSV from the fixtures to your team's inbox address (setup page shows it). The setup page's step 4 turns to "Got your first report 🎉" within seconds.

## Praveen's test from India (full flow)
1. Open rocco.works (shows the email-reports version automatically from India). Hire Rocco → Continue with Google → your Rocco page shows "Your Rocco inbox".
2. Ads console → Measurement & Reporting → Sponsored ads reports → Create report → Sponsored Products · Search term · Daily · Last 30 days → Schedule daily → add the inbox address → Run report. (Menu names vary by marketplace; record the exact path you see so we fix the copy.)
3. While waiting: setup step 3 lets you drop a Seller Central file (Business Report by child item, FBA inventory).
4. When the email lands: does it **attach** the file or only **link** to it? If link-only, note the link's host; we decide next steps from that.
5. Approve the free top fix → follow the "How" steps → tap "I've made this change". A week later the next report grades it.

## Known limits (honest)
- Seller Central doesn't email most reports: sales/stock files are a weekly manual forward/upload.
- Zip attachments aren't read yet (CSV/XLSX/GZ are).
- Bulk uploads need campaign IDs that report emails don't carry, so changes are made by hand (exact clicks given).
