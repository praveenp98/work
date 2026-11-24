# Rocco video studio

Remotion project for Rocco's marketing videos. It has its own `package.json` and `node_modules`, so nothing here ships with, or slows down, the Next.js app. The app's `tsconfig.json` and `.vercelignore` both exclude `marketing/video`.

**Remotion licence:** Remotion is free for individuals and for companies of up to 3 people. Rocco is a solo founder, so no licence is needed today. If the team grows past 3 people, a company licence is required: check https://remotion.pro/license before that happens.

## Commands

Run these from `marketing/video/`. Needs Node 22.18 or newer.

```bash
npm install
```

```bash
npm run studio
```

```bash
npm run render -- --spec specs/demo.json --format all
```

`--format` takes `all`, `9x16`, `4x5`, `16x9` or a comma list. Output goes to `marketing/out/video/<spec id>-<format>.mp4` with a poster `<spec id>-<format>.png` next to it (gitignored).

Faster looks while you write a spec:

```bash
npm run render -- --spec specs/demo.json --format all --stills
```

`--stills` skips the video and writes one PNG per scene to `marketing/out/video/stills/` in a few seconds. `--draft` renders at half size. `--poster-only` writes only the posters.

The first render downloads Remotion's own headless Chrome. If that download is blocked, point `REMOTION_CHROME_EXECUTABLE` at a Chrome Headless Shell binary.

## More commands

```bash
npm run batch -- --spec specs/demo-30s.json --batch batches/demo-hooks.csv --format 9x16
```

One base spec, many hooks: each row of the CSV swaps the hook card and the end card's CTA (`--only h02,h05` picks rows, `--stills` checks every hook in seconds). Output: `marketing/out/video/<spec>-<row>-<format>.mp4`.

```bash
npm run capture
```

Records clean footage of the public site (hero loop, jobs, morning card, change log, compare table, messages, pricing, time calculator, Ad Roast and Account Check sample runs) into `footage/site/<name>-<format>.mp4`, ready to use as shot B. `--base http://localhost:3000` records the dev server, `--only` and `--format` narrow it. It never signs in, adds a "Sample account" chip wherever sample data shows, and blocks the trackers so recording doesn't count as traffic. Needs ffmpeg.

```bash
npm run profiles
```

Renders every profile picture, banner and cover into `marketing/brand/profiles/<account>/`.

## One source, three sizes

| Format | Size | For | Safe zone |
|---|---|---|---|
| `9x16` | 1080x1920 | Reels, Shorts, TikTok | nothing in the top 250px or the bottom 400px, 64px sides |
| `4x5` | 1080x1350 | Feed, LinkedIn | 70px top and bottom, 64px sides |
| `16x9` | 1920x1080 | X, YouTube | 70px top, 64px bottom, 110px sides |

Scenes never hardcode a canvas. They read their geometry from `src/layout.tsx` (`useAreas()`): `content` is where a scene draws, `caption` is the band at the bottom of the safe zone where captions sit. In 9:16 and 4:5 a scene stacks (heading, then the piece); in 16:9 it goes side by side. Full-bleed footage is the only thing that leaves the safe zone, and its label and captions stay inside it.

## Writing a video: the spec

A video is a JSON file in `specs/`: an ordered list of scenes with a duration (seconds) and a caption each. Every spec shows up in the Studio as a folder with its three formats. Types are in `src/spec.ts`.

```json
{
  "id": "day7-morning",
  "scenes": [
    { "type": "hook", "duration": 2.8, "caption": "what you say here", "props": { "lines": ["Line one", "Line two"], "highlight": ["two"] } },
    { "type": "ui", "duration": 6, "caption": "what you say here", "props": { "piece": "morning" } },
    { "type": "end", "duration": 4, "caption": "what you say here", "props": { "cta": "link in bio" } }
  ]
}
```

| `type` | Template | Main props |
|---|---|---|
| `hook` | HookCard: big 2-line hook, on screen in 0.3s | `lines` (1 or 2), `kicker`, `highlight` (words in blue), `wordByWord`, `mascot` |
| `ui` | UiScene: a real piece of Rocco's UI with a touch dot and a tap | `piece`: `connect`, `morning`, `job`, `approve`, `tidy`, `changelog-row`, `skip`, `before-rocco`, `pricing`. Also `cursor`, `interact`, `index`, `taps` |
| `phone` | PhoneTextScene: phone thread with typing dots | `style`: `imessage`, `whatsapp`, `slack` (generic looks, no logos). `messages` defaults to the homepage thread |
| `changelog` | ChangeLogScene: rows flip from checking to worked or reverted, then the Before Rocco note | `rows`, `beforeRocco` |
| `compare` | CompareScene: two-column table, rows one by one | `leftTitle` (a category, never a named product), `rightTitle`, `rows` |
| `stat` | StatScene: one number and its source | `value`, `source` (required), `label`, `kicker` |
| `footage` | FootageScene: your own clip | `src`, `shot` (`A`, `B`, `C`), `startFrom`, `fit`, `focus`, `volume`, `label`, `blur` |
| `end` | EndCard: rocco.works, price, guarantee, price rise, CTA, mascot | `cta`, `mascot` |

