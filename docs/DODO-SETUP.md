# Dodo Payments setup for Rocco (Nov 17, 2026)

**Why Dodo:** Polar/Stripe don't onboard Praveen as an individual in India. Dodo Payments is a merchant of record that works for individuals, and TrustMRR verifies revenue with a Dodo API key (rule 5 OK). Polar products created earlier are unused; archive them in Polar.

All plans are **one-time payments** (count in full for the contest).

## Status (Nov 17, single plan — done by Claude via the Dodo API)
- **One live product: "Hire Rocco"** (renamed Nov 17 from Rocco Founding Lifetime) `pdt_0Ns7dcv01gDgTlIQC1O1b`, starts $99 one-time, license keys ON, tax category SaaS. Default in `lib/payments.ts`.
- The 4 earlier products (Holiday/Seller/Pro/Agency) are **archived**.
- **Price ladder:** +$10 every 5 sales, cap $499 (`lib/pricing.ts`). The site counts succeeded payments from the Dodo API and PATCHes the product price automatically (on page render, cached 60s, and on every Dodo webhook).
- **Praveen must add in Vercel:** `DODO_API_KEY` (same key; server-only). Without it the site shows $99 and the price never steps up.
- **Praveen must add in Dodo → Webhooks:** endpoint `https://rocco.works/api/dodo/webhook`, events payment.succeeded (+ refund events). The body isn't trusted; it only triggers a re-count.
- Verified live from the sandbox: payments count (0), price read, sync, license check (fake key rejected).
- Left: KYC/payouts (in review ~72h), support email on the business, one real purchase + refund, TrustMRR connection.

## 1. Products (reference)
| Product | Price (USD, one-time) | License keys | Env var for its product ID |
|---|---|---|---|
| Rocco Holiday Pass | $99 | ON, expiry **75 days** (≈ through Jan 31, 2027 from a Nov 17 purchase) | `DODO_PRODUCT_HOLIDAY` |
| Rocco Seller (Founding Lifetime) | $149 | ON, no expiry | `DODO_PRODUCT_SELLER` |
| Rocco Pro (Founding Lifetime) | $299 | ON, no expiry | `DODO_PRODUCT_PRO` |
| Rocco Agency (Founding Lifetime) | $399 | ON, no expiry | `DODO_PRODUCT_AGENCY` |
Description footer on each: "Self-serve software. Not affiliated with Amazon."
Activation limit: leave unlimited (Rocco checks keys with `/licenses/validate`, not activations).

## 2. Wire it up
- Copy each product's ID (`pdt_…`) into Vercel env vars above. IDs aren't secret, so you can also paste them in chat and Claude will set them as defaults in code.
- `DODO_MODE=live` (use `test` with test-mode products while trying it out; it switches checkout to test.checkout.dodopayments.com and validation to test.dodopayments.com).
- Checkout = static payment link `https://checkout.dodopayments.com/buy/<pdt_id>?quantity=1&redirect_url=https://rocco.works/thanks?plan=<plan>`, built by `lib/payments.ts`. Pricing page buttons switch on automatically once IDs are set.
- License check = public `POST https://live.dodopayments.com/licenses/validate {license_key}` → `{ valid }`. No API key needed; used by the website unlock box and the MCP `activate_license` tool.

## 3. Before taking money
- Complete Dodo KYC + payout (bank account) so payouts work.
- Test purchase in test mode with a test card → receipt email shows a license key → paste it in Rocco (`activate_license` in chat, or the Ad Roast unlock box) → unlocks.
- Connect Dodo to TrustMRR (Dodo API key, read-only) so revenue counts as verified.
- Optional later: webhook `payment.succeeded` → auto-email onboarding (not needed for v1).

## Price steps (real deadlines)
Edit prices on Nov 27, Dec 1 and Dec 16 (Praveen approves each change).


## Product copy for the yearly "Hire Rocco" product (Nov 19, paste into Dodo)
The live checkout still shows the OLD one-time product (₹9,615 ≈ $99, "for life", "Claude/ChatGPT", "every 5 sales"). Create the subscription product and set `DODO_PRODUCT_ID`; until then every checkout uses the legacy one.
- **Name:** Hire Rocco: your AI Amazon manager (1 year)
- **Description:** A senior Amazon manager for your whole team, working inside Claude with Amazon's official connectors. Every morning: your numbers and the fixes worth making across ads, stock and listings. Your team approves with a reply; nothing changes without a YES. Rocco remembers every change and checks a week later if it worked. Unlimited teammates and brands. Renews yearly, cancel anytime. Self-serve software, not affiliated with Amazon.
- Pricing: $99 USD, recurring every 1 year, no trial. Tax category: SaaS / digital. Turn off the license-key entitlement (not used any more).
- **Brand (Dodo → Settings → Business / Branding):** logo = https://rocco.works/rocco-avatar.png, business name Rocco, brand color #1f6feb, support email hello@rocco.works. The checkout layout itself is Dodo's; logo, name, color and light/dark are what we can set.
