# Launch kit: copy-paste for every directory (Nov 17, 2026)

Same content as https://rocco.works/press (source: `content/launch-kit.json`). Edit the JSON, not this file, then regenerate.

## Product name  (5 chars)

```
Rocco
```

## Name with descriptor  (30 chars)

```
Rocco: your AI Amazon teammate
```

## Website  (19 chars)

```
https://rocco.works
```

## MCP server URL (Streamable HTTP, no auth)  (23 chars)

```
https://rocco.works/mcp
```

## Setup page  (25 chars)

```
https://rocco.works/setup
```

## Pricing page  (27 chars)

```
https://rocco.works/pricing
```

## X / Twitter  (24 chars)

```
https://x.com/roccoworks
```

## Contact email  (17 chars)

```
hello@rocco.works
```

## Tagline (≤ 40 chars)  (23 chars)

```
Your AI Amazon teammate
```

## Tagline (≤ 60 chars)  (50 chars)

```
The AI teammate that runs your Amazon ads with you
```

## One-liner (≤ 140 chars)  (135 chars)

```
Rocco plugs into Claude or ChatGPT next to Amazon's official connectors, finds wasted ad spend, drafts fixes and tracks if they worked.
```

## Short description (≤ 260 chars)  (247 chars)

```
Rocco is an AI teammate for Amazon sellers and agencies. Connect Amazon's official Ads and Seller Central connectors plus Rocco in Claude or ChatGPT, say "morning check", and approve the fixes. Rocco remembers every change and checks if it worked.
```

## Medium description (≤ 500 chars)  (467 chars)

```
Rocco is an AI Amazon teammate that lives inside Claude, ChatGPT and Claude Code. It works next to Amazon's official Ads and Seller Central connectors: it tells your AI what to pull, finds wasted ad spend, money-losing campaigns, placements, stockout risks and listing gaps, and turns them into an approval list. You approve by code; your AI applies the changes through Amazon's connector. Rocco logs every change, re-checks it a week later and reports what it saved.
```

## Long description  (1144 chars)

```
Amazon gave AI hands with its official Ads and Seller Central connectors. Rocco gives it the judgment and memory of a senior Amazon manager.

Add Rocco to Claude, ChatGPT or Claude Code next to Amazon's connectors and say "Rocco, morning check". Rocco tells your AI exactly which reports to pull, then:
- finds search terms that waste money, winners to harvest, and bids to move (never more than ±20% at a time)
- flags profitable campaigns that run out of budget and campaigns above breakeven
- tunes placements (Top of search, Rest of search, Product pages)
- warns before a SKU runs out of stock and eases off its ads
- spots ASINs with traffic but no sales, lost buy box, and converting keywords missing from your listing

Everything comes back as an approval list with codes. Nothing changes without your OK. Approved changes are logged with before-numbers and an undo, re-checked a week later, and summarized in a daily brief. Agencies get white-label client reports and unlimited brands.

Free to add: the brief, findings and top 3 fixes per report. Founding Lifetime is a one-time payment that starts at $99 and rises $10 every 5 sales.
```

## Tags / topics  (123 chars)

```
Amazon sellers, Amazon PPC, Amazon advertising, e-commerce, MCP, Claude, ChatGPT, AI agents, marketing automation, agencies
```

## Categories  (87 chars)

```
E-commerce · Marketing · Artificial Intelligence · Productivity · Developer Tools (MCP)
```

## Pricing summary  (177 chars)

```
Free to add (brief, findings, top 3 fixes per report). Founding Lifetime: one-time payment, starts at $99, +$10 every 5 sales, capped at $499. Unlimited brands, no subscription.
```

## Maker bio  (136 chars)

```
Praveen builds tools for Amazon sellers and has spent years in Amazon ads. Rocco is being built in public for the Ship or Die hackathon.
```

## Maker first comment (Product Hunt / launch sites)  (687 chars)

```
Hey everyone 👋

Amazon just shipped official AI connectors for Ads and Seller Central. That gives Claude and ChatGPT access to your account, but not the judgment to run it.

Rocco is that judgment, with a memory. Add him next to Amazon's connectors, say "Rocco, morning check", and you get one approval list: junk search terms to cut, winners to harvest, budgets that run dry by noon, placements to fix, SKUs about to stock out. You approve by code, your AI applies it, and Rocco re-checks every change a week later.

It's free to add. Founding Lifetime starts at $99 once and goes up $10 every 5 sales.

I'd love brutal feedback, especially from anyone running Amazon ads for clients. 🦝
```

## Show HN title  (81 chars)

