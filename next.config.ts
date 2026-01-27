import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimize for production
  reactStrictMode: true,

  // Vercel deployment optimization
  poweredByHeader: false,

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
};

export default nextConfig;
