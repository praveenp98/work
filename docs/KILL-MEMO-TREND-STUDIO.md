# Kill memo + fixes: Desi AI Trend Studio (idea K)

Date: Nov 17, 2026 · Status: under review (no build decision yet)

Original idea: Indian users put their own photo into the day's viral AI trend (photo/video), pay ₹49–99 via UPI; add a Shaadi trailer at ₹499–1,999.

---

## Part 1: Why it will NOT make it (the kill)

1. **The thing you'd sell is free.** India's biggest AI photo trends (Nano Banana 3D figurines, vintage saree portraits) ran on **free Gemini**, which went #1 in India's app stores on the back of them. Trends spread as "copy this prompt" posts. Why would anyone pay ₹99 for what Gemini, Meta AI and CapCut templates do free?
2. **Video costs real money even if the contest ignores it.** Image-to-video APIs run ~$0.03–0.70 per second; a typical 8-second clip costs ~$0.93 (median, Oct 2026), and retries push effective cost up. At ₹49–99 a video, margins are thin, and **every free preview burns cash**. AI costs don't reduce the contest score, but they drain your bank account upfront.
3. **India's 2026 deepfake rules hit this exact product.** Since Feb 20, 2026, intermediaries that enable creating AI content must prominently label it, embed non-removable metadata, get user declarations, take down unlawful content in as little as 2–3 hours, and can be required to share deepfake creators' identity with victims. An open "upload any face" tool invites misuse (people uploading other people's photos), and you'd be on the hook, solo, 24/7.
4. **Trends die before you ship.** Viral templates last days. "Sheru Bhai" interest peaked around Nov 11; by the time a template is built, tested and posted, the wave has moved. Staying on top means daily trend-spotting + template building + moderation, alone, for 29 days.
5. **Low ticket needs huge volume.** ₹99 × ~15,000 paid videos ≈ ₹15 lakh (~$17K). That's ~500 paid videos a day, every day, from a brand-new site.
6. **Payment friction kills impulse buys.** Instagram → website → UPI checkout for a ₹49 impulse loses most people at each step. Razorpay KYC activation also takes days.
7. **Virality doesn't come back to you.** People crop watermarks, download and repost. The share helps the trend, not your brand.
8. **Model providers may block it.** Some video models restrict photorealistic real-person inputs, minors, or public figures; policies change without notice.

**Verdict:** high-variance, cash-burning, legally exposed, and competing with free. Realistic odds of $15K+: lower than the 10% estimated earlier, closer to 5%.

---

## Part 2: The fixes (the version that could work)

**Core flip: stop selling trends. Sell emotional occasions people already pay for, and use trends only as free marketing.**

| Kill | Fix |
|---|---|
| 1. It's free in Gemini | Don't sell photo trends. Sell what free tools can't do in one tap: **finished, personal occasion videos** (couple/family, Hinglish voice-over, music, multi-shot, WhatsApp-ready). People pay for gifts and weddings, not for trends |
| 2. Video costs | Free tier = **image only** (cheap). Video only after payment. Low-res 3-second preview; capped retries; pick the cheapest model that passes quality (Seedance/Kling/Veo Lite class) |
| 3. Deepfake rules | Narrow, consent-based use cases (your own wedding, your family): consent checkbox + uploader declaration, **visible "AI-generated" label + embedded metadata** on every output, no public figures, no minors as the main subject, report button + takedown process, keep logs |
| 4. Trends die | Build on **evergreen occasions**: wedding season (Nov–Feb peak), birthdays, anniversaries (daily), Christmas/New Year (Dec). Trends become free lead magnets and reels, not the product |
| 5. Low ticket | **Raise the ticket:** greetings ₹299, birthday/anniversary video ₹499–999, **Shaadi pack ₹1,999–4,999** (cinematic invite trailer + save-the-date + sangeet countdown series + thank-you video) |
| 6. Payment friction | Mobile-first page with UPI intent (pay in 1 tap), Razorpay applied **today**, WhatsApp delivery of the final file |
| 7. Virality leaks | **Wedding invites are forwarded to 200–500 guests each** → put a tasteful "Made with [brand]" end-card on every invite. Each wedding = hundreds of relatives who also have weddings coming. That's the loop |
| 8. Model policies | Use the user's own photos only, test 2 providers, keep a fallback model |

**Renamed concept: "AI Shaadi & Occasion Studio"**, a cinematic personal video for your wedding or your family's big day, in 10 minutes, delivered on WhatsApp.

**Money math (illustrative):** 300 Shaadi packs × ₹2,999 ≈ ₹9 lakh + 3,000 occasion videos × ₹299–499 ≈ ₹9–15 lakh → **~₹18–24 lakh (~$21–28K)**.

**Competition to beat:** InVideo, Dreamina/CapCut, ImagineArt, local invite apps and Fiverr designers (₹500–2,000, takes days). Edge = the couple themselves in a Bollywood-style cinematic trailer, Hinglish voice-over, delivered in minutes, WhatsApp-native.

**Distribution:** Instagram reels of real (consented) outputs, wedding-season hashtags, the user's own contacts' weddings first, wedding planners/photographers as partners (they resell), every invite forwarded to hundreds of guests.

**Remaining honest risks:** quality of face consistency in video; refund requests if a couple dislikes the result (refunds reduce score); building a reliable multi-shot pipeline in days; wedding buyers are picky.

### Market timing check (researched Nov 17, 01:40 IST)
- **Past CAIT estimates:** 2023: ~35 lakh weddings (Nov–mid Dec, 11 dates) · 2024: 48 lakh (Nov 12–Dec 16, 18 dates) · 2025: ~46 lakh (Nov 1–Dec 14).
- **No CAIT number found for 2026 yet.** Drik Panchang lists only **11 dates** in this window: **Nov 21, 24, 25, 26** and **7 dates in December, the last on Sat Dec 12**, then **no dates from Dec 13 to Jan 14, 2027**. (Regional calendars differ slightly.)
- **My estimate (not data):** at ~2.7–3.2 lakh weddings per auspicious date (2023–24 ratios), Nov 21–Dec 12, 2026 ≈ **30–35 lakh (3–3.5M) Hindu-calendar weddings**, plus Christian/Muslim/court weddings.
- **Timing catch:** invites go out ~2–6 weeks before the wedding, so **most invites for Nov 21–Dec 12 weddings are already made.** What's still sellable in the contest window:
  - for these weddings: sangeet/haldi teasers, "shaadi countdown" reels, reception and **thank-you videos**, highlight reels from family photos
  - for the **Jan 18–Mar 2027 season** (Drik: 40 dates from Nov 21 to Mar 14): **save-the-dates and invite trailers get made in December** → squarely inside the contest window
- **Scale check:** 300 Shaadi packs = about 1 in 10,000 of this window's weddings.

**Revised odds:** P($15K+) ≈ 12% · P(#1) ≈ 3%, slightly better than the original because of higher tickets and the built-in forwarding loop, but still execution-heavy.
