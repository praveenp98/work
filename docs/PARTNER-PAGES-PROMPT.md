# Prompt: build partner pages + referral tracking on rocco.works

Paste everything below the line into the Claude Code chat that builds rocco.works.

---

Build the partner program pages and referral tracking for rocco.works. Read `CLAUDE.md`, `docs/PROGRESS.md` (top entries), `docs/PARTNERSHIPS.md` and `docs/GTM-PLAYBOOK.md` (channel 8) first. Follow every hard rule in CLAUDE.md.

## Goal

Partners (small Amazon ads freelancers and agencies, non-competing seller tools, seller community and newsletter owners) send US Amazon sellers to Rocco. A partner earns a share of the seller's first payment, paid by Praveen by hand after the 14-day money-back period. Partners apply, Praveen approves each one, and every sale is tracked to the partner who sent it.

## Pages (keep it to these; no page per partner type unless listed)

1. `/partners`: the hub. What the program is, who it's for, the offer, how payouts work, FAQ, apply form. Indexable.
2. `/partners/agencies`: for Amazon ads freelancers and agencies. Message: Rocco does the daily account work (negatives, bids, budgets, stock checks) so they can take on more clients; they keep the client and the strategy. Offer a trial on one client account, with that client's permission. Link the Agency Audit free tool as client reporting. **Never link or mention the "Could I Fire My Agency?" tool on any partner page.** Indexable.
3. `/partners/tools`: for seller tools, prep centers, 3PLs and freight forwarders that don't compete with Rocco. Offer: a guide written together, a spot on each other's partner pages, the referral share. Indexable.
4. `/partners/communities`: for owners of seller communities, newsletters and small YouTube channels. Offer: a free "money leak check" for their members (link the existing free tools) plus the referral share. Indexable.
5. `/p/[code]`: the landing page a partner shares. Short: "<Partner name> recommends Rocco", what Rocco does, the free tools, Hire Rocco. Sets the referral (see tracking). **noindex**, canonical to `/`. Only renders for approved codes; anything else redirects to `/`.

No page for the warm network (Praveen sends personal links instead) and none for Higgsfield (content only, no money before Dec 16).

All copy for these pages lives in one data file (`lib/partners.ts`), rendered by shared components, like `lib/magnets.ts` / `lib/compare.ts`.

## The offer (config, not hard-coded)

- `PARTNER_SHARE` constant in `lib/partners.ts`, default `0.30` of the first payment. Praveen hasn't confirmed 30%: put a `// TODO(Praveen): confirm` next to it and show the value from the constant on every page.
- Paid only after the seller is past the 14-day guarantee and hasn't refunded. Paid by Praveen by Wise or PayPal. Say this plainly on the pages.
- No upfront fees, no paid posts, no retainers.

## Referral tracking

- `?partner=CODE` on any rocco.works URL, and `/p/CODE`, set a first-party cookie `rocco_partner` (60 days, first partner wins, only if the code is approved). **Do not use `ref`: `lib/billing.ts` already uses `metadata.ref` for the workspace id.**
- Pass the partner code into Dodo checkout metadata as `partner` on both yearly and monthly links. Check that it survives to the Dodo webhook / `lib/billing.ts`, and store it on the workspace and the payment.
- Supabase tables (migration file in `supabase/migrations/`, numbered after the latest one): `partners` (code, name, type: agency | tool | community | other, email, website, share, status: pending | approved | paused, created_at) and `partner_referrals` (partner code, workspace id, plan, amount, paid_at, guarantee_ends_at, refunded, payout_status: due | paid | void, payout_paid_at, payout_amount).
- Apply form on `/partners` writes a pending partner (name, email, website, type, how many US sellers they reach, how they'd share Rocco) to `partners` and fires the existing lead/notify path so Praveen sees it. **No call booking.** Rate-limit and validate it like the other forms.
- `/admin/partners` (same auth as /admin/funnel): approve or pause a partner (generates the code), list referrals, show payouts due (guarantee passed, not refunded), a "mark paid" button that records payout amount and date. Show a reminder that each payout is a marketing cost to log (CLAUDE.md hard rule 4).
- PostHog events: `partner_landing_viewed`, `partner_applied`, `partner_checkout_started`, `partner_sale` with the code. Add the partner to /admin/funnel sources.

## Links: nofollow, sponsored, "dofollow"

- Any link from rocco.works to a partner's site (logo strip, "our partners", a co-written guide) gets `rel="sponsored noopener"`, because there's a commission relationship.
- Partner landing pages and referral links are noindex. Tell partners on `/partners` that links to Rocco with their code are referral links and should be marked `rel="sponsored"` (Google's rule for paid and affiliate links). Never offer anything in exchange for a followed link.
- Don't show a partner's name or logo anywhere public until Praveen marks them approved and they've agreed. Don't claim a partnership with DataDoe, Higgsfield or anyone else that doesn't exist yet.

## Keep the site light

- All partner pages are server-rendered and static (SSG / `generateStaticParams` for the 4 hub pages; `/p/[code]` reads the partner on the server). No new client libraries. The only client JS is the apply form.
- Reuse existing components and CSS. No new fonts. Images through `next/image`, small.
- Register the 4 indexable pages in `lib/tools.ts` / sitemap / llms.txt as the conventions say. Not `/p/*`, not `/admin/*`.
- Run the build and report the per-route First Load JS for the new routes in the PR/commit notes. If any new route is noticeably heavier than `/pricing`, fix it before shipping.

## Copy rules

- Run `node marketing/scripts/lint-copy.mjs` on any new copy; plain words, no em dashes, no invented numbers or results, no fake testimonials, no partner logos without permission.
- Rocco has three modes (approve every move by default, inside guardrails, or fully autonomous). Don't say it always asks before changing anything.
- Self-serve only (hard rule 2): partners refer and use the software. No "done for you", no calls.
- The hackathon tracker must be on every new page (hard rule 5).

## Tests and docs

- Unit tests: code validation, cookie first-wins, metadata passthrough, payout due only after 14 days and not refunded, unknown code redirects.
- Fixture-test the Dodo webhook path with a `partner` in metadata.
- Update `docs/PARTNERSHIPS.md` (how tracking works, how Praveen approves and pays), add a `CLAUDE.md` row, add a `docs/PROGRESS.md` entry, add a `docs/DECISIONS.md` line for the `partner` metadata key. Push to `main`.

## Ask Praveen before

- Changing the 30% default or anything about pricing.
- Showing any partner's name or logo.
- Sending any email to partners or leads.
