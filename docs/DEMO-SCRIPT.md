# Rocco demo film v2: script, shot list, recording guide, edit plan (Nov 24, 2026)

Goal: one 2-minute film that answers every question a seller has before paying, in the order they ask it, so the last frame is "Hire Rocco" and nothing is left to think about.
Also cut from the same footage: a 30-second version (X, Instagram, ads) and a 12-second hook (Reels and Shorts).

## What top-1% product demos do (and this one copies)
1. **The product in the first 3 seconds.** No logo intro and no "Hi, I'm…". Open on the payoff.
2. **One real account, real numbers.** Use your own brand (Habit Nest) if its jobs are in. Use the demo account only if they aren't, and label it "Example account" on screen.
3. **One voice and one story:** a morning with Rocco, start to finish.
4. **Answer objections before they form,** in this order: does it work → is it hard → is it safe → what does it cost → what if I don't like it.
5. **Show, then say.** Every claim in the voiceover is on screen at that moment.
6. **Cut every pause.** A new visual every 2–4 seconds, with captions on (85% of social video is watched muted).
7. **One call to action,** said once, with the guarantee in the same breath.

## The script (about 2:00, ~290 words; read it slower than feels natural)

| # | Time | Voiceover (word for word) | On screen (record this) | Edit notes |
|---|---|---|---|---|
| 1 | 0:00–0:07 | "This is my Amazon manager. It checks every ad, every search term and my stock every morning, and it costs less than one hour of an agency." | **Phone:** iMessage thread. You type "why did sales drop yesterday?" and Rocco's answer appears. | Cold open, no music for the first 2s, then the beat drops. Caption the question big. |
| 2 | 0:07–0:20 | "If you sell on Amazon, you know the job: wasted searches, bids, budgets that run out at lunch, stock, the Buy Box. It's a daily job. Most of us do it once a month." | Quick cuts: a messy search term report, Seller Central, a budget cap warning (blur account names). | Each cut ≤1.5s. Captions: "daily job · done monthly". |
| 3 | 0:20–0:38 | "Rocco does it every morning. You sign in with Google, connect Amazon on Amazon's own page, and tell it your strategy: profit or growth, your target, a budget limit, what never to cut. It says the plan back. That's setup." | Laptop: Hire → Google → Connect Amazon (Amazon's sign-in page) → **strategy card** → pick Profit first, type the budget → "Here's how I'll run it". | Speed-ramp the sign-in (4×). Zoom into the plan card. On-screen text: "2 minutes". |
| 4 | 0:38–1:05 | "Then every morning you get today's jobs, ranked by money, each with the reason. This search spent sixty dollars and never sold: block it. These four searches sell: give them their own exact campaign. I tap approve, and Rocco makes the change in Amazon." | Dashboard **Today**: KPI strip → job list → open one job → its reason → tap **Approve** → "Done in Amazon ✅". | Punch-in zoom on the reason text and on the Approve tap (click sound). Lower third: "Made in Amazon, not a to-do list". |
| 5 | 1:05–1:18 | "A week later it checks whether it worked, with the real numbers. And if something gets worse, one tap undoes it." | **Change log:** "✅ worked · $212/mo less wasted" → the Undo button. | Green flash on "worked". Caption: "measured, not promised". |
| 6 | 1:18–1:35 | "You don't even have to open the site. Ask it anything on iMessage, WhatsApp or Slack and it answers from your account. Reply YES, and it's done." | **Phone:** a question → answer with numbers → "YES G1" → "Done in Amazon ✅". Then 2s of Slack: "@Rocco what's wasting money?" | Split screen: phone left, Amazon change right. |
| 7 | 1:35–1:48 | "Nothing changes until you say so. Every change is checked with Amazon first, logged, and undoable. Restock plans, Buy Box and suppressed listings too." | Fast montage: approval chip "Approve every move", the change log, the restock card "Create plan in Amazon", the Buy Box alert. | Captions as ticks: ✓ you approve ✓ logged ✓ undo ✓ restock. |
| 8 | 1:48–2:00 | "It's two hundred seventy-nine dollars a month, flat. No percent of your ad spend. Try it on your own account for two weeks; if it's not worth it, every cent back. Hire Rocco at rocco dot works." | `/pricing` page → the Hire Rocco button. End card: **rocco.works** · $279/mo flat · 14-day money-back. | Music swells, then cuts on "rocco dot works". Hold the end card for 3s. |

**Optional founder face (strongly recommended):** a 4-second selfie clip after scene 1: "I built Rocco for my own Amazon brand." A real face lifts trust a lot for a $279 purchase.

**Honesty rules:**
- Every number on screen must come from the account shown.
- Never say "never changes without asking". Say "nothing changes until you say so"; autopilot is opt-in.
- The Dr. PPC comparison stays off this film. Keep it on /compare.

## The 30-second cut (X, Instagram, ads)
Scene 1 (7s) → scene 4 (approve → Done in Amazon, 10s) → scene 6 (YES G1, 6s) → scene 8 (price + guarantee, 7s).

## The 12-second hook (Reels and Shorts, 9:16)
"My Amazon manager answers texts." → phone Q&A → "YES" → "Done in Amazon ✅" → "rocco.works".

## How to record (about 45 minutes)
1. **Screen (laptop):**
   - Chrome, a clean profile with no bookmarks bar and no extensions visible.
   - Window 1440×900, page zoom 110%. Turn on Do Not Disturb.
   - Record with QuickTime → New Screen Recording (or OBS), one file per scene.
   - Move the mouse slowly; pause 1s before and after every click.
2. **Phone:** iOS Control Center → Screen Recording. Turn on Do Not Disturb, set the clock to 9:41 if you can, and use full battery.
3. **Voice:** record it **separately**, after the screen clips.
   - Quiet room (a closet full of clothes is great), phone 15 cm from your mouth, Voice Memos.
   - Read each scene 3 times; I'll pick the best take.
   - Smile while reading: it's audible.
4. **Face clip:** phone at eye level, window light in front of you, 3 takes.
5. **Data:**
   - Use Habit Nest if it has jobs (blur ASINs or anything private you don't want shown, or tell me and I'll blur it).
   - If not, record on rocco.works/demo and I'll add the "Example account" label.
6. **Send me:** attach the files in this chat, one per scene, named `s1-phone.mov`, `s3-laptop.mov`, `vo-s1-take2.m4a` and so on. If a file is too big, push it to the repo under `media/raw/` (each under 100 MB; export at 1080p).

## How I edit it (all in this session, with ffmpeg)
- Cut every gap over 0.3s from the voiceover; lay the screen clips to the voice.
- Punch-in zooms on clicks and reasons, speed-ramp the boring parts (sign-in, loading).
- Burned-in captions, 2–4 words at a time, large, bottom third (the same file works muted).
- Music under the voice at −24 LUFS, voice at −14 LUFS, small click sounds on taps.
- Exports:
  - 16:9 1080p for the site hero and /demo
  - 9:16 for Reels, Shorts and X
  - 1:1 for LinkedIn
  - a thumbnail frame
  - the site's video player swapped to the new file
- Music: a royalty-free track you pick (send the file), or I keep it voice plus subtle clicks only.

## Where AI video models (Seedance, Veo, Kling) help, and where they hurt
- **Use them only for the first 2–3 seconds or the end card,** e.g. the Rocco raccoon mascot "waking up at 6 AM" at a tiny desk, rubbing its eyes, opening a laptop that glows blue (Pixar-style 3D, warm morning light, 9:16 and 16:9). That's a scroll-stopper for ads.
- **Never for the product itself.** Faked UI or fake Amazon screens destroy trust and break the honesty rule. Every product shot must be a real screen recording.
- These models aren't reachable from this session. Generate the clip yourself and send it, and I'll cut it in.
