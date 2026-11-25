# Beginner guides: /sell-on-amazon (live Nov 25, 2026)

One deep, sourced guide per marketplace plus a worldwide hub. 14 sections each (state of the market, what changed 2025–26, fit, account, every cost, tax, compliance, first product, fulfilment, first 90 days, ads, growth, mistakes, checklist), 13–14 FAQs, cited sources, Article + FAQPage + HowTo + Breadcrumb JSON-LD. Lead capture: "Get an email when <marketplace> changes fees or rules" (lead_magnet = sell-<slug>). Free tools linked after the costs, launch, ads and grow sections.

| Guide | URL | Sources |
|---|---|---|
| 🌍 Worldwide | https://rocco.works/sell-on-amazon | 49 |
| 🇺🇸 United States | https://rocco.works/sell-on-amazon/us | 37 |
| 🇬🇧 United Kingdom | https://rocco.works/sell-on-amazon/uk | 35 |
| 🇩🇪 Germany | https://rocco.works/sell-on-amazon/de | 33 |
| 🇨🇦 Canada | https://rocco.works/sell-on-amazon/ca | 33 |
| 🇮🇳 India | https://rocco.works/sell-on-amazon/in | 45 |
| 🇦🇺 Australia | https://rocco.works/sell-on-amazon/au | 35 |
| 🇯🇵 Japan | https://rocco.works/sell-on-amazon/jp | 35 |
| 🇦🇪 United Arab Emirates | https://rocco.works/sell-on-amazon/ae | 16 |

## How they were made and checked
1. Research agents drafted each guide (the source sites were blocked at first and the search budget ran out, so the drafts relied on search summaries).
2. Network opened to Amazon seller sites, Amazon fee PDFs, GOV.UK, canada.ca, ATO, UAE FTA, Japan NTA, CBIC and Marketplace Pulse.
3. A fact-check pass per guide opened the official pages, corrected numbers (e.g. AU referral table and card rules, DE double-counted €0.26, JP tax on referral fees, IN fee tables, UAE referral range/VAT/corporate tax, US seller counts and 2027 fee notice, UK Oct 2027 marketplace VAT change, hub's missing 2026 fuel surcharge) and softened anything still unconfirmed to "check in Seller Central / with <authority>".
4. Still not checkable from here (sites blocked or behind login): some customs/tariff pages (CBP, CBSA, ABF), some regulators (CPSC, ACCC, METI, MoIAT), per-tier US FBA rates. These are labelled in the text.

## Keeping them current
- Content lives in content/sell/<slug>.json; bump "updated" when editing. Tests: lib/sell.test.ts (citations resolve, 14 sections, ≥15 sources, depth).
- Re-check fees each January and after Amazon fee announcements (usually Dec/Jan and mid-year).
- Turn guides off instantly with SELL_PUBLISHED in lib/sell.ts.

## Posting
Reddit (r/FulfillmentByAmazon, r/AmazonSeller, r/AmazonFBA, r/IndiaBusiness for /in, r/UKBusiness for /uk): answer the beginner's actual question in the comment, link the guide section (e.g. /sell-on-amazon/us#costs) only where sub rules allow.