`ui`, `phone`, `changelog` and `compare` also take `kicker`, `title` (a string or a list of lines), `blueLine` and `headingIn` (`"wide"` keeps the heading for 16:9 only, which gives a tall piece like the morning card the whole frame in the vertical formats).

`specs/demo.json` uses every template once. `specs/demo-pieces.json` shows every `ui` piece and chat look: render its stills after any change to the site's CSS.

### Prices are never typed

Specs are JSON and cannot import the offer, so they use tokens that are filled in from `marketing/config/` at render time:

```json
{ "type": "stat", "duration": 3.5, "props": { "value": "{{offer:timeMath.monthlyText}}/mo", "source": "{{offer:timeMath.hoursPerDay}} hr/day at ${{offer:timeMath.ratePerHour}}/hr" } }
```

`{{offer:path}}` reads `marketing/config/offer.ts` (`OFFER`), `{{sample:path}}` reads `marketing/config/sample.ts` (`SAMPLE`). A token that does not exist stops the render. The end card and the pricing piece read the offer directly. When the price rises, change `PLAN` in `lib/pricing.ts` and render again.

### Rules the code enforces

- **Sample label.** Every `ui` piece that shows the sample account, any phone thread that mentions Bamboo & Co or a dollar figure, the change log, and any stat whose value is a sample number, gets a "Sample account" chip in frame for the whole scene. It cannot be switched off.
- **No source, no number.** `stat` refuses to render without `source`, and the render script rejects the spec first.
- **No count-ups.** Numbers appear whole, so no frame ever shows a number that is not real.
- **Captions are always on.** A scene with no `caption` (and no captions file) gets a warning at render time.
- **Copy lint.** Specs are linted with everything else: `node marketing/scripts/lint-copy.mjs` from the repo root.

## Captions

Each scene's `caption` is split into lines of 3 to 5 words and timed across that scene, with the current word highlighted. It is an estimate, good for sound-off reading and for videos without a voice.

When you record a voice, use real timings instead:

```json
{ "id": "day7", "captions": { "src": "captions/day7.srt" }, "scenes": [] }
```

Put the file in `captions/`. `.srt` works as is. `.json` can be cues (`[{ "text", "start", "end" }]`, seconds) or word timings (`[{ "word", "start", "end" }]`, the shape most transcription tools export), which gives exact word highlighting.

## Your footage

Put clips in `footage/` (gitignored: they stay on your machine). See `footage/README.md` for how each of the three shots is cropped. A clip that is not on disk renders as a labelled slot, so a spec can be written and reviewed before anything is filmed.

## Music

No music is bundled. See `music/README.md`.

## Where the design comes from

Nothing is redrawn by eye:

- **CSS:** `scripts/prepare.mjs` copies `app/globals.css` and `app/connect.css` into `src/generated/site.css` before every studio start and render, scoped under `.rv`. UI pieces use the site's own class names, so they change when the site does.
- **Fonts:** Raleway 400/500/600 and Inter variable, the same Google Fonts files `next/font` serves on the site, bundled through Fontsource so renders work offline.
- **Mascot:** `components/Rocco.tsx`, imported directly.
- **Tokens:** `src/theme.ts` mirrors the site's `:root` values for video-level text.
- **UI pieces** (`src/ui/`): ports of the site components with the same markup and copy. The originals run on timers and CSS animations, which a frame-by-frame renderer cannot seek, so each port takes its state from the frame number instead.

| Piece | Ported from |
|---|---|
| `MorningCard`, `ApproveRow` | `components/home/HeroDashboard.tsx` |
| `JobCard` | `JobCard` in `components/dash/JobCards.tsx` |
| `ChangeLog` | `components/home/LogDemo.tsx` |
| `SkipReasons` | `.hlearn` block in `app/page.tsx` |
| `PricingCard` | `components/PricingPlans.tsx` |
| `Tidy` | `components/dash/TidyClient.tsx` |
| `Phone` | `.hphone` frame from `components/home/HowItHappens.tsx`, chat chrome is generic |
| compare table | `VS` in `app/page.tsx` |

Emoji use the system emoji font, as on the site: a render on a Mac shows Apple emoji, a render on Linux shows Noto.

## Folder map

```
specs/        one JSON per video
footage/      your clips (gitignored)
music/        royalty-free tracks you add (gitignored)
captions/     .srt or .json caption files
scripts/      render.mjs, prepare.mjs
src/scenes/   the nine templates
src/ui/       ported site UI, Fit (scaling), Cursor, SampleChip
src/          Video.tsx (spec to video), Root.tsx (compositions), layout, theme, captions, tokens
```
