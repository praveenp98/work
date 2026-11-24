/**
 * Shared by `remotion studio` (remotion.config.ts) and scripts/render.mjs.
 * The studio imports a few files from the app (components/Rocco.tsx, lib/pricing.ts through marketing/config).
 * Those sit outside this package, so pin React to this package's copy: one React, never the app's.
 * `videoDir` is the absolute path of marketing/video.
 */
import path from "node:path";

export const makeWebpackOverride = (videoDir) => (config) => {
  const nm = (p) => path.join(videoDir, "node_modules", p);
  return {
    ...config,
    resolve: {
      ...config.resolve,
      alias: {
        ...(config.resolve?.alias ?? {}),
        "react/jsx-runtime": nm("react/jsx-runtime.js"),
        "react/jsx-dev-runtime": nm("react/jsx-dev-runtime.js"),
        react$: nm("react/index.js"),
        "react-dom$": nm("react-dom/index.js"),
      },
      modules: [nm(""), ...(config.resolve?.modules ?? ["node_modules"])],
    },
  };
};
