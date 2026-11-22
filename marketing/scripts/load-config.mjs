/**
 * Load marketing/config/*.ts from plain Node scripts (lint, pdf, generators), with no build step and no packages.
 * Needs Node 22.18 or newer (built-in TypeScript type stripping). offer.ts imports lib/pricing.ts without a file
 * extension, the way Next.js and Remotion expect, so a small resolve hook adds ".ts" when Node can't find it.
 */
import { registerHooks } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const [major, minor] = process.versions.node.split(".").map(Number);
if (major < 22 || (major === 22 && minor < 18)) {
  console.error(`marketing scripts need Node 22.18 or newer (found ${process.versions.node}).`);
  process.exit(2);
}

// lib/pricing.ts sits under the app's package.json (no "type"), so Node prints a harmless reparse warning. Drop it.
const emitWarning = process.emitWarning;
process.emitWarning = (w, ...rest) => (rest.some((r) => r === "MODULE_TYPELESS_PACKAGE_JSON" || r?.code === "MODULE_TYPELESS_PACKAGE_JSON") ? undefined : emitWarning.call(process, w, ...rest));

registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (err) {
      if (/^\.{1,2}\//.test(specifier) && !/\.[cm]?[jt]sx?$|\.json$/.test(specifier)) return nextResolve(`${specifier}.ts`, context);
      throw err;
    }
  },
});

export const MARKETING_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const REPO_DIR = path.resolve(MARKETING_DIR, "..");

export async function loadConfig() {
  const at = (f) => pathToFileURL(path.join(MARKETING_DIR, "config", f)).href;
  const offer = await import(at("offer.ts"));
  const sample = await import(at("sample.ts"));
  return { ...offer, ...sample };
}
