# Footage

Your own clips go here. The folder is gitignored (only this file is committed), so nothing you film lands in the repo.

Three shot types, one `shot` letter each:

| Shot | What | How it is cropped by default |
|---|---|---|
| `A` | Face cam, phone propped up | Fills the frame (`cover`). The crop holds on to the upper third, where your face is. Clip audio is on. |
| `B` | Built-in screen recording (Mac or phone) | Shown whole (`contain`) as a rounded card on the page background, so no UI is cut off. Audio is off. |
| `C` | Static desk clip | Fills the frame, centred, with a slow push-in. Audio is off. |

Film A vertically. It then fills 9:16 exactly, and 4:5 and 16:9 crop in on your face. If the crop misses, set `"focus": { "x": 0.5, "y": 0.25 }` (0 to 1 on each axis) or `"fit": "contain"`.

```json
{ "type": "footage", "duration": 3, "caption": "what you say", "props": { "src": "footage/day7-face.mp4", "shot": "A", "label": "day 7" } }
```

Other props: `startFrom` (seconds into the clip), `volume` (0 to 1), `pushIn`.

## Screen recordings of a real account

Never show real seller data, including your own test accounts, unless that seller agreed in writing. Record the sample account where you can. Where you cannot, blur it:

```json
{ "src": "footage/dashboard.mp4", "shot": "B", "blur": [{ "x": 0.1, "y": 0.3, "w": 0.8, "h": 0.2 }] }
```

Boxes are fractions of the output frame. Check every format after adding one: the clip sits in a different place in each.

Keep clips as `.mp4` (H.264) or `.mov`. A clip that is missing renders as a labelled slot instead of failing.
