/**
 * The site's fonts: Raleway 400/500/600 (display) and Inter variable (body), the same Google Fonts files that
 * next/font serves on rocco.works (app/layout.tsx), bundled here through Fontsource so renders work offline.
 */
import "@fontsource/raleway/latin-400.css";
import "@fontsource/raleway/latin-500.css";
import "@fontsource/raleway/latin-600.css";
import "@fontsource-variable/inter/index.css";
import { continueRender, delayRender } from "remotion";

let loaded = false;
export const fontsLoaded = () => loaded;

const WANT = ['400 20px "Raleway"', '500 20px "Raleway"', '600 20px "Raleway"', '400 20px "Inter Variable"', '600 20px "Inter Variable"', '700 20px "Inter Variable"'];

export const fontsReady: Promise<void> = (async () => {
  if (typeof document === "undefined") return;
  const handle = delayRender("Loading Raleway and Inter");
  try {
    await Promise.all(WANT.map((f) => document.fonts.load(f)));
    await document.fonts.ready;
  } finally {
    loaded = true;
    continueRender(handle);
  }
})();
