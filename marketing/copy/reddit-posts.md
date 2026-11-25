# Reddit posts: organic, posted by hand

Written Nov 25, 2026. 19 ready-to-post threads for Amazon seller subreddits. Every fact was checked against the sources listed under each post (as of Nov 25, 2026). Re-check anything time-sensitive on the day you post it.

## The rules these posts follow

1. **No link, no product, no Rocco in the post.** Reddit seller subs remove promotion and downvote anything that smells like it (see `marketing/brand/channel-research.md`). The post has to be worth saving on its own.
2. **Talk to every seller in one post.** Most posts end with a "by stage" block: just starting, under 1k a month in ad spend, 1k to 10k, 10k to 50k, 50k and up. A beginner and a 7-figure brand should both get something they can do this week.
3. **Numbers or it didn't happen.** Real Amazon dates, real rules, math anyone can redo. No made-up results, no "my client made X".
4. **Write like a seller who has done the work, not a vendor.** Short lines. Plain words. No hype words. No em dashes (the copy lint fails on them).
5. **Money is written without the dollar sign** ("19 cents", "1k a month"). That keeps `node marketing/scripts/lint-copy.mjs` passing, because the lint only allows Rocco's own prices with a dollar sign. It also reads naturally on Reddit.
6. **End with a real question** so the comments fill up. Answer every comment for the first 2 hours.

## If someone asks "what do you use?" in the comments

Only when asked, and only where the sub allows it:

> I built a set of free tools for this at rocco.works/free (they read the reports in your browser, nothing is uploaded). Happy to just run the math here if you'd rather paste your numbers.

Link with `?utm_source=reddit&utm_medium=social&utm_campaign=organic&utm_content=<post-id>` (post ids are below, e.g. `r01`).

## Where to post

| Sub | Good for | Note |
|---|---|---|
| r/FulfillmentByAmazon | everything here | biggest; strict on promotion |
| r/AmazonSeller | everything here | |
| r/AmazonFBA | beginner posts (r05, r06, r07, r08) | lots of new sellers |
| r/PPC | ads math only (r05, r06, r10) | mixed Google/Amazon crowd |
| r/ecommerce | ecosystem news (r02, r04, r09, r18) | wider audience, less Amazon jargon |

Check each sub's rules and flair before posting. Don't cross-post the same post on the same day. Space posts at least 2 days apart in the same sub.

## Posting calendar (suggested)

| Date | Post | Why then |
|---|---|---|
| Nov 25 or 26 | r01 Black Friday final 48 hours | Black Friday is Nov 27 |
| Nov 28 | r03 Your ads are already inside Amazon's AI | people are staring at ad spend |
| Dec 1 | r05 Negative keyword math | evergreen, after the Cyber Monday spike |
| Dec 2 | r02 2027 fee changes | planning season |
| Dec 4 | r08 What changes at each ad-spend bracket | pillar post |
| Dec 6 | r09 AI in your account in 2026 | |
| Dec 8 | r06 Break-even ACoS | |
| Dec 10 | r13 Low-inventory fee + how much to send | before January restock |
| Dec 12 | r17 Your year in 10 numbers | year-end |
| Dec 14 onward | the rest, about one every 2 days | |

---

## r01 · Black Friday final 48 hours

**Subs:** r/FulfillmentByAmazon, r/AmazonSeller · **Post:** Nov 25 or 26 · **Flair:** Advice / Discussion

**Title:** Black Friday is in 2 days. Here's the 20-minute check I'd do right now, depending on how much you spend on ads

**Body:**

Amazon's Black Friday Week runs Nov 19 to 30 this year, and for the first time there are two deal drops on Black Friday (Nov 27) and two on Cyber Monday (Nov 30): one at midnight PT and one at 8 a.m. PT. So "the big day" is really four spikes.

Two other things are different this year:

- Alexa for Shopping (the AI that replaced Rufus in the search bar) can track a price and auto-buy when it hits a shopper's target. If you run a deal and then go out of stock, you're not just missing sales, you're missing pre-set orders.
- Shoppers are watching deal prices harder. A report this month claimed nearly 1 in 3 of 350+ products Amazon promoted as BFCM deals in 2024 and 2025 cost the same or more than in the prior 30 days. Amazon disputes it and says it tightened deal rules for 2026. Either way: a fake-looking "deal" is a bad look this year.

**The 20-minute check (everyone):**

1. **Days of stock left** on your top 5 products at your current daily sales × 2. If any is under 10 days, don't raise bids on it. Protect the stock.
2. **Your price on other sites.** If you're cheaper on your own site or Walmart, Amazon can pull your Buy Box until you match. Check before the traffic hits, not after.
3. **Search term report, last 30 days, sorted by spend.** Anything with lots of clicks and zero orders is about to get 2 to 3 times the clicks. Block the obvious junk today.
4. **Budgets on your proven campaigns.** The most common BFCM loss isn't bad bids. It's a winning campaign running out of budget at noon.

**By stage:**

- **Just starting / no ads yet:** don't launch new campaigns this week. CPCs are at their highest of the year. Use the week to watch what sells in your category and write down the searches.
- **Under 1k a month in ads:** do steps 1 and 3. Keep bids where they are. Small accounts lose most by chasing peak CPCs.
- **1k to 10k:** raise budgets 50 to 100% on campaigns that were profitable over the last 30 days. Raise bids only on searches that already sell, and by 20% at most at a time.
- **10k to 50k:** schedule budget checks for midnight PT and 8 a.m. PT on Friday and Monday (the drops). Add the top converting searches as exact match if they aren't already.
- **50k and up:** split your BFCM spend tracking by day. Compare Friday-to-Monday TACoS against the first week of November, not against last year. Your mix changed.

What's the one thing that went wrong for you last BFCM? Budget running out by lunch seems to be the most common one.

