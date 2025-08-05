/* eslint-disable @typescript-eslint/no-unused-vars */
import type { NextConfig } from "next";
import { platform } from 'os';

const isWindows = platform() === 'win32';

const nextConfig: NextConfig = {
  transpilePackages: ['@phaser-games/wildstrikes', '@shared'],
  // Platform-specific configuration
  ...(!isWindows && {
    // Linux/macOS: Turbopack configuration for better monorepo support
    experimental: {
      turbo: {
        root: '../..'
      }
    }
  }),
  // Enhanced webpack configuration for better monorepo support (fallback and Windows)
  webpack: (config, { isServer }) => {
    // Ensure proper path resolution for workspace dependencies
    config.resolve.symlinks = false;
    return config;
  }
};

export default nextConfig;
