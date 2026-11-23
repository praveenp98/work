# Signature elements

Four things that show up in every Rocco asset, so it is recognisable without the logo. Use these, don't rebuild them.

| Component | What it is | Needs the site's CSS? |
|---|---|---|
| `MorningListCard` | The morning list: the homepage hero dashboard with the day's jobs | Yes |
| `ChangeLog`, `ChangeLogRow` | The change log, or one row of it ("worked", "reverted") | Yes |
| `YesBubble`, `RoccoBubble` | The seller's "YES" reply and Rocco's side of the thread | No |
| `SampleChip` | The "Sample account" chip | No |

```tsx
import { ChangeLogRow, MorningListCard, SampleChip, YesBubble } from "marketing/brand/components";
```

**The site's CSS.** `MorningListCard` and `ChangeLog` use the site's own class names so they can never drift from rocco.works. They need that stylesheet on the page:
- inside the Next.js app it is already there (see `app/brand/page.tsx`);
- in the video studio it is copied in, scoped under `.rv`, by `marketing/video/scripts/prepare.mjs`;
- for a standalone HTML template, run that script and load `marketing/video/src/generated/site.css` inside a `<div class="rv">`.

**The sample account.** The morning list, the change log and any bubble with a number show Bamboo & Co, which is made up. Put a `SampleChip` next to them, every time. `size` on the chip and the bubbles is the font size in px for your canvas (`TYPE[format].chip` in `../tokens.ts`).

Colours, type sizes, safe zones and radii come from `../tokens.ts`. Logo files are built by `../build-logos.mjs` into `public/brand/logos/`.
