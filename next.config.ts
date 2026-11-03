import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: [
    '@whiskeysockets/baileys',
    'ws',
    'bufferutil',
    'utf-8-validate',
    'qrcode',
    'pino'
  ],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false
      };
    }
    return config;
  }
};

export default nextConfig;
