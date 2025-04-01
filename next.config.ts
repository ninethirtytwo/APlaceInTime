import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.scdn.co',
        port: '',
        pathname: '/image/**', // Allow any image path from this host
      },
    ],
  },
  /* other config options can go here */
};

export default nextConfig;
