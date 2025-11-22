import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/Origin',
  assetPrefix: '/Origin',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
