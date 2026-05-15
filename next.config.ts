import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // No `images.remotePatterns` needed: uploaded images are served same-origin
  // from /api/images/[id], so next/image treats them as local paths.
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
