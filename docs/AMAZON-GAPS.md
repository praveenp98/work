# Amazon problems the new connectors don't cover (research Nov 17, 2026)

Context: Amazon MCP connectors (Amazon Ads MCP, Helium 10, Teikametrics, Pacvue, Seller Labs, DataDoe, PPC Prophet, etc.) cover **ads, listing data, analytics and research inside Amazon**. This doc looks for pains **outside** that box.

---

## Gap 1: Amazon-only brands are invisible in ChatGPT / Perplexity / Gemini shopping ⭐ most promising
**The problem**
- Amazon updated robots.txt in Nov 2025 to block OpenAI's ChatGPT crawlers, effectively removing ~600 million products from ChatGPT's shopping results. Products sold only on Amazon don't appear in ChatGPT recommendations.
- Amazon also blocks other AI shopping agents (Perplexity's Comet: injunction March 2026; others reported blocked).
- ChatGPT Shopping Research launched Nov 24, 2025; OpenAI says shoppers ask ChatGPT ~50M shopping questions a day.
- Shopify and Etsy catalogs are included in ChatGPT automatically; other stores must apply via chatgpt.com/merchants.
- **Result:** thousands of Amazon-only brands (no DTC site) are losing the fastest-growing discovery channel, and most don't know it.

**Existing solutions (partial)**
- Rithum: ChatGPT product feed + ads feed, built for brands already on Rithum (enterprise)
- Ranketta: takes Google Merchant or **Amazon Marketplace XML feeds** → ChatGPT feed
- Lapis: catalog → ChatGPT ads (paid side)
- Nembol: multichannel listing tool with ChatGPT ads routes
- Writesonic and other AI-visibility trackers measure but don't fix Amazon-only gaps

**Possible product: "AI Shelf"**
- Import the Amazon catalog (flat file / SP-API with seller authorization; no scraping) → auto-build a fast, AI-readable **brand product site** (Product schema, llms.txt, FAQ blocks, comparison pages) + ChatGPT merchant feed + Google Merchant feed
- "Buy" links go to Amazon **with Amazon Attribution tags**, so brands earn the **Brand Referral Bonus** (Amazon credits back an average ~10% of sales driven by tagged external traffic)
- Monitor: "Does ChatGPT/Perplexity/Gemini recommend you for your category questions?" before vs after
- Pitch: **"Get found by ChatGPT, and get paid ~10% back by Amazon for it."**

**Risks / unknowns**
- Feed indexing takes ~1–4 weeks, so proof of results may land after Dec 16
- Need to confirm OpenAI merchant program accepts a brand site whose checkout is on Amazon
- Must follow Amazon Attribution / BRB policies; external traffic quality rules
- Ranketta-style tools could add the same pitch quickly

---

## Gap 2: CPSC eFiling (mandatory since July 8, 2026), mostly covered
- Importers of CPSC-regulated products (children's products, apparel, some electronics, household goods) must eFile certificate data (CPC/GCC, 7 data elements) in ACE before goods arrive; Amazon notified FBA sellers; the seller is usually the importer of record.
- **Already served:** Comply PRO+ (certificates + one-click Product Registry eFiling, Amazon service provider), SupplyScope, CPCReady (free CPC generator), CertPrepy (self-serve for small importers). CPSC's own free Product Registry exists.
- **Verdict:** real pain, but already crowded with purpose-built tools. ❌ Not a gap.

## Gap 3: Tariffs, HTS classification, landed cost, mostly covered
- De minimis ended for China-origin parcels; stacked tariffs; misclassification is costly.
- **Already served:** Avalara, Zonos, CalcMyTariff, BQool tariff forecast tool, Sellerboard guides, customs brokers.
- **Verdict:** ❌ Not a gap for a 30-day solo build.

## Other pains noted (not researched deeply)
- Amazon changing handling/transit times and "high price" alerts without consent (seller forum wish)
- Seller Central UX/support frustration (widely voiced; hard to productize)

---

## Honest summary
Most Amazon pains are being filled fast in 2026. **Gap 1 (Amazon-only brands invisible to ChatGPT shopping + Brand Referral Bonus angle)** is the least-served and has a sharp story, but results may take weeks to show, which is risky for a contest that ends Dec 16.