```
Show HN: Rocco – an MCP server that gives Claude an Amazon ads manager's judgment
```

## Show HN text  (990 chars)

```
Amazon now has official MCP servers for Amazon Ads and Seller Central. They let an LLM pull reports and make changes, but the model still improvises what to check and how far to move a bid.

Rocco is a remote MCP server (https://rocco.works/mcp, Streamable HTTP) that sits next to them. It has a tool that tells the model which Ads API / SP-API reports and columns to pull for a job, deterministic analyzers for six data types (search terms, campaigns, placements, sales & traffic, restock, bulk files), and a memory layer: proposals get codes, approved changes are logged with before-metrics, and newer data is used to grade each change (worked / no effect / worse). Bid moves are capped at ±20% and nothing is applied without explicit approval of specific codes.

The rules engine is plain TypeScript with fixture tests; no LLM in the analysis path. Personal connectors are capability URLs (no login) backed by Supabase. Happy to answer questions about MCP tool design or the Amazon side.
```

## X bio for @roccoworks  (158 chars)

```
Your AI Amazon teammate 🦝 Plugs into Claude & ChatGPT next to Amazon's connectors. Finds wasted ad spend, drafts the fixes, remembers what worked. rocco.works
```

## Assets (all at https://rocco.works + path)

- `/brand/rocco-logo-512.png`: Logo mark (512×512, transparent)
- `/brand/rocco-logo-1024.png`: Logo mark (1024×1024, transparent)
- `/brand/rocco-logo-240.png`: Logo mark (240×240, for directories)
- `/brand/rocco-wordmark.png`: Logo + wordmark (transparent)
- `/brand/rocco-hero.png`: Mascot: hero pose
- `/brand/rocco-party.png`: Mascot: celebrating
- `/brand/rocco-judge.png`: Mascot: judging
- `/brand/rocco-wave.png`: Mascot: waving
- `/og.png`: Social / OG image (1200×630)
- `/brand/screenshot-home.png`: Screenshot: homepage (1280×800)
- `/brand/screenshot-setup.png`: Screenshot: setup wizard (1280×800)
- `/brand/screenshot-playground.png`: Screenshot: Rocco's analysis (1280×800)
- `/brand/screenshot-pricing.png`: Screenshot: pricing (1280×800)

## Where to list

| Site | Notes | Status |
|---|---|---|
| [TrustMRR](https://trustmrr.com) | Done (Praveen). Keep Dodo connected for verified revenue. | ✅ |
| [Official MCP Registry](https://registry.modelcontextprotocol.io) | Publish server.json (repo root) with the mcp-publisher CLI; verify rocco.works via DNS TXT. | ☐ |
| [Smithery](https://smithery.ai) | Add remote server URL https://rocco.works/mcp. | ☐ |
| [Glama](https://glama.ai/mcp/servers) | Submit remote MCP server. | ☐ |
| [mcp.so](https://mcp.so) | Submit server. | ☐ |
| [PulseMCP](https://www.pulsemcp.com) | Submit server. | ☐ |
| [Product Hunt](https://www.producthunt.com) | Use tagline_60, desc_260, maker_comment, screenshots. Launch on a Tue–Thu, 12:01 a.m. PT. | ☐ |
| [Hacker News (Show HN)](https://news.ycombinator.com/submit) | show_hn_title + show_hn_body. Link https://rocco.works/connect. | ☐ |
| [Indie Hackers](https://www.indiehackers.com) | Product page + build-in-public post. | ☐ |
| [BetaList](https://betalist.com) | desc_260 + screenshots. | ☐ |
| [There's An AI For That](https://theresanaiforthat.com) | Category: Amazon / e-commerce. | ☐ |
| [Futurepedia](https://www.futurepedia.io) | desc_500. | ☐ |
| [SaaSHub](https://www.saashub.com) | Alternatives: Helium 10, Perpetua, Teikametrics. | ☐ |
| [AlternativeTo](https://alternativeto.net) | List as alternative to Amazon PPC tools. | ☐ |
| [Uneed](https://www.uneed.best) | Launch day listing. | ☐ |
| [Peerlist](https://peerlist.io) | Launchpad. | ☐ |

## Official MCP Registry
`server.json` is at the repo root (name `works.rocco/rocco`, remote `https://rocco.works/mcp`). Publish with Anthropic/MCP's `mcp-publisher` CLI: `mcp-publisher login dns --domain rocco.works` (adds a DNS TXT record), then `mcp-publisher publish`. Check the current schema with `mcp-publisher init` first; registry schemas change.
