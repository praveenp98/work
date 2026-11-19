import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Server-only parsers for emailed reports: load from node_modules at runtime instead of bundling
  // (unzipper, used by read-excel-file/node, optionally references the AWS SDK).
  serverExternalPackages: ["read-excel-file", "unzipper", "postal-mime"],
};

export default nextConfig;
