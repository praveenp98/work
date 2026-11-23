#!/usr/bin/env node
/**
 * Renders every profile image (avatars, headers, covers, banners) at each platform's exact size into
 * marketing/brand/profiles/<account>/.   npm run profiles
 * The list lives in src/profiles/ProfileImage.tsx (PROFILE_IMAGES). Nothing is uploaded anywhere.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { getCompositions, renderStill } from "@remotion/renderer";
import { makeWebpackOverride } from "../webpack-override.mjs";
import { prepare } from "./prepare.mjs";

const VIDEO_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.resolve(VIDEO_DIR, "..", "brand", "profiles");
await prepare();
const serveUrl = await bundle({ entryPoint: path.join(VIDEO_DIR, "src", "index.ts"), webpackOverride: makeWebpackOverride(VIDEO_DIR), publicDir: path.join(VIDEO_DIR, "public") });
const browserExecutable = process.env.REMOTION_CHROME_EXECUTABLE || undefined;
const comps = (await getCompositions(serveUrl, { browserExecutable, logLevel: "error" })).filter((c) => c.id.startsWith("profile-"));
for (const composition of comps) {
  // id is "profile-<account>-<name>-<w>x<h>": the account is the folder.
  const rest = composition.id.replace(/^profile-/, "");
  const account = ["linkedin-company", "linkedin-praveen", "instagram", "youtube", "x"].find((a) => rest.startsWith(`${a}-`));
  const output = path.join(OUT, account, `${rest.slice(account.length + 1)}.png`);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  await renderStill({ composition, serveUrl, output, inputProps: composition.defaultProps, imageFormat: "png", browserExecutable, logLevel: "error" });
  console.log(`${composition.width}x${composition.height}  ${path.relative(path.resolve(VIDEO_DIR, "..", ".."), output)}`);
}
console.log(`${comps.length} images.`);
