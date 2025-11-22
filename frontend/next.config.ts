import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  output: 'export',
  basePath: isProd ? '/Origin' : '',
  assetPrefix: isProd ? '/Origin' : '',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
