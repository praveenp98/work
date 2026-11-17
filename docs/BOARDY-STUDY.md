# Boardy study → "Text Rocco" (Nov 17, 2026)

## How Boardy grew (sources: EO Magazine, Spark of Ages podcast, Blastra, RoundFunded)
- No app, no dashboard: conversations by phone call, WhatsApp, email; "you don't have an app for your friends." Multi-platform (LinkedIn, X, iMessage, WhatsApp).
- Built-in loop: every double-opt-in intro exposes Boardy to a new person who becomes a user.
- Personality + founder-led demos (TWiST live demo), saturation on SF social feeds.
- Free for most users; Boardy Pro $100/mo.
- Reported scale (conflicting): "a few thousand" at Oct 2024 launch → 168K people / 116K intros (site, via podcast) → 237K people, ~1,500 intros/day (EO Magazine). Treat as self-reported.

## What it means for Rocco
- Copy now: one-screen, conversational homepage ("Meet Rocco. Text him.").
- Constraint: Rocco has no Amazon data access of his own; today the seller's AI (Claude/ChatGPT) pulls data via Amazon's connectors. A fully text-only Rocco needs our own Amazon Ads API + SP-API apps and seller sign-in (approval: days to weeks).
- Buildable in the contest window: "Rocco texts you, you reply to approve". Daily brief by message; reply "YES N1 N2" → approvals stored in memory → the seller's AI applies them next time ("morning check"). Daily habit without Amazon access.
- Channels: iMessage via a paid relay (no Apple approval), US SMS (slow 10DLC registration), WhatsApp (Meta business verification), Telegram (instant, free, not where US sellers are).
- Rocco's Boardy-style loop: agency client reports + wins cards carry "Text Rocco".

## Decisions pending (Praveen)
1. Text channel to start with (and OK to pay for the provider).
2. Apply now for Amazon Ads API + SP-API developer access (Praveen's account, free) so a text-only Rocco can follow.

## iMessage cost (Nov 17, from comparison sites; confirm on providers' pricing pages)
- Sendblue: ~$100/mo per line for an inbound-only AI-agent tier; outbound needs a custom quote (reported $50–$1,000+/line).
- LoopMessage: plans quoted from ~$60–$99/mo; number $15/mo + $15 once; new-contact outbound add-on ~$30/mo; shared sender for AI assistants ~$20/mo.
- Blooio: shared number from ~$39/mo; dedicated line ~$289/mo. Photon: ~$250/line/mo.
- Contest note: this is software cost, not paid marketing (rule 3), so it doesn't reduce contest profit; still Praveen's approval needed before spending.

## Decision (Praveen, Nov 17): will apply for Amazon Ads API + SP-API today → `docs/AMAZON-API-APPLICATIONS.md`. Text channel: pending cost review.

## iMessage infrastructure checklist (Nov 17)
LoopMessage $59/mo (unlimited messages, 300 active contacts) = the messaging line only. Full setup:
- LoopMessage plan (Praveen) · link-by-text signup (user texts "Hi Rocco, link CODE" first → phone↔workspace, avoids outbound-first add-on) · inbound webhook + reply sender · commands (brief, YES N1 N2, undo, wins, help, STOP) · approval queue surfaced in rocco_brief so the seller's AI applies text-approved codes · daily brief scheduler (Vercel Cron) · Supabase tables (phones, opt-outs, message log) · email fallback for Android · optional Anthropic API key for free-form questions · live data by text after Amazon API approval.
- To verify at signup: outbound-first allowed on $59? SMS/Android fallback? shared vs own sender number? does "active contacts" reset monthly?

## Built (Nov 17)
- One-screen homepage: "Text Rocco about your Amazon business." Big blue Text Rocco button (sms: link once `NEXT_PUBLIC_ROCCO_IMESSAGE` is set; until then captures phone/email to the waitlist as `tel:+…`), iPhone iMessage thread demo (morning numbers, teammate question, approval, wins), "or add Rocco to Claude / ChatGPT". Team positioning: founders, ads managers, ops, agency on one Rocco.
- Text engine (`lib/text/*`): link-by-code (team: many phones per workspace), commands (numbers, brief, YES codes, undo, wins, help, STOP/START, questions answered from memory), daily numbers, approvals queue shown first in rocco_brief and cleared by apply_changes/revert_changes; LoopMessage provider with dry-run; webhook `/api/text/inbound`; daily cron `/api/cron/daily`; dashboard shows link code + team phones.
- Before Amazon API access: texts are answered from Rocco's memory, refreshed whenever anyone on the team runs "morning check" (or the Claude Code autopilot). Daily numbers flag stale data (>2 days).
