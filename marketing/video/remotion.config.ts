import { Config } from "@remotion/cli/config";
import { makeWebpackOverride } from "./webpack-override.mjs";

// `npm run studio` runs from marketing/video, so the working directory is this package.
Config.overrideWebpackConfig(makeWebpackOverride(process.cwd()));
Config.setVideoImageFormat("jpeg");
Config.setEntryPoint("src/index.ts");
