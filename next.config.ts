import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9000',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '9000',
      },
      {
        protocol: 'https',
        hostname: process.env.NEXT_PUBLIC_MINIO_HOST || 'localhost',
      },
      {
        protocol: 'http',
        hostname: process.env.NEXT_PUBLIC_MINIO_HOST || 'localhost',
      },
    ],
  },
};

export default nextConfig;
