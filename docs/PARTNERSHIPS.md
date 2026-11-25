# Partnerships: borrow distribution from people who already have sellers (Nov 25, 2026)

Rocco has no audience. Partners do. The plan: find people US Amazon sellers already trust, give them a reason to send sellers to Rocco, and pay only when a seller pays.

## The offer (one, simple)

- **20% of the first payment** for every seller a partner sends who stays past the 14-day guarantee.
  - Yearly plan (2,790) → partner gets about 837. Rocco keeps about 1,950.
  - Monthly plan (279) → partner gets about 84.
- Paid by Praveen after day 8, by Wise or PayPal. **Every payout is a marketing cost: log it** (hard rule 4).
- The partner's sellers get something too: the free tools, and a partner code so the partner can see who came from them.
- Agencies can also use Rocco on their own clients (see "agencies" below).
- No retainers, no upfront fees, no paid posts before a sale. Anything paid upfront is ad spend and comes off profit.

Why 20% of the first payment: big enough to matter for a yearly sale, small enough that each sale is still clearly profitable, and simple to explain in one line. Change it only after the first 5 partners.

## Who to partner with (in order)

| # | Partner type | Why they'd say yes | What you give them | Realistic by Dec 16 |
|---|---|---|---|---|
| 1 | **Small PPC freelancers and agencies** (1 to 30 clients, US sellers) | Rocco does the daily grind (negatives, bids, stock checks); they keep the client and the strategy, and can take more clients | 20% referral, or use Rocco on their clients; the Agency Audit tool as client reporting | best odds: 2 to 5 partners, 3 to 15 sellers |
| 2 | **Your warm network** (past clients, seller friends, ex-colleagues) | they know you | ask each for 2 intros, not a sale | 1 to 5 sellers |
| 3 | **Tools sellers already pay for that don't compete** (DataDoe, accounting/profit tools, review or inventory tools, prep centers, 3PLs, freight forwarders) | a useful add-on for their customers, no cost | co-written guide or webinar, listing on each other's partner/integrations page, referral | slower; 0 to 3 sellers |
| 4 | **Seller community owners** (paid Facebook/Discord/Slack groups, masterminds, newsletters, small YouTube channels for sellers) | a free perk for their members (the free tools, a live account review session) | 20% referral; a members-only "free money leak check" session | 1 to 5 sellers |
| 5 | **Amazon courses and coaches** | their students graduate and need to run ads | perk for alumni | mostly beginners: low odds at 279 a month |
| 6 | **Higgsfield** (prize sponsor) | content showing Higgsfield helping Amazon sellers | free content tagged @higgsfield_ai; no money before Dec 16 | reshare only |

Skip: big agencies (slow, will see Rocco as a threat), anyone who wants an upfront fee, anyone who wants a "paid post" before results.

## Agencies: what to say and what not to

- Lead with time: "Rocco does the daily account work so you can take on more clients." Not "replace your team".
- Show the Agency Audit tool as something they run *for* clients. **Don't send them "Could I Fire My Agency?"**
- Give them a free trial on one of their own client accounts (with the client's permission). If it doesn't save them hours in a week, they walk.
- Self-serve only (hard rule 2): partners refer and use the software. Rocco doesn't do services for them.

## How to find 30 targets this week

- LinkedIn search: "Amazon PPC" + freelancer / consultant / agency, US clients, under 50 employees. Check they post about Amazon ads recently.
- X: people who post Amazon PPC tips and reply to sellers.
- Agencies listed on Amazon's partner directories and the Selling Partner Appstore categories (ads, inventory, accounting).
- Seller newsletters and podcasts: look at who sponsors them. Those sponsors are often tools that would partner too.
- Your own past contacts first.

Keep a list in a sheet: name, type, link, why them, date contacted, reply, next step.

## The outreach (Praveen writes and sends every message himself)

No template blast. Each message is personal and short:
1. Something specific you noticed about them (a post, a client type, a tool they use).
2. One line on what Rocco does for *their* sellers or *their* time.
3. The offer in one line (20% of the first payment, or a free trial on one client).
4. One easy ask: "worth a 10-minute look at the demo?" with the demo video link.

10 personal messages a day for 10 days = 100 conversations. Expect 10 to 20 replies and 3 to 6 real partners. Follow up once after 3 days, then stop.

## Tracking (built Nov 25: /partners, /admin/partners)

Pages: `/partners` (hub + apply form), `/partners/agencies`, `/partners/tools`, `/partners/communities` (indexable, static), `/p/<code>` (the partner's own page: noindex, canonical `/`, only for approved codes, anything else redirects home). All copy and the share live in `lib/partners.ts` (`PARTNER_SHARE = 0.20`, confirmed by Praveen Nov 25). Never link "Could I Fire My Agency?" from a partner page (a test checks this).

How a sale is tracked:
1. A seller opens `rocco.works/p/<code>` or any page with `?partner=<code>`. `proxy.ts` sets the first-party cookie `rocco_partner` (httpOnly, 60 days) only if the code belongs to an approved partner, and never replaces an existing one (first partner wins). `?partner=` links redirect to the clean URL.
2. When the seller signs up (Google, the Hire sheet, or their Rocco page), the code is saved on the team (`workspace.partner`), only before the first payment.
3. Both checkout links (yearly and monthly, `hireUrl`) carry it to Dodo as `metadata_partner` → `metadata.partner` on the payment and subscription. Not `ref`: that key is the workspace id.
4. The Dodo webhook (and /welcome) run `lib/billing.ts`: on a succeeded payment it keeps the code on the team and writes one `partner_referrals` row per team (payment id, plan, USD amount, paid_at, guarantee_ends_at = paid_at + 14 days (GUARANTEE_DAYS), payout `due`). Replays and renewals are ignored. A refund or dispute marks the row refunded and the payout `void`.
5. /admin/funnel shows the visits, checkouts and sales under `partner:<code>`. PostHog gets `partner_landing_viewed`, `partner_applied`, `partner_checkout_started`, `partner_sale` (with the code).

Supabase: run `supabase/migrations/006_partners.sql` (also appended to `supabase/setup.sql`) before the first partner goes live. Until then applications still land in /admin/leads as `partner-apply`, but no codes or referrals are stored.

## How Praveen approves and pays

- Applications arrive on `/admin/partners` (pending, at the top) and in `/admin/leads` (lead magnet `partner-apply`). Sign in first at `/admin/login?key=<CRON_SECRET>`.
- Approve only after the partner has agreed to have their name on their `/p/` page. Approving creates the code (from their name) and shows their link. Email it to them yourself. Pause stops new referrals (sales already tagged still count).
- Agency trial on one client account: after approval, grant it with `/api/admin/tester?key=…&email=<their email>` once they confirm the client agreed. It never counts as a sale.
- "Payouts due" lists sales past the 14-day guarantee and not refunded, with the amount at the partner's share. Pay by Wise or PayPal, then "Mark paid" (amount + date). **Then log it as a marketing cost** in `docs/PROGRESS.md` / `marketing_costs` (hard rule 4).
- Links from rocco.works to a partner's site use `rel="sponsored noopener"`. Partners are told to mark their Rocco links `rel="sponsored"`. Never trade anything for a followed link.

## The honest maths

- Goal 100k ≈ 36 yearly plans. Partners won't get there alone either.
- A good partner week: 3 to 6 partners live, each sending 1 to 3 sellers by Dec 16 → 5 to 15 sales. If most are yearly, that's about 14 to 42k in revenue before partner payouts.
- So partnerships plus warm network plus direct personal outreach plus launch sites is the realistic mix. Start today: every day of delay costs more than any feature.
