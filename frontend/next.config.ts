import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable hot reload in Docker
  experimental: {
    // Enable hot reload for Docker development
  },
  // Configure for Docker development
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
  // Enable polling for file changes in Docker
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
};

export default nextConfig;
