import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Generate a static export suitable for Cloudflare Pages static hosting
  output: "export",
};

export default nextConfig;
