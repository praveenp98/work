/**
 * Records the 2-minute demo film: /demo/film (components/demo/DemoApp.tsx, film mode) → public/demo/rocco-demo.mp4 + poster.
 * Usage: start the app (npx next start -p 3125), then: node scripts/record-demo.js http://localhost:3125 <tmpdir>
 * Captures screenshots in a timed loop (Playwright's built-in video recorder freezes on this page) and stitches them
 * with ffmpeg using each frame's real duration. Needs Playwright (pre-installed) and ffmpeg. Re-run when the demo changes.
 */
const { chromium } = require("playwright");
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

(async () => {
  const base = process.argv[2] || "http://localhost:3125";
  const tmp = process.argv[3] || fs.mkdtempSync("/tmp/rocco-rec-");
  const frames = path.join(tmp, "frames");
  fs.rmSync(frames, { recursive: true, force: true });
  fs.mkdirSync(frames, { recursive: true });
  const out = path.join(__dirname, "..", "public", "demo");
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  await page.goto(`${base}/demo/film?manual`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => !!window.__roccoFilm, null, { timeout: 30_000, polling: 250 }); // hydrated
  await page.waitForTimeout(800);
  await page.evaluate(() => window.__roccoFilm.start());
  const t0 = Date.now();
  const list = [];
  let i = 0;
  let endAt = 0;
  while (Date.now() - t0 < 200_000) {
    if (!endAt && (await page.evaluate(() => window.__roccoFilm.done))) endAt = Date.now() + 1500; // hold the last frame briefly
    if (endAt && Date.now() > endAt) break;
    const at = Date.now();
    const f = path.join(frames, `f${String(i).padStart(5, "0")}.jpg`);
    await page.screenshot({ path: f, type: "jpeg", quality: 90 });
    list.push({ f, at: at - t0 });
    i++;
    const wait = 125 - (Date.now() - at); // ~8 fps
    if (wait > 0) await page.waitForTimeout(wait);
  }
  await browser.close();
  // ffconcat with real per-frame durations
  const lines = ["ffconcat version 1.0"];
  list.forEach((x, k) => { lines.push(`file '${x.f}'`); lines.push(`duration ${(((list[k + 1]?.at ?? x.at + 1000) - x.at) / 1000).toFixed(3)}`); });
  lines.push(`file '${list[list.length - 1].f}'`);
  const concat = path.join(tmp, "frames.txt");
  fs.writeFileSync(concat, lines.join("\n"));
  const mp4 = path.join(out, "rocco-demo.mp4");
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", concat, "-vf", "fps=30,format=yuv420p", "-c:v", "libx264", "-preset", "slow", "-crf", "22", "-movflags", "+faststart", "-an", mp4], { stdio: "inherit" });
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-ss", "11", "-i", mp4, "-frames:v", "1", "-q:v", "3", path.join(out, "rocco-demo.jpg")], { stdio: "inherit" });
  console.log("frames", list.length, "wrote", mp4, fs.statSync(mp4).size, "bytes");
})();
