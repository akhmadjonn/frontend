import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
        {
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), geolocation=()',
        },
      ],
    },
  ],
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
