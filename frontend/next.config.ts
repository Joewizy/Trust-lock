import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-checkbox'],
  },
  images: {
    formats: ['image/webp', 'image/avif'],
  },
};

export default nextConfig;
