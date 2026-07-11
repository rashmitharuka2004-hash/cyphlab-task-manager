import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // This allows production builds to complete successfully even if
    // there are minor stylistic linting warnings left in the workspace
    ignoreDuringBuilds: true,
  },
  // Keep any other existing configuration options you have here...
};

export default nextConfig;
