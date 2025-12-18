import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  // Removed 'output: export' to enable API routes
  // basePath and assetPrefix only for GitHub Pages - remove for Vercel
  basePath: '',
  assetPrefix: '',
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_BASE_PATH: '',
  },
};

export default nextConfig;
