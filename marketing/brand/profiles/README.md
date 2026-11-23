# Profiles

One folder per account: `copy.md` (exact text with character counts) and the images at the platform's exact size. Nothing here is uploaded by code. Praveen sets each profile up by hand.

- Text: edit `build-copy.mjs`, then `node marketing/brand/profiles/build-copy.mjs`. It stops if any field is over its limit.
- Images: edit `marketing/video/src/profiles/ProfileImage.tsx`, then `npm run profiles` in `marketing/video`.

## Same everywhere, different second line

| | X @roccoworks | Instagram rocco.works | LinkedIn page | YouTube | Praveen (LinkedIn, X @veenonx) |
|---|---|---|---|---|---|
| Picture | raccoon on green | raccoon on green | raccoon on green | raccoon on green | his own photo |
| Colour | page background, blue accent, green for approve | same | same | same | same banner style |
| One-liner | Your AI Amazon manager: you approve, Rocco does the rest. | same | same | same | "you approve, it does the rest" |
| Second line | Logged and undoable. 7-day money-back. | I find what to fix every morning. Any marketplace. | Ads, bids and stock, checked every morning. | Fix one Amazon ads problem at a time. | i run amazon accounts every day. |
| Voice | Rocco, "I" | Rocco, "I" | about Rocco, third person | about Rocco, third person | Praveen, lowercase |
| Link | rocco.works/x | rocco.works/ig | rocco.works/linkedin | rocco.works/yt | rocco.works/linkedin |
| Banner headline | You approve. Rocco does the rest. | (no banner) | You approve. Rocco does the rest. | Fix one Amazon ads problem at a time. | Your AI Amazon manager. You approve, it does the rest. |

Rules that hold on every account: the name in text is "Rocco"; "Not affiliated with Amazon" appears wherever Amazon's name is prominent; prices come from `marketing/config/offer.ts`; the guarantee is 7 days; any Bamboo & Co number carries "Sample account"; the price rise is worded "Prices go up every 5 hires: +$10 a month, +$100 a year." (every 5 hires).

## Not live yet

- `rocco.works/call`: there is no booking page (and the hackathon's self-serve rule is unresolved). Every place that would link it says so.
- YouTube: channel and handle don't exist yet.
