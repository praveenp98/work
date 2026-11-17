# Dodo Payments setup for Rocco (Nov 17, 2026)

**Why Dodo:** Polar/Stripe don't onboard Praveen as an individual in India. Dodo Payments is a merchant of record that works for individuals, and TrustMRR verifies revenue with a Dodo API key (rule 5 OK). Polar products created earlier are unused; archive them in Polar.

All plans are **one-time payments** (count in full for the contest).

## 1. Products (Dodo dashboard → Products → Create)
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
