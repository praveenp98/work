import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
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
    ];
  },
  async redirects() {
    return [
      { source: "/connect", destination: "/", permanent: true },
      { source: "/setup", destination: "/", permanent: true },
      { source: "/text", destination: "/", permanent: false }, // texting comes with the plan now (reminders card)
    ];
  },
};

export default nextConfig;
