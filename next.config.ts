import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Server-only parsers for emailed reports: load from node_modules at runtime instead of bundling
  // (unzipper, used by read-excel-file/node, optionally references the AWS SDK).
  serverExternalPackages: ["read-excel-file", "unzipper", "postal-mime"],
  // Old Claude/ChatGPT-connector landers (Nov 17–21): the product is now "connect Amazon, approve, Rocco makes it".
  async redirects() {
    return [
      { source: "/connect", destination: "/", permanent: true },
      { source: "/setup", destination: "/", permanent: true },
      { source: "/text", destination: "/", permanent: false }, // texting comes with the plan now (reminders card)
    ];
  },
};

export default nextConfig;
