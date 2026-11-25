import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // PostHog through rocco.works/ingest so ad blockers don't drop the funnel (lib/analytics.ts).
  skipTrailingSlashRedirect: true,
  // Server-only parsers for emailed reports: load from node_modules at runtime instead of bundling
  // (unzipper, used by read-excel-file/node, optionally references the AWS SDK).
  serverExternalPackages: ["read-excel-file", "unzipper", "postal-mime"],
  // Old Claude/ChatGPT-connector landers (Nov 17–21): the product is now "connect Amazon, approve, Rocco makes it".
  // Security headers (docs/SECURITY.md). No script CSP (the hackathon tracker and analytics load scripts), but no
  // framing (clickjacking on "Approve"), no MIME sniffing, HTTPS only, and team pages never leak their link in a
  // Referer or get indexed.
  async headers() {
    const base = [
      { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
    ];
    const team = [{ key: "Referrer-Policy", value: "no-referrer" }, { key: "X-Robots-Tag", value: "noindex, nofollow" }, { key: "Cache-Control", value: "private, no-store" }];
    return [
      { source: "/:path*", headers: base },
      { source: "/w/:path*", headers: team },
      { source: "/me", headers: team },
      { source: "/mcp/:path*", headers: team },
      { source: "/admin/:path*", headers: team },
    ];
  },
  async rewrites() {
    const host = process.env.POSTHOG_HOST || "https://us.i.posthog.com";
    const assets = host.replace("://us.i.", "://us-assets.i.").replace("://eu.i.", "://eu-assets.i.");
    return [
      { source: "/ingest/static/:path*", destination: `${assets}/static/:path*` },
      { source: "/ingest/:path*", destination: `${host}/:path*` },
    ];
  },
  async redirects() {
    return [
      { source: "/connect", destination: "/", permanent: true },
      { source: "/setup", destination: "/", permanent: true },
      { source: "/free/claude-vs-rocco", destination: "/free/ai-ad-advice-second-opinion", permanent: true },
// Profile links (marketing/brand/profiles): one short link per account, so /admin/funnel can tell them apart.
      // Temporary redirects on purpose: the destination can change without browsers remembering the old one.
      ...[["x", "x"], ["ig", "instagram"], ["yt", "youtube"], ["linkedin", "linkedin"]].map(([path, source]) => ({ source: `/${path}`, destination: `/start?utm_source=${source}&utm_medium=bio&utm_campaign=profile`, permanent: false })),
            { source: "/text", destination: "/", permanent: false }, // texting comes with the plan now (reminders card)
    ];
  },
};

export default nextConfig;
