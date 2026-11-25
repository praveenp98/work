# Getting Rocco recommended inside Claude and ChatGPT (Nov 25, 2026)

Praveen's point: sellers spend their day in Claude and ChatGPT, so that's where Rocco should show up. There are two ways in, and they need different work.

## Way 1: Rocco gets named in AI answers (AEO / "AI visibility")
When a seller asks "can Claude manage my Amazon PPC?" or "Dr. PPC alternative", the assistant searches the web and cites pages. We want to be the cited page.

**Already in place**
- `/llms.txt` and `/llms-full.txt`: what Rocco is, every answer, guide, help page, comparisons and pricing, in plain text for AI crawlers.
- 19 answer pages (`/answers/*`): direct 40–70-word answer first, then steps and an FAQ, with FAQPage and HowTo structured data.
- Comparison pages for Claude, ChatGPT, Dr. PPC, 7 PPC tools, agencies and Amazon's free tools (`/compare`), each with FAQ structured data.
- `robots.txt` allows every crawler (GPTBot, ClaudeBot, PerplexityBot, Google-Extended) on public pages; the sitemap lists all of them.
- Bing and Google Search Console are verified (ChatGPT search leans on Bing; Gemini and AI Overviews on Google). **Submit the sitemap in both.**

**Added today:** `/compare/claude`, `/compare/chatgpt`, and answers for "Can Claude (or ChatGPT) manage my Amazon PPC?", "How do I know if AI's advice for my Amazon ads is right?" and "How do I know if my Amazon PPC agency is doing a good job?".

**What moves AI answers most (in order)**
1. **Being mentioned on pages AI already trusts.** Reddit threads, seller forums, YouTube descriptions, "best AI Amazon tools" listicles, Product Hunt. Assistants cite third-party mentions far more than a brand's own site. Answer real threads helpfully as yourself (disclose you built Rocco).
2. **Directory listings**: Product Hunt, There's An AI For That, Futurepedia, G2/Capterra (free listings). Each is a crawlable mention.
3. **More answer pages for the questions sellers type into AI**, one per question:
   - "Why am I not profitable on Amazon ads?"
   - "How much should I spend on Amazon ads?"
   - "Should I fire my Amazon agency?"
   - "What is a good TACoS?" (exists as a TACoS explainer; add the benchmark angle)
   - "Is Helium 10 worth it in 2026?"
4. **Freshness**: update dates and numbers monthly; AI prefers recent pages.

**How to check it's working**: once a week, ask ChatGPT, Claude (with web search) and Perplexity: "best AI Amazon PPC manager", "Dr. PPC alternative", "can Claude manage my Amazon ads". Note whether Rocco is mentioned or cited. PostHog shows visitors arriving from chatgpt.com, perplexity.ai and claude.ai (referrer).

## Way 2: Rocco lives inside Claude and ChatGPT (distribution)
Rocco already has an MCP server (`/mcp`, sign-in at `rocco.works/mcp/login`): a Claude user can add Rocco as a connector and ask "Rocco, what needs my attention today?" inside their chat.

On Nov 21 we moved positioning away from "a Claude add-on" (Rocco is its own manager). That was right for the homepage, but **listing Rocco in Claude's connector directory and ChatGPT's app directory is still the most direct way to reach sellers where they spend their day**, and it fits the new line: "Claude gives advice. Rocco keeps the receipts."

**Decision for Praveen:**
- (a) Submit Rocco to the Claude connector directory and the ChatGPT apps directory, pitched as "Rocco: your Amazon account's memory and watchdog, inside Claude". I prepare the listings and check the MCP server meets each directory's rules.
- (b) Keep Rocco web-first and do Way 1 only.

My recommendation is (a): it's free, it's the channel Praveen named, and the product already exists.

## Positioning to test (from Praveen's research, Nov 25)
"The independent watchdog for your Amazon business." Claude and agencies give advice and make changes; Rocco checks every morning, keeps the receipts and measures what worked. Test it in posts first (docs/VIDEO-SCRIPTS.md hooks) before rewriting the homepage. Validate with 5 seller conversations.
