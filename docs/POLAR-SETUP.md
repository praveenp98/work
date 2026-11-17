> **OBSOLETE (Nov 17, 2026):** Polar can't onboard Praveen as an individual. Payments moved to Dodo Payments: see `docs/DODO-SETUP.md`. The Polar products/links below are unused; archive them.

# Polar setup for Rocco Works (Nov 17, 2026)

All plans are **one-time payments** (count in full for the contest). The Holiday Pass is also one-time; our app ends access on Jan 31, 2027. No subscriptions for now.

## Status (Nov 17, done by Claude via the Polar API)
| Product | Product ID | Checkout link | License benefit |
|---|---|---|---|
| Rocco Holiday Pass $99 | 707abd33-9580-4875-a5cb-06c1d471f05b | https://buy.polar.sh/polar_cl_xFaeeeQBVapSGg4eRy0AfHgIhKuD066ru50cO1vEiIP | `ROCCOHP-…` (3-month key; app also cuts off after Jan 31, 2027) |
| Rocco Seller $149 | 681186b6-5c51-4e60-ad20-1cd79d831c08 | https://buy.polar.sh/polar_cl_i1r1t9j8SgizSGDc5nXDqjNIC8jojbui1Ibya2PhxaT | `ROCCO-…` lifetime |
| Rocco Pro $299 | f3f34adb-48f7-4235-a361-e12202ee7dd1 | https://buy.polar.sh/polar_cl_KXQXBEVpNgvJ1smteiVMg55nWdka5QbePV3vx0farTi | `ROCCO-…` lifetime |
| Rocco Agency $399 | deb74c65-bc65-41eb-b10d-8c95848d1f34 | https://buy.polar.sh/polar_cl_HV03fPpXHq2EvjJvCW7aWEQZNctNQXimD2zN83WLaG1 | `ROCCO-…` lifetime |
- Org ID 1098166b-7605-4f08-aa7c-2800c1ca5d21 (default in `lib/polar.ts`). Benefits: lifetime 0b2ab254-2283-4d9a-a010-ee2c49b9ad88, holiday 3ea385ab-8d46-4b97-a552-f14e5e8dae15.
- Checkout links are hard-coded defaults in `lib/site.ts` (env vars still override). Success URL: `https://rocco.works/thanks?plan=…&checkout_id={CHECKOUT_ID}`. Discount codes allowed.
- Polar org token saved as a network secret on the cloud environment (never in the repo or chat). Scopes used: products, benefits, checkout links.
- Still to do by Praveen: payout account (step 3), a $1 test purchase with a 100% discount code, `FOUNDER20` code (step 6), TrustMRR connection (step 8).

## Products to create
| Product name | Price (USD, one-time) | Description (shown at checkout) | Metadata |
|---|---|---|---|
| Rocco Holiday Pass | $99 | All Rocco tools for 1 brand until Jan 31, 2027: Ad Roast fixes, Coupon Planner, BFCM Surge Plan, Post-Mortem, Listing Roast. | plan=holiday, brands=1, expires=2027-01-31 |
| Rocco Seller (Founding Lifetime) | $149 | Rocco for 1 brand, forever. Every tool, the Claude/ChatGPT connector, Monday brief. | plan=seller, brands=1 |
| Rocco Pro (Founding Lifetime) | $299 | Rocco for up to 5 brands, forever. For freelancers and VAs. | plan=pro, brands=5 |
| Rocco Agency (Founding Lifetime) | $399 | Rocco for up to 20 brands, forever, with white-label roast reports. | plan=agency, brands=20 |
Footer text in every description: "Not affiliated with Amazon."

## Steps
1. Sign up at polar.sh (Google/email). Create organization **"Rocco Works"**, slug `roccoworks`, support email on the new domain.
2. **Practice in sandbox first:** sandbox.polar.sh, same products, test card 4242 4242 4242 4242.
3. **Payout account:** Settings → Finance → connect Stripe Connect Express as an **individual in India** with your **Indian bank account in INR** (Wise/Payoneer/Revolut are usually rejected). Polar is merchant of record, so Stripe being invite-only in India doesn't matter.
4. **Products → New product** for each row above: name, description, pricing = **One-time**, fixed price, currency USD. Add the metadata.
   **Benefit (required, the app unlocks with it):** add a **License Keys** benefit, prefix `ROCCO`, no expiry; on the Holiday Pass set expiry **Jan 31, 2027**.
5. **Checkout Links → Create** one per product. Success URL: `https://rocco.works/tools/ad-roast?bought=1`. Turn on "allow discount codes." Paste the links into Vercel env vars `NEXT_PUBLIC_POLAR_HOLIDAY_URL`, `NEXT_PUBLIC_POLAR_SELLER_URL`, `NEXT_PUBLIC_POLAR_PRO_URL`, `NEXT_PUBLIC_POLAR_AGENCY_URL`, and set `POLAR_ORGANIZATION_ID` (Settings).
6. **Discounts:** create `FOUNDER20` (20%, limited redemptions) for early X/LinkedIn supporters; affiliate codes later.
7. **Later, not needed for v1:** access token + webhook (order.paid, order.refunded) once the Brain MCP needs server-side plan checks.
8. **TrustMRR:** connect Polar (read-only key) so revenue is verified; install the hackathon tracker on every page.
9. **Account review:** have the live site show product, pricing, Terms, Privacy, Refund policy and contact email before sending traffic.

## Price steps (real deadlines)
Edit prices on Nov 27, Dec 1 and Dec 16 (Praveen approves each change). Founding seat counter on the site.

## INR buyers
Razorpay for INR (later), also connected to TrustMRR.

## ⚠️ Blocker found (Nov 17, 09:55): Indian individuals can't take international payments via Polar's Stripe payout account
Stripe India allows international payments only for registered businesses (sole proprietorship, LLP, company), not individuals. Polar payouts run through Stripe Connect Express, so the "Individual" type is blocked.

**Options**
1. **Switch to Dodo Payments (recommended now):** Merchant of Record built for Indian founders; onboards unregistered individuals for international payments (identity + business verification forms). Supported by TrustMRR. Needs a code swap (checkout links + license-key unlock).
2. **Get Udyam (MSME) registration** (free, online with Aadhaar + PAN) → re-onboard Polar/Stripe as a **Sole Proprietorship** (Stripe accepts the Udyam certificate). Slower; may also need an IEC code and a bank account matching the business.
Decision pending from Praveen. Doing 1 now and 2 in parallel as backup is the safest path.