**Sources (for you, don't post):** Black Friday Week dates and the two drops: stackinfluence.com November 2026 seller news. Alexa price tracking and auto-buy: same source and eweek.com. Deal report (Groundwork Collaborative) and Amazon's response: stackinfluence.com. Buy Box and other-site prices: Amazon statement to Fortune (listings stay eligible when priced the same or lower than elsewhere).

---

## r02 · 2027 fee changes in plain English

**Subs:** r/FulfillmentByAmazon, r/AmazonSeller, r/ecommerce · **Post:** Dec 2 · **Flair:** News

**Title:** Amazon's 2027 fee changes, explained without the jargon (and what to do at every size)

**Body:**

Amazon announced its 2027 US fees on Nov 5. The headline is "19 cents more per unit on average." The average is the least useful number in the announcement. Here's what's actually in it.

**What changes and when:**

- **Jan 15, 2027: fulfillment fees go up about 19 cents per unit on average** (Amazon says that's about 0.8% of the average selling price). Some products go up more, some go down. Holiday peak fees run until Jan 14, so the new rates start the next day. A unit is charged the rate on the day it ships, not the day it was ordered.
- **Jan 15: fewer products get the cheaper "under 10" rates.** Some categories (automotive, compact appliances and computers are among them) will pay the normal rates even when priced under 10.
- **Feb 1: the storage utilization surcharge is gone.** Good news for sellers who were paying it.
- **Feb 1: the aged inventory surcharge merges into one storage rate based on how long units sit.** Stock that sells within about 6 months should pay the same or less. Old stock pays more.
- **Feb 1: the low-inventory-level fee changes.** It only applies below 28 days of supply, and it's measured on what actually shipped in the 4 weeks before and after the check, instead of trailing 30- and 90-day sales.
- **Mar 1: AWD gets age-based storage pricing too.**
- **Not changing:** the 3.5% fuel and logistics surcharge (in place since Apr 17, 2026) stays.

**The 3 things worth doing before Jan 15:**

1. Open the fee change comparison in Seller Central (Amazon added a Fee Change Comparison dashboard in Profit Analytics) and sort by the biggest per-unit increase.
2. For your top 10 products: new fee ÷ price. If fees + product cost + ads leave you under 10% margin, decide now: raise price, change size/packaging, or stop pushing ads on it.
3. Find anything that's been sitting more than 6 months. It gets more expensive from Feb 1. Run a deal or a removal in January, not March.

**By stage:**

- **Just starting:** this matters most to you, because you're choosing products now. Run your shortlist through the FBA Revenue Calculator with 2027 rates. A product that's 1 inch over a size tier can eat your whole margin.
- **Under 1k a month in ads:** check your 3 best sellers. If you sell anything under 10, check if your category lost the low-price rate.
- **1k to 10k:** your break-even ACoS just moved. Fees up = margin down = the ACoS you can afford is lower. Recalculate it (price minus product cost minus all Amazon fees, divided by price).
- **10k to 50k:** the storage reset is the big one. Plan Q1 inbound so nothing new arrives that won't sell in 6 months.
- **50k and up:** model the low-inventory fee under the new 28-day rule against your AWD and inbound timing. Being lean in February now costs less, but only if you stay above 28 days.

Which change hits you hardest? For a lot of catalogs it'll be the storage reset, not the 19 cents.

**Sources:** Amazon's 2027 announcement as summarized by novadata.io, ppc.land, feedvisor.com, goatconsulting.com (low-price FBA categories), chainstoreage.com (Fee Change Comparison dashboard, peak fees through Jan 14). Exact age-based storage rates weren't published in those sources: don't quote a rate.

---

## r03 · Your ads are already inside Amazon's AI

**Subs:** r/FulfillmentByAmazon, r/AmazonSeller, r/PPC · **Post:** Nov 28 · **Flair:** Advertising / PPC

**Title:** PSA: your Sponsored Products and Sponsored Brands campaigns are already running "prompt" ads inside Amazon's AI assistant. Here's how to check them in 2 minutes.

**Body:**

A lot of sellers still don't know this.

Since Mar 25, 2026, Sponsored Products prompts and Sponsored Brands prompts are generally available in the US. They're turned on automatically for existing SP and SB campaigns. They're charged per click, like normal ads. They show up as suggested questions in search results and on product pages, and a click can open a conversation in Amazon's AI assistant (Rufus, now folded into Alexa for Shopping).

**How to see yours:**

Ads console → open a campaign → ad group → Ads → **Prompts** tab. Prompts only show up there once they've had a click. You can see performance and pause individual prompts.

**What the early numbers look like:**

One 20 to 30 million a year seller reported 88 clicks from prompts since January versus 500,000 clicks from all their other Amazon ads, so under 1% of clicks. The upside: those clicks cost roughly 31 cents versus 50 to 70 cents for their normal ads. That's one seller, not a rule. Your numbers will differ by category.

**What I'd actually do with this:**

1. Check the Prompts tab on your top 3 campaigns. Most people find little or nothing. That's fine.
2. Read the prompts that did get clicks. They tell you, in shoppers' own words, what questions people ask about your product ("is it dishwasher safe?", "will it fit a queen bed?"). That's free listing research.
3. Make sure your listing answers those questions in the title, highlights, bullets or images. The AI pulls answers from your listing. If the answer isn't there, it can't recommend you for that question.
4. Pause prompts that get clicks with no orders, the same way you'd block a bad search.

**By stage:**

- **Just starting:** ignore the ads side. Do step 3. Write your listing as answers to the 10 questions a shopper would ask.
- **Under 1k a month:** check once a month. It's a tiny slice of spend for most accounts.
- **1k to 10k:** add the prompt questions to your listing to-do list. That's the real value.
- **10k and up:** track prompts as their own line in your monthly report. If they ever stop being 1% of clicks, you want to see it first.

Has anyone found prompts actually driving sales? Curious which categories.

**Sources:** Amazon Ads launch announcement (advertising.amazon.com, Mar 10, 2026: GA Mar 25, auto-enabled, Prompts tab location, pause controls). Seller numbers (88 vs 500,000 clicks, ~31 cents vs 50 to 70 cents): The Information via shopifreaks.com, Apr 2, 2026. Rufus folded into Alexa for Shopping May 13, 2026: CNBC/tinuiti.com.

---

## r04 · Rufus is gone. Alexa for Shopping is in the search bar.

**Subs:** r/FulfillmentByAmazon, r/AmazonSeller, r/ecommerce · **Post:** any time · **Flair:** Discussion

**Title:** Amazon's AI now sits inside the search bar and filters products before shoppers see them. 6 listing changes that actually matter.

**Body:**

Quick recap if you missed it: on May 13, 2026 Amazon retired Rufus as a separate chatbot and replaced it with Alexa for Shopping. It's not a side icon anymore. It sits in the main search bar, writes AI overviews above results, runs side-by-side comparisons, and can track a price and buy when it drops.

The big shift: normal search ranks everything and lets the shopper filter. The AI filters first and then recommends. If it doesn't think you answer the shopper's question, you don't make the shortlist.

**6 listing changes that matter now:**

1. **Answer questions, don't stack keywords.** Shoppers ask "best cutting board that won't dull knives." Your listing needs to say what it's made of and why that matters, in plain words.
2. **Put the facts the AI compares in structured fields.** Size, material, count, compatibility. Fill every attribute in the listing form, not just the title and bullets.
3. **Use the 125-character item highlights.** Titles are capped at 75 characters now, and highlights show with the title in search. That's where comparison facts go.
4. **Read your reviews for objections.** The AI reads them too. If 20 reviews say "runs small," say the real size in the listing before the AI says it for you.
5. **Images with text that answers a question** (dimensions, what's in the box, what it fits).
6. **Keep the price steady.** Price tracking means shoppers set targets. Constant price swings train them to wait.

**By stage:**

- **Just starting:** write your listing from your top 10 customer questions. You have the advantage: no old keyword-stuffed listing to undo.
- **Under 1k a month:** fix #2 and #3 on your best seller. It's an afternoon.
- **1k to 10k:** pull your Sponsored Prompts (Prompts tab in the ads console) and your reviews, list the questions, and check each one is answered on the page.
- **10k and up:** treat this like SEO. Pick your 20 most important shopper questions and check monthly whether you show up in the AI's answer.

Has anyone seen a measurable change in traffic since May? I'd love real numbers either way.

**Sources:** CNBC May 13, 2026 (via sellerapp.com), higoodie.com and canopymanagement.com (search bar, AI overviews, comparisons, default for signed-in US shoppers), eweek.com (price tracking). 75 + 125 character split: Amazon Seller Forums announcement (via ecommercebytes.com).

---

## r05 · The negative keyword math

**Subs:** r/FulfillmentByAmazon, r/AmazonSeller, r/PPC, r/AmazonFBA · **Post:** Dec 1 · **Flair:** PPC

**Title:** "How many clicks before I add a negative keyword?" The honest answer is a small bit of math, not a magic number. Here it is.

**Body:**

Ask ChatGPT, a course or a forum and you'll get "10 clicks", "15 clicks", "spend 2× your price." They're all guesses, because the right number depends on one thing: **your conversion rate.**

**The idea:** a search with zero orders isn't bad until it's had enough clicks that you'd *expect* a sale.

If 10% of your clicks usually buy (10% conversion), then:

| Clicks with 0 orders | Chance that's just bad luck |
|---|---|
| 10 | 35% |
| 20 | 12% |
| 30 | 4% |
| 40 | 1.5% |

At 5% conversion it takes about twice as long:

| Clicks with 0 orders | Chance that's just bad luck |
|---|---|
| 20 | 36% |
| 40 | 13% |
| 60 | 5% |

(It's just (1 − conversion rate) to the power of clicks. Redo it with your own number.)

So for a 10% converter, 30 clicks and no sale is a pretty safe block. For a 5% converter, 30 clicks proves almost nothing.

**The second check: money.** Even before you're "sure", stop when a search has spent more than one sale is worth to you. That's: price × your break-even ACoS. A 30 product with a 30% margin before ads can afford about 9 in ad cost per sale. A search that has spent 15 with no orders has already cost you more than a sale would have earned.

**Block on whichever comes first: enough clicks, or too much money.**

**Two exceptions:**

- Don't judge the last 2 to 3 days. Orders take time to show up in the report.
- Don't auto-block your own brand terms, launch campaigns or ranking pushes. Different goals.

**Negative exact or phrase?** Exact if only that exact search is bad ("bamboo cutting board free"). Phrase if any search containing it is bad ("free", "diy", "used").

**By stage:**

- **Just starting:** your conversion rate is in Business Reports (unit session percentage). Use 10% if you don't have enough data yet, and be patient.
- **Under 1k a month:** do this once a week on the search term report. 15 minutes.
- **1k to 10k:** use your *ad group's* conversion rate, not the account's. A gift set and a refill pack convert very differently.
- **10k and up:** you have enough data to do this per match type and per placement. Automate the rule, but log every block so you can undo it.

What rule are you using right now? Curious how many people are on a flat "X clicks" rule.

**Sources:** the math is standard probability (checked: 0.9^20 = 12.2%, 0.9^30 = 4.2%, 0.95^40 = 12.9%, 0.95^60 = 4.6%). "Last 3 days don't count" and the exceptions match Rocco's own rules engine (`lib/rules/`, PROGRESS.md "Judgment" entry). Break-even ACoS = margin before ads.

---

## r06 · Break-even ACoS

**Subs:** r/AmazonFBA, r/AmazonSeller, r/PPC · **Post:** Dec 8 · **Flair:** PPC / Beginner

**Title:** Stop asking "is 30% ACoS good?" There's one number that answers it for your product, and it takes 2 minutes to work out.

**Body:**

"Is 30% ACoS good?" is like asking "is 30 degrees hot?" Depends where you are.

**The number: break-even ACoS.** It's your profit margin before ads.

Break-even ACoS = (price − product cost − all Amazon fees − shipping to Amazon) ÷ price

Example: price 30. Product cost 7. Referral fee about 4.50. FBA fee about 6. Inbound shipping 1.50. That leaves 11 before ads. 11 ÷ 30 = **37% break-even ACoS.**

- ACoS under 37%: each ad sale makes money.
- ACoS at 37%: ads break even (still useful if you're buying rank).
- ACoS over 37%: each ad sale loses money.

So 30% ACoS is good for this product. For a product with a 20% margin, 30% ACoS loses money on every ad sale.

**Then look at TACoS** (ad spend ÷ ALL sales, not just ad sales). ACoS tells you if ads pay for themselves. TACoS tells you if ads are growing the business or just buying sales you'd have got anyway. If TACoS is falling while sales grow, your ads are lifting organic sales. If it's rising, you're getting more dependent on ads.

**By stage:**

- **Just starting / launching:** you'll run above break-even on purpose to get first sales and reviews. Fine. Decide in advance how much you'll "invest" and for how long (for example: 6 weeks, a fixed budget). Then stop.
- **Under 1k a month:** know your break-even for every product. Write it on a sticky note. Every bid decision comes back to it.
- **1k to 10k:** set a target ACoS *below* break-even (break-even minus 5 to 10 points) so there's profit left after mistakes.
- **10k to 50k:** watch TACoS monthly. That's the number that tells you whether ads are building the brand.
- **50k and up:** run break-even per product *and* per campaign type. Brand defense, top-of-funnel and retargeting have different jobs and different targets.

Fees went up for 2027 (about 19 cents a unit on average from Jan 15), so recalculate in January. Your break-even probably moved down a point or two.

What's your break-even vs your actual ACoS? No judgment, plenty of sellers have never worked it out.

**Sources:** formula is standard. 2027 fee average: Amazon Nov 5 announcement (see r02). The example numbers are illustrative, not a real account: keep the word "Example".

---

## r07 · The search term report

**Subs:** r/AmazonFBA, r/AmazonSeller · **Post:** any time · **Flair:** Beginner / PPC

**Title:** The most valuable file in your Amazon account is a report most beginners never open. Here's how to read it in 15 minutes.

**Body:**

It's the **Sponsored Products search term report.** It shows the actual words shoppers typed before they clicked your ad, and what each one cost and earned.

**Where:** Ads console → Reports (Measurement & Reporting) → create report → Sponsored Products → Search term. Pick last 30 days. Download it.

**Important:** Amazon only keeps about 65 days of this report. If you want to compare months, download it every month and keep the files. Most people find this out when they need last quarter.

**How to read it in 15 minutes:**

1. **Sort by spend, highest first.** The top 20 rows are usually most of your money.
2. **Clicks but zero orders, highest spend first.** These are your leaks. Some are obvious junk ("free", the wrong product, a competitor's exact model). Block them as negatives.
3. **Orders with a low ACoS.** These are your winners. If they came from an auto or broad campaign, add them as exact match in their own campaign so you control the bid.
4. **Rows that look like B0XXXXXXXX.** Those aren't searches. Those are product pages your ad showed on (other people's listings). Same logic applies: keep the ones that sell, block the ones that burn.

**What to expect the first time:** most sellers find that a handful of searches make most of the ad sales, and a long tail of searches with clicks and no orders eats a real chunk of the budget. That's normal, and it's the easiest money you'll ever save.

**By stage:**

- **Just starting:** run an auto campaign with a small budget for 2 to 3 weeks, then open this report. It's the cheapest market research there is: real shoppers telling you what they call your product.
- **Under 1k a month:** steps 1 to 3 every Monday.
- **1k to 10k:** add a column for "already negated?" and "already exact?" so you stop re-reviewing the same rows.
- **10k and up:** keep 12 months of these files. It's the only way to compare this BFCM with last BFCM search by search.

What's the weirdest search term you've found in yours? A classic is a "how to clean..." search triggering an ad for the product itself.

**Sources:** ~65 days retention: Amazon Ads help (also stated in `docs/LEAD-MAGNETS.md` #03 check). ASIN rows = product targeting: standard report behaviour.

---

## r08 · What changes at each ad-spend bracket

**Subs:** r/FulfillmentByAmazon, r/AmazonSeller, r/AmazonFBA · **Post:** Dec 4 · **Flair:** Advice / Discussion

**Title:** What to focus on at every stage of an Amazon business, from first listing to 50k+/month in ads. The playbook I wish someone had given me.

**Body:**

Most Amazon advice is written for one size of seller and then sold to everyone. Here's what actually matters at each stage, and what you can safely ignore.

**Stage 0: no sales yet**
- Focus: product, listing, margin. Know your break-even ACoS before you spend a dollar on ads.
- Ignore: dayparting, bid tools, DSP, agencies.
- The one habit: write your listing as answers to the 10 questions a shopper asks.

**Stage 1: under 1k a month in ad spend**
- Focus: one auto campaign + one exact campaign per product. Weekly search term review: block the junk, move winners to exact.
- Ignore: complicated structures. 3 campaigns you understand beat 30 you don't.
- The one habit: Monday, 15 minutes, search term report.

**Stage 2: 1k to 10k**
- Focus: budgets on winners (the most common loss here is a profitable campaign running out of budget by noon), bids within 20% steps, stock levels.
- Ignore: chasing ACoS on every single keyword. Look at the product's total.
- The one habit: check days of stock left every week. Running out kills rank, and rank takes weeks to come back.

**Stage 3: 10k to 50k**
- Focus: TACoS (ads vs total sales), naming conventions so you can read your own account, portfolios per product, a monthly "what changed and did it work" review.
- Ignore: shiny new ad types until the core is clean.
- The one habit: write down every change you make and check it 7 to 14 days later. Most accounts at this size have no idea which changes worked.

**Stage 4: 50k and up**
- Focus: incrementality (is this spend creating sales or just catching them?), brand defense vs growth budgets kept separate, people for creative and strategy.
- Ignore: daily bid fiddling by hand. That's what software is for now.
- The one habit: a monthly profit view per product after ads, fees and storage, not just ad metrics.

**What's the same at every stage:** the search term report, your break-even ACoS, and your stock levels. Everything else is extra.

Which stage are you at, and what's the thing you're stuck on? I'll reply to everyone with what I'd do next.

**Sources:** experience-based framework, no external numbers. 20% bid step and 7-to-14-day check match Rocco's rules (`lib/rules/bids.ts`, CLAUDE.md "bid formula with ±20% cap").

---

## r09 · AI in your Amazon account in 2026: what's real

**Subs:** r/FulfillmentByAmazon, r/AmazonSeller, r/ecommerce · **Post:** Dec 6 · **Flair:** Discussion / News

**Title:** Amazon now lets AI touch your seller account in 3 official ways. Here's what each one actually does, and the rules you agreed to without noticing.

**Body:**

A year ago "AI for Amazon" meant writing bullet points with ChatGPT. In 2026 Amazon opened real doors for AI to work inside your account. Here's the map.

**1. Seller Assistant (Amazon's own AI, inside Seller Central)**
Free. Since Accelerate (Sept 23, 2026) it has memory of your pricing patterns, inventory cycles and goals, and can run always-on workflows. It's built on Amazon Bedrock using Anthropic's Claude models.

**2. The Selling Partner plugin (your Amazon data inside Claude or Amazon Quick)**
Also announced Sept 23. Connects listings, inventory, sales and performance data to Claude (beta, US) or Amazon Quick. It can check inventory, change prices and update listings. Amazon says actions need your approval first and every action has an audit trail. Connection takes about a minute, no code.

**3. The Amazon Ads MCP server (AI agents running your ads)**
Open beta since Feb 2, 2026. Lets AI tools like Claude, ChatGPT or Gemini create, update and delete campaigns and run reports through Amazon's official ads API. The catch: you need active Amazon Ads API credentials, which most small sellers don't have.

**The rule you agreed to: the Agent Policy (since Mar 4, 2026)**
Amazon added a section to the Business Solutions Agreement covering any "automated software or AI agents" that touch your account. In short, an AI tool must identify itself as automated, follow the policy, and stop if Amazon asks. Continuing to sell counted as accepting it. And it's your account on the line if a tool breaks the rules, not the tool's.

**What AI is genuinely good at in your account right now:**
- Reading reports you'd never read (search terms, placements, inventory) and pointing at the waste.
- Repetitive changes: negatives, bid steps, budget moves.
- Answering "why did X change?" across 5 reports at once.

**What it's still bad at:**
- Knowing your strategy. It'll happily "fix" a launch campaign you're running at a loss on purpose.
- Context it can't see: a supplier delay, a competitor's stock-out, your cash position.
- Being right about numbers it didn't calculate. General AI advice can sound sure and be wrong for your account.

**The safe setup:** AI suggests, you approve, every change is logged and can be undone. If a tool can't show you a change log, don't give it write access.

**By stage:**
- **Just starting:** use AI to write and check listings and to explain reports. Don't give anything write access yet.
- **Under 10k a month:** try Seller Assistant first. It's free and it's Amazon's own.
- **10k and up:** if you use outside tools, ask each vendor how they comply with the Agent Policy. Get it in writing.

Is anyone letting AI make changes without approving each one? Genuinely curious how that's going.

**Sources:** aboutamazon.com Sept 23, 2026 Seller Assistant + plugin post, thenextweb.com, siliconangle.com (~60 seconds), unite.ai (date, memory). Amazon Ads MCP open beta Feb 2, 2026: advertising.amazon.com (needs active API credentials). Agent Policy: Amazon Seller Forums announcement (effective Mar 4, 2026), ecommercebytes.com (identify / comply / cease access), feedvisor.com (account-level enforcement, acceptance by continued use).

---

## r10 · Before you follow ChatGPT's or Claude's ad advice

**Subs:** r/FulfillmentByAmazon, r/AmazonSeller, r/PPC · **Post:** any time · **Flair:** PPC / Discussion

**Title:** AI assistants give confident Amazon ad advice. 5 checks to run before you follow any of it.

**Body:**

AI assistants give confident Amazon ad advice. Some of it is great. Some of it would block a search that sold 30 times last month. The problem isn't that AI is dumb. It's that general advice can't see your numbers.

**5 checks before you act on any AI (or agency, or course) recommendation:**

1. **"Block this search."** Check the search term report first. Does it have orders? Is it a search you're deliberately paying for (brand, launch)? A lot of "obvious" negatives turn out to be sellers.
2. **"Raise the bid by 40%."** Big jumps reset what you learn. Move bids in steps of 20% or less, then wait 7 days. If the advice doesn't say what the bid is now and what it's based on, it's a guess.
3. **"Restructure into single keyword campaigns."** Ask: what problem does that fix for *my* account? Restructuring wipes campaign history. Only worth it if your current structure is genuinely unreadable.
4. **"Your ACoS is too high."** Compared to what? The only fair comparison is your break-even ACoS (your margin before ads). 40% ACoS is great for a 50% margin product.
5. **Any number you didn't give it.** If the advice says "this keyword converts at 12%" and you never shared that, it made it up. Ask it to show where each number came from.

**The prompt that makes AI advice much better:**
Give it your search term report (last 30 days), your margin before ads, and your goal ("profit" vs "rank for X"). Then ask: "For each change, show me the row and the numbers that support it, and tell me what would make this change wrong."

**By stage:**
- **Just starting:** AI is a great tutor. Ask it to explain your reports line by line.
- **Under 10k a month:** use it to find patterns, but make the changes yourself after checking each one.
- **10k and up:** if you let any AI tool make changes, insist on a log of what changed and a way to undo it.

What's the worst AI advice you've been given for your Amazon account? (The kind I mean: "add 'gift' as a negative" on a product that sells mostly as a gift.)

**Sources:** experience + Rocco's free advice-check tool finding (in testing, 1 of 7 AI moves would have blocked a search with 30 orders: `docs/LEAD-MAGNETS.md`). Don't state the 1-of-7 figure as research in the post; it's from one test.

---

## r11 · Audit your tools against the Agent Policy

**Subs:** r/FulfillmentByAmazon, r/AmazonSeller · **Post:** any time · **Flair:** Account Health / Policy

**Title:** Every tool connected to your Seller Central is now your legal problem. A 15-minute audit for Amazon's Agent Policy.

**Body:**

Since Mar 4, 2026, Amazon's Business Solutions Agreement has a section on "automated software or AI agents." You accepted it by continuing to sell. The part people miss: if a tool breaks it, Amazon can act on *your* account.

The policy's basics: any automated tool or AI agent must identify itself as automated, follow the policy, and stop when Amazon tells it to.

**The 15-minute audit:**

1. **List everything connected.** Seller Central → Apps and Services → Manage your apps (or search "Manage your apps" if the new layout moved it). Also check the Ads console for connected partners. Write down every app, repricer, PPC tool, listing tool, inventory tool, and any script your team or VA runs.
2. **Remove what you don't use.** Old trials are the most common thing on the list.
3. **Kill shared logins.** If a VA, freelancer or agency logs in with *your* username and password, give them their own user with only the permissions they need (Settings → User permissions). Shared credentials are the first thing to fix.
4. **Flag browser bots.** Any tool that works by "logging in as you" in a browser (not through Amazon's official APIs) is the riskiest category under this policy.
5. **Email each vendor one question:** "How does your tool comply with Amazon's Agent Policy in the Business Solutions Agreement?" Keep the replies.

**By stage:**
- **Just starting:** easiest time to get this right. Use only apps from the Selling Partner Appstore, and give helpers their own logins from day one.
- **Under 10k a month:** do steps 1 to 3 today.
- **10k and up:** make it a quarterly check. Teams add tools quietly.

What's connected to your account that surprised you when you looked?

**Sources:** Amazon Seller Forums BSA update announcement (effective Mar 4, 2026), ecommercebytes.com (three requirements), feedvisor.com (account-level enforcement; eliminate shared credentials), estorefactory.com (browser automation and scraping tools in scope).

---

## r12 · Is your PPC agency doing a good job?

**Subs:** r/FulfillmentByAmazon, r/AmazonSeller · **Post:** any time · **Flair:** Discussion

**Title:** How to tell if your Amazon PPC agency (or freelancer) is doing a good job, even if you know nothing about PPC. 7 things to check.

**Body:**

No offence to agencies here. Plenty do great work, and this list makes the good ones look great. But a lot of brand owners pay a monthly fee and genuinely can't tell what they're getting. Here's how to check without becoming a PPC expert.

1. **Ask for the change history.** In the Ads console, open a campaign and click History: it lists bid, budget and status changes. A healthy account shows regular, small changes. Months of nothing is a red flag.
2. **Open the search term report** (last 30 days, sort by spend). Are the top money-burning searches (lots of clicks, zero orders) still running? Blocking those is the most basic job in PPC.
3. **Compare TACoS, not just ACoS.** TACoS = ad spend ÷ total sales. If ACoS improved but TACoS went up, ads are taking credit for sales you'd have had anyway.
4. **Ask "what did you try this month, and did it work?"** A good manager can answer in 3 sentences with numbers. "We optimized bids" is not an answer.
5. **Check your proven searches are in exact match.** If your best-selling searches only live in auto or broad campaigns, you're paying more for them than you need to.
6. **Look at how your fee is calculated.** A percentage of ad spend means more spend = bigger fee. That's not automatically bad, but you should know which way the incentive points.
7. **Same report, two periods.** Download the campaign report for the month before they started and the last 30 days. Did ACoS, waste and sales move? Results are what you pay for.

**By stage:**
- **Under 1k a month in ads:** an agency fee is often more than your ad spend. At this size, learning the basics yourself pays back fastest.
- **1k to 10k:** a freelancer or software usually makes more sense than a full agency. Check #2 and #5 monthly.
- **10k to 50k:** run this list every quarter. Share it with your agency. Good ones will welcome it.
- **50k and up:** you want people for strategy, creative and DSP. Ask which parts of your fee pay for those, and which pay for daily bid work that software now does.

Agency folks reading: what would you add? What do you wish clients checked?

**Sources:** History tab (Ads console) and Ads API change history: `docs/LEAD-MAGNETS.md` #03 data check. Don't quote the "about 90 days" API figure: it's unverified against Amazon's own docs.

---

## r13 · How much stock to send (and the Feb 1 low-inventory change)

**Subs:** r/FulfillmentByAmazon, r/AmazonSeller, r/AmazonFBA · **Post:** Dec 10 · **Flair:** Inventory / FBA

**Title:** The low-inventory fee changes on Feb 1. Here's the simple restock math I use, and how the new 28-day rule changes it.

**Body:**

Two ways to lose money on FBA stock: too little (stock-outs, lost rank, low-inventory fee) and too much (storage, aged inventory). The 2027 changes move both lines.

**What changes on Feb 1, 2027:**
- The low-inventory-level fee only applies when you're below **28 days of supply**, and it's measured on what actually shipped in the 4 weeks before and after the check, instead of trailing 30- and 90-day sales.
- Monthly storage and aged inventory merge into one rate based on how long units sit. Stock that sells within about 6 months should pay the same or less. Old stock pays more.

So the target got clearer: **stay above 28 days, don't hold much more than you'll sell in a few months.**

**The restock math (works at any size):**

Units to send = (daily sales × (lead time in days + days of cover you want)) − units you have (on hand + inbound)

Example: 20 a day, 45 days from order to "available", you want 45 days of cover after it lands. 20 × 90 = 1,800. You have 900 on hand and inbound. Send about 900.

- **Lead time** = supplier production + shipping + Amazon check-in. Use your *worst* recent time, not the average. Check-in alone can take a week or more.
- **Daily sales** = last 30 days, but adjust for seasonality. December sales are a terrible guide for February.

**What happens if you run out:** sales stop, your ads stop, and the rank you built drops. It usually takes weeks to recover, which is why running out costs more than the sales you missed that week.

**By stage:**
- **Just starting:** order less than you think for the first run, but set the reorder date the day the stock lands.
- **Under 1k a month:** a spreadsheet with this formula, checked every Monday, is all you need.
- **1k to 10k:** pause or lower ads on a product that's under 2 weeks of stock with no shipment close. Don't pay to run out faster.
- **10k and up:** plan January inbound around the storage reset. Anything that won't sell in 6 months shouldn't land in February.

How many days of cover do you aim for, and how did you land on it?

**Sources:** novadata.io summary of the 2027 announcement (28 days, actual shipments 4 weeks before/after, storage merge, 6 months). Formula is standard; example numbers are illustrative, keep the word "Example". Fee amounts weren't in the sources: don't quote one.

---

## r14 · Why your Buy Box disappears

**Subs:** r/FulfillmentByAmazon, r/AmazonSeller · **Post:** any time (best before a sale event) · **Flair:** Buy Box / Pricing

**Title:** Your Buy Box can disappear because you're cheaper somewhere else, even on your own Shopify store. Here's the checklist.

**Body:**

If your listing says "See all buying options" instead of "Add to Cart", the Buy Box is suppressed. Sales usually drop hard. One cause catches brand owners who are the only seller on their listing: **price on other sites.**

Amazon's position: listings stay eligible for the Buy Box when they're priced the same as or lower than the same product elsewhere. In practice:

- Amazon tracks prices on other sites (Walmart, your own store, other retailers).
- If it finds a lower one, the Buy Box can be removed until you match. The reason may show as a "competitive external price."
- Sellers in Seller Forums report this firing on their *own past Amazon deal price* or on a third party discounting their product. So it's not always your fault, but it's always your problem.
- Raising your price quickly can also trigger it. Agencies report that big increases in a short window (some say over 10% in 30 days) often cause suppression, though Amazon doesn't publish a limit.

**The checklist:**

1. Check the listing from a logged-out browser. Is there an "Add to Cart" button?
2. In Seller Central, check the pricing health / Featured Offer eligibility for the product. It usually shows the reason and the reference price.
3. Search your product on Google Shopping, Walmart and your own site. Find who's cheaper.
4. If it's you: match, or end the cheaper promo elsewhere. If it's a reseller: check your MAP and your distribution.
5. Raising prices? Do it in steps.

**By stage:**
- **Just starting:** if you also sell on your own site, keep Amazon's price the same or lower from day one.
- **Under 10k a month:** check your top 3 products before every sale event.
- **10k and up:** monitor Featured Offer eligibility daily on your top products. A day without the Buy Box on a best seller is a big number.

Has anyone got a suppression lifted by appealing, without changing price?

**Sources:** Amazon spokesperson to Fortune (eligibility when priced same or lower elsewhere). Seller Forums threads on "Competitive External Price" from own past deal price. Modern Retail (May 2025, agency observation on 10% in 30 days, Amazon publishes no limit). Business Insider via stackinfluence.com (Nov 2026: Amazon emails sellers cheaper elsewhere, can suppress Buy Box).

---

## r15 · 75-character titles, 4 months in

**Subs:** r/FulfillmentByAmazon, r/AmazonSeller, r/AmazonFBA · **Post:** any time · **Flair:** Listings

**Title:** Amazon titles are 75 characters now. 4 months in, here's how to use the 75 + 125 split well (with a template).

**Body:**

Since late July, titles in every category except media must be 75 characters or less, including spaces. You got a new field to make up for it: **item highlights, 125 characters,** which show with the title in search and on the product page, and are searchable. Amazon says more than 984 million titles were updated since June, and the rule applies to Amazon's own listings too.

If your title is still over 75, Amazon's AI rewrites it on its own schedule, and tools report that edits with an over-length title get rejected. So if you haven't fixed yours, Amazon may already have.

**Template that works for most products:**

Title (75): **Brand + what it is + the one detail that decides the purchase + size/count**
Highlights (125): **materials, compatibility, what's included, the main benefit, in plain words**

Example:
- Title: "Northfield Bamboo Cutting Board, Large 18x12 in, Juice Groove" (61)
- Highlights: "Organic bamboo, gentle on knife edges, reversible, non-slip feet, hand wash, fits standard sinks, gift box included" (115)

**3 checks:**
1. Search your product on your phone. Is the title fully visible? That's the point of the rule.
2. Is your main search phrase in the title, not just the highlights?
3. Did Amazon change your title without telling you? Check the live listing against what you think it says.

**By stage:**
- **Just starting:** write to 75 from the start. It forces you to know what actually sells your product.
- **Under 10k a month:** fix your top 5 listings by hand. Don't let the AI choose your words.
- **10k and up:** audit every listing quarterly. Compare conversion before and after title changes on your top sellers.

Did anyone see conversion change after cutting titles? Up, down, nothing?

**Sources:** Amazon Seller Forums announcement (Jun 10, 2026), ecommercebytes.com (start date extended to Aug 3; 984 million titles; applies to Amazon listings; 75 + 125 = 200), sellerengine.com (highlights searchable, shown with title), digitalapplied.com (AI rewrites over-limit titles), linnworks.com (over-length revisions rejected). "Northfield" is made up: keep it as an example, never as a real brand.

---

## r16 · Business Reports → Custom Analytics

**Subs:** r/FulfillmentByAmazon, r/AmazonSeller · **Post:** mid-December · **Flair:** Tools / Reports

**Title:** Amazon is nudging everyone from Business Reports to Custom Analytics by year-end. 5 views worth building before you're forced to.

**Body:**

If you've noticed Business Reports moved (it's under Site Map → Other resources now) and there's a banner asking you to switch to Custom Analytics "by year-end": that's real. Amazon hasn't announced a retirement date, but it's clearly the direction. Custom Analytics is free and pulls 100+ metrics from what used to be 15 separate reports.

Better to set it up on a quiet day than the week it disappears. **5 views worth building:**

1. **Sessions → conversion → units, per product, weekly.** The one view that tells you if a problem is traffic or the listing.
2. **Top 20% of products by sales, with their share of total.** Most catalogs are more concentrated than owners think.
3. **Products with sessions but zero sales** (last 30 days). Those are "zombies": people look and nobody buys. Fix the listing or stop advertising them.
4. **Buy Box percentage by product.** Anything under 95% on a product you're the only seller of is worth investigating.
5. **Year-to-date by month.** Download it before Jan 1 so you have this year in one file.

**And keep downloading the old Business Report** monthly until it's gone. Your historical comparisons depend on it.

**By stage:**
- **Just starting:** build view 1 only. It's the only one you need for a while.
- **Under 10k a month in ads:** views 1, 3 and 4.
- **10k and up:** all five, plus join it with your search term report monthly so you see ads and organic side by side.

Has anyone found something in Custom Analytics that Business Reports didn't show?

**Sources:** myamazonguy.com (new Seller Central layout, Business Reports location, banner "by year-end", no retirement date), Amazon Accelerate 2025 announcement on sellingpartners.aboutamazon.com (free, 100+ metrics from 15 reports).

---

## r17 · Your year in 10 numbers

**Subs:** r/FulfillmentByAmazon, r/AmazonSeller, r/AmazonFBA · **Post:** Dec 12 to 20 · **Flair:** Discussion

**Title:** Before Jan 1, pull these 10 numbers about your Amazon year. Takes 30 minutes and tells you more than any course.

**Body:**

Spotify does Wrapped for your music. Do it for your Amazon business. All of this comes from the Business Report (pick Jan 1 to today) and your search term report.

1. **Units sold ÷ minutes in the year so far.** "One sale every X minutes." Weirdly motivating.
2. **Share of sales from your #1 product.** Over 50% means one listing problem could halve your business.
3. **How many products made 80% of sales.** Usually far fewer than you'd guess.
4. **Your conversion rate (unit session %) for the year, per product.** Rank them.
5. **The hidden gem:** a product converting at 1.5× your average on little traffic. That's where more ads or better placement pays.
6. **The leaky bucket:** your highest-traffic product with below-average conversion. Fixing its listing is worth more than any ad change.
7. **Zombies:** products with traffic and zero sales.
8. **Buy Box percentage** on your top products. Anything under 95% you're the only seller of is a problem.
9. **Wasted ad spend:** spend on searches with clicks and no orders (last ~65 days is all Amazon keeps). Then translate it: "that's the price of N of my own products."
10. **Your one resolution:** the biggest number above that you can actually change in January.

**What to do with it:** post your top 3 numbers in your team chat or write them on a note. Next December, compare.

**By stage:**
- **First year:** numbers 1, 4 and 6 are the ones to learn from.
- **Under 10k a month in ads:** 5, 6 and 9 are where January's money is.
- **10k and up:** 2 and 3 are your risk. If one product is most of the business, January is for building the second one.

Share your personality: are you a one-hit wonder, a collector with 40 slow products, or the grinder with steady everything? (No revenue numbers needed.)

**Sources:** method only, no external claims. Matches the Seller Wrapped tool's slides (`docs/LEAD-MAGNETS.md`, Wrapped v2). ~65 days search term retention as in r07.

---

## r18 · The fight over AI shopping agents (and why Amazon-only brands should care)

**Subs:** r/ecommerce, r/FulfillmentByAmazon, r/AmazonSeller · **Post:** any time · **Flair:** News / Discussion

**Title:** Amazon spent 2026 fighting outside AI shopping agents, lost a big round in court, and then opened its own search to other stores. What it means if you only sell on Amazon.

**Body:**

Shoppers are starting to ask AI to find and buy things. Who controls that is the biggest fight in ecommerce right now. The short version:

- **Amazon blocks outside AI shopping agents.** It has blocked ChatGPT from shopping on its site, and requires AI agents to identify themselves.
- **Amazon vs Perplexity:** Amazon sued over Perplexity's Comet browser agent shopping on users' behalf. A judge blocked Comet in March 2026. In August, a federal appeals court overturned that, the first appeals ruling on whether AI agents acting for users can access platforms. The fight isn't over.
- **Amazon's own agent got bigger.** Alexa for Shopping replaced Rufus in May and sits in the main search bar.
- **And then Amazon went the other way:** on Nov 4 it launched Shop Direct Merchant Workspace, a free portal where other online stores upload their Google Shopping catalog to appear in Amazon search and Alexa for Shopping, with checkout on the merchant's own site.

**What it means for Amazon-only brands:**

1. **Outside AI assistants may not see your Amazon listing.** When a shopper asks ChatGPT for "the best bamboo cutting board," products that only exist on Amazon can be missing. A simple brand website with clear product pages is your insurance.
2. **Inside Amazon, the AI is the new first impression.** Your listing has to answer questions, not just rank for keywords (see the 75-character titles and item highlights).
3. **Competition on Amazon just got wider.** Stores that aren't Amazon sellers can now show up in Amazon search through Shop Direct.

**By stage:**
- **Just starting:** register your brand and buy the domain now, even if the site is one page.
- **Under 10k a month:** a basic site with one page per product, real photos and the same facts as your listing.
- **10k and up:** ask ChatGPT, Claude and Gemini your top 10 category questions every month and note whether you're mentioned. That's your "AI shelf" ranking.

Are you seeing any traffic or sales from AI assistants yet? I'm curious whether anyone can measure it.

**Sources:** decrypt.co (Amazon blocked ChatGPT; agents must identify), Bloomberg / geekwire.com (Mar 2026 injunction), Reuters via newcastleherald.com.au (Aug 2026 appeals court reversal, first appeals ruling), emarketer.com (Ninth Circuit vacated), CNBC via sellerapp.com (Alexa for Shopping May 13), stackinfluence.com (Shop Direct Merchant Workspace, Nov 4). `docs/AMAZON-GAPS.md` Gap 1 has more background.

---

## r19 · November changes you might have missed

**Subs:** r/FulfillmentByAmazon, r/AmazonSeller · **Post:** Nov 29 to Dec 3 · **Flair:** News

**Title:** 5 Amazon changes from November that got buried under Black Friday (one of them can block your listings)

**Body:**

Everyone's been heads-down on BFCM. Here's what changed while you weren't looking:

1. **Liability insurance (since Nov 2).** If you sell in Amazon's "enhanced safety" categories (11 of them, including children's products, cosmetics, ingestibles and lithium battery items), you now need at least 1M in commercial liability coverage, **regardless of sales volume**, existing listings included. The old "only once you pass 10k a month" threshold no longer protects small sellers in those categories. Check Seller Central for the approved ways to submit a policy.
2. **2027 fees announced (Nov 5).** Fulfillment up about 19 cents per unit on average from Jan 15. Storage resets Feb 1. (Full breakdown in my other post / happy to answer in comments.)
3. **Shop Direct (Nov 4).** Other online stores can now upload their catalog to appear in Amazon search and Alexa for Shopping, with checkout on their own site. More competition in search, from outside Amazon.
4. **Instagram + Amazon (Nov 16).** US creators in Amazon's influencer program can tag up to 30 Amazon products in a Reel and 20 in a feed post. Links open in the Amazon app. If you work with creators, ask them to tag the listing in the post itself.
5. **Price checks before deals.** Business Insider reported Amazon emailing sellers whose products are cheaper elsewhere and suppressing Buy Boxes until prices rise. Check other channels before every promo.

**By stage:**
- **Just starting:** #1 first. If your product is in a safety category, price the insurance into your margin before you order stock.
- **Under 10k a month:** #1 and #5.
- **10k and up:** #4 is the cheapest new traffic on this list if you have any creator relationships.

What else did I miss? Drop it below and I'll add it.

**Sources:** ppc.land and stackinfluence.com (insurance: 11 categories, 1M, regardless of sales, existing listings), ecommercebytes.com (effective Nov 2; Amazon says it will reject newly submitted policies not obtained through "AIA": check what that covers in Seller Central before saying more). 2027 fees: see r02. Shop Direct, Instagram tagging, Business Insider price emails: stackinfluence.com November 2026.

---

## After posting

- Log each post in the table below: date, sub, link, upvotes after 24h, comments, any DMs.
- After 10 posts, keep the top 3 formats and drop the bottom 3. Turn the winners into LinkedIn posts and X threads.
- A comment thread with a real question is gold for `lib/answers.ts`: add the question and answer there (it feeds rocco.works/answers).

| Post | Date | Sub | Link | Upvotes (24h) | Comments | Notes |
|---|---|---|---|---|---|---|
| r01 | | | | | | |
