import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9000',
        pathname: '/autotest-images/**',
      },
      {
        protocol: 'https',
        hostname: 'localhost',
        port: '9000',
        pathname: '/autotest-images/**',
      },
    ],
  },
};

export default nextConfig;
