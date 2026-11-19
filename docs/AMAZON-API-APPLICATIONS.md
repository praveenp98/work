# Amazon API applications for a text-only Rocco (drafted Nov 17, 2026)

Goal: Rocco gets his own read access (and, later, approved-change access) so sellers can text him without Claude/ChatGPT. Both programs are free; approval can take days to weeks. Menu names change, so follow the current forms; the answers below are ready to paste. Hard rules still apply: no scraping, every change needs explicit approval, is logged and reversible; no Amazon trademarks in our brand.

## 1. Amazon Ads API (advertising.amazon.com → API / "Amazon Ads API" access)
**Steps**
1. Sign in to Amazon Developer with the Rocco business account → **Login with Amazon** → create a **Security Profile** ("Rocco"). Allowed return URL: `https://rocco.works/api/amazon/ads/callback` (we'll build it after approval).
   **Security profile fields (Nov 19):**
   - Name: `Rocco`
   - Description: `Rocco is self-serve software that reads an advertiser's Amazon Ads reports and proposes changes (negative keywords, bids, budgets). Nothing changes without the advertiser's explicit approval; every change is logged and reversible.`
   - Consent Privacy Notice URL: `https://rocco.works/privacy`
   - Consent logo: `https://rocco.works/rocco-avatar.png` (512×512 PNG; shown small on the consent screen)
   - Web Settings (after saving): Allowed Origins `https://rocco.works`; Allowed Return URLs `https://rocco.works/api/amazon/ads/callback` (+ `https://rocco.works/api/amazon/sp/callback` if the same profile is reused for SP-API). Client ID can go in docs/chat; the **Client Secret goes only into Vercel** (`AMAZON_ADS_CLIENT_SECRET`), never chat or git.
   **Status Nov 19:** LWA app "Rocco" created in the Amazon Ads Advanced tools center. Client ID `amzn1.application-oa2-client.3e9494159c67414b9bbe9278d45426ee`; redirect URLs for /api/amazon/ads/callback and /api/amazon/sp/callback saved. Scopes are profile-only so far. The page says "This LWA app doesn't have access to the Amazon Ads API scopes" and "You are not an approved AAPN partner", so **Ads API access is NOT granted yet**. Login with Amazon (name + email) works today; ads data needs the access request approved first. Seller Central data is a separate approval (SP-API, §2).
2. Submit the **Amazon Ads API access request** (apply as a tool provider / third-party application that manages advertising for other businesses).

**Paste-ready answers**
- Company / product: Rocco Works (rocco.works). Self-serve software, no agency services.
- What does your application do? Rocco is an AI teammate for Amazon advertisers. It reads Sponsored Products reports (search terms, campaigns, placements, targets) to find wasted spend and proposes specific changes (negative keywords, bid changes capped at ±20%, budget changes). Every change is shown to the advertiser as an approval list; nothing is changed without the advertiser explicitly approving that specific change. Approved changes are logged with before/after values and can be reverted.
- Who are your users? Amazon sellers, brand owners and agencies managing their own or their clients' Sponsored Products campaigns.
- Which API features? Reporting (v3: spSearchTerm, spCampaigns incl. placement, spTargeting), Sponsored Products campaign/ad group/keyword/target read and update (bids, budgets, negative keywords), profiles.
- Data handling: Tokens encrypted at rest, scoped to the advertiser who authorized; report data used only to produce that advertiser's recommendations; anonymized, aggregated metrics may be used for benchmarks; advertisers can disconnect and delete their data at any time.
- Expected volume: up to a few hundred advertisers in the first months; daily report pulls per advertiser.

## 2. Selling Partner API (Seller Central → Partner Network → Develop Apps / Solution Provider Portal)
**Steps**
1. Register as a **public developer** (we'll serve other sellers). Complete the developer profile and the data protection / security questionnaire.
2. Request roles (no restricted PII roles needed):
   - **Selling Partner Insights** (Sales & Traffic / Business Reports)
   - **Inventory and Order Tracking** (inventory levels; no buyer PII)
   - **Amazon Fulfillment** (FBA inventory, restock data)
   - **Product Listing** (read listing title/bullets/backend for keyword gaps)
3. Create the app (OAuth redirect `https://rocco.works/api/amazon/sp/callback`), then publish to the Appstore later.

**Paste-ready answers**
- Use case: Rocco analyzes a seller's sales & traffic, inventory/restock and listing content to (1) flag ASINs with traffic but poor conversion or lost buy box, (2) warn before stockouts and adjust advertising pressure, (3) suggest listing keywords from converting search terms. All suggestions are presented for the seller's approval; Rocco does not modify listings without explicit approval.
- PII: Rocco does not need or request buyer personally identifiable information.
- Security: HTTPS only; LWA refresh tokens encrypted at rest (AES-256), least-privilege access, access logs, data retained only while the seller is connected; deletion on request.

## 3. After approval (Claude builds)
- OAuth connect buttons for Amazon Ads + Seller Central on rocco.works (tokens encrypted in Supabase).
- Rocco pulls data himself → the text channel can answer "how are my ads?" and apply approved codes directly (still approval-gated, logged, reversible).
