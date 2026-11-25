# Rocco in the Claude and ChatGPT directories: listings to paste (Nov 25, 2026)

Goal: sellers find Rocco inside Claude and ChatGPT, where they already spend the day. Positioning: **"Claude gives advice. Rocco keeps the receipts."**

## What I checked and fixed (against Anthropic's connector review criteria, read Nov 25)
| Rule | Rocco |
|---|---|
| Remote server over HTTPS | `https://rocco.works/mcp/login` ✅ |
| OAuth 2.0 for user accounts | Discovery at `/.well-known/oauth-protected-resource` + `/.well-known/oauth-authorization-server`, dynamic client registration at `/oauth/register`, sign-in with Google ✅ |
| Every tool has a `title` + `readOnlyHint` or `destructiveHint` | ✅ all tools. Fixed today: `apply_changes`, `revert_changes`, `set_brand_settings` now `destructiveHint: true` (they change saved data). `analyze_report`, `activate_license` and `create_workspace` only add records (`destructiveHint: false`) |
| Read and write split into separate tools | ✅ no catch-all tool |
| Tool names ≤ 64 characters | ✅ longest is 19 |
| No prompt-injection patterns: no telling Claude how to behave, no instructions to call other tools, no promotion in descriptions | **Fixed today:** removed the "personality" line and "use the seller's Amazon Ads connector to apply…" from the server instructions; "Start here" removed from `rocco_brief`; the approved-by-text note no longer tells the model to call other connectors |
| Don't read chat history, memory or files | ✅ never |
| Useful error messages, sensible response sizes | ✅ (reports capped; errors say what to fix) |
| Unsupported use cases (moving money, AI image/video) | ✅ none |
| Public documentation | ✅ new page `rocco.works/connector` (setup, every tool, example prompts, data and privacy, support) |
| Privacy policy | ✅ `rocco.works/privacy`, new "Rocco inside Claude or ChatGPT" section |
| Tested in MCP Inspector and as a custom connector in Claude | **You:** see "Before you submit" |

ChatGPT's guidelines (developers.openai.com) were blocked from this session, so I couldn't read them in full. Public summaries say ChatGPT apps are now submitted as **plugins** through OpenAI's plugin portal, need a live public MCP URL (no placeholders), a verified publisher identity, a privacy policy, minimal data collection, and correct tool hints. Rocco meets the technical parts; **read the OpenAI checklist in the portal before submitting.**

## Before you submit (15 minutes, needs a paid Claude plan)
1. Claude → Settings → Connectors → **Add custom connector** → URL `https://rocco.works/mcp/login` → Connect → sign in with Google.
2. In a new chat, try each prompt below. Confirm: `rocco_brief` answers, `analyze_report` works on a pasted report, `set_brand_settings` asks before saving.
3. Optional: run the MCP Inspector (`npx @modelcontextprotocol/inspector`) against the same URL.
4. Create a **test account for reviewers**: a Google account that can sign in to Rocco, with the example data. Anthropic emails you for it only if they escalate to Verified review.

## Claude: Connectors Directory
Portal: **claude.ai/directory/manage** → Submit new → **MCP connector**.

- **Name:** Rocco
- **Server URL:** `https://rocco.works/mcp/login`
- **Authentication:** OAuth 2.0 (dynamic client registration)
- **Short description (one line):** Your Amazon account's memory and watchdog: daily brief, report audits, a change log and results for every change.
- **Detail card description:**
  > Rocco is an AI Amazon manager for sellers. Inside Claude, it analyzes your Amazon Ads and Seller Central reports (from Amazon's own connectors or an exported file) and returns a numbered approval list: wasted searches to block, bids to fix, budgets to move, converting searches to harvest into exact campaigns. It remembers what you changed and why, and checks a week later whether each change worked. Ask "Rocco, what needs my attention today?" for your daily brief. Rocco never changes anything in Amazon from a chat; you decide what to apply. Not affiliated with Amazon.
- **Example prompts:**
  - Rocco, what needs my attention today?
  - Analyze my last 30 days of search terms and show me what to block.
  - Did the bid changes I made last week work?
  - Claude suggested restructuring my campaigns. Check that against what's worked in my account.
  - Set my target ACoS to 25% and never negate my brand name.
- **Category:** Business / Productivity (choose e-commerce or sales if offered)
- **Documentation URL:** https://rocco.works/connector
- **Privacy policy URL:** https://rocco.works/privacy
- **Terms URL:** https://rocco.works/terms
- **Support contact:** human@rocco.works
- **Icon:** `public/brand/rocco-logo-512.png` (the raccoon head)
- **Allowed link URIs:** `https://rocco.works`
- **Screenshots:** not needed (Rocco isn't an MCP App with UI)

## ChatGPT: apps / plugins
Portal: OpenAI Platform → **Plugins** (submit plugins). You need to be an organization owner, or have the plugin-publishing role.

- **Name:** Rocco
- **MCP server URL:** `https://rocco.works/mcp/login` (live, OAuth 2.0)
- **Short description:** Your Amazon account's memory and watchdog: daily brief, report audits, a change log and results for every change.
- **Long description:** same as Claude's detail card.
- **Example prompts:** same list.
- **Testing guidelines for reviewers:** "Sign in with the Google test account provided. Paste the sample search term report (rocco.works/sample-search-term-report.csv) and ask: 'Analyze this and show me what to block.' Then: 'Rocco, what needs my attention today?'"
- **Privacy policy:** https://rocco.works/privacy · **Terms:** https://rocco.works/terms · **Support:** human@rocco.works
- **Countries:** start with the US (Rocco's Amazon data connection works in every marketplace, but keep the first review simple).
- **Note:** projects with EU data residency can't submit apps; use a standard project.

## After listing
- Add "Find Rocco in Claude's and ChatGPT's directories" to the homepage and `/connector` once each is approved.
- Post it on X: "Rocco is now inside Claude. Claude gives advice. Rocco keeps the receipts."
- Track new workspaces created through the connector (/admin/leads sign-ups) and visitors arriving from claude.ai and chatgpt.com in PostHog.
