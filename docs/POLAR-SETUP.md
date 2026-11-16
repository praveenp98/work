# Polar setup for Rocco Works (Nov 17, 2026)

All plans are **one-time payments** (count in full for the contest). The Holiday Pass is also one-time; our app ends access on Jan 31, 2027. No subscriptions for now.

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
