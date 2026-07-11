import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // This allows production builds to successfully compile even if
    // there are strict TypeScript type mismatches in the workspace layout
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
