# Kill or keep: "TrustMRR but for ads" (Nov 17, 2026, 02:30 IST)

Idea: a TrustMRR-style public leaderboard/marketplace for ads, with content pulled from the Meta Ad Library API or other ad-data providers.

## Verdict: KILL the Ad Library version. Mutation parked (low odds).

### Why it dies
1. **The API can't feed it.** Meta's Ad Library API returns commercial ads only if they reached the EU/UK; elsewhere only political/issue ads. Even then it has **no spend, impressions or results** for commercial ads. A "trust" site with no performance numbers has nothing to verify.
2. **Third-party ad data = ad-spy tools,** a crowded category (Foreplay, Gethookd, BigSpy, AdSpy, Minea, PiPiAds, Atria, ShortsIntel, AdMapix…). Reselling their data is a thin wrapper with nothing defensible.
3. **"Verified ROAS" is not truth.** Meta-reported ROAS is attribution that often over- or under-reports versus real revenue, so a leaderboard of Meta ROAS is easy to attack.
4. **A verified-results leaderboard for media buyers already exists** (e.g. SenseiRanks' paid ads leaderboard).
5. **Cold start + who pays:** it needs hundreds of verified profiles before brands care, and ad accounts belong to clients (permission problem). Meta app review / business verification for ads_read on other people's accounts takes time.
6. Many hackathon entrants will build "TrustMRR for X" clones because the host made TrustMRR, so it's not unique there either.

### Only salvage (parked)
"Verified ad spend managed" profiles for media buyers/agencies: OAuth read-only to Meta Marketing API, show **verified spend managed + account count** (hard to fake) rather than ROAS. Buyers pay $49–199/yr for a verified badge; brands browse free. Reachable audience (FB ads communities, X, Reddit), and it fits Praveen's FB ads background. Still a cold-start marketplace in 29 days. **Odds: P($15K+) ~3–4% · P(#1) <1%.**

### Recommendation
Kill. Homebuyer Case Builder (`HIGH-TICKET-SCAN.md`) remains the strongest fit.
