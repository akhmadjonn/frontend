import type { NextConfig } from "next";

// Next.js server-side proxy: the browser hits same-origin /api/v1/*, the
// Next.js standalone server forwards to the api container.
//
// We read the upstream INSIDE rewrites() so it's resolved at server boot,
// not at build time. With output:'standalone', top-level process.env reads
// are frozen during `next build` — using them for rewrite destinations
// would bake `localhost:8080` into the image and break in Docker.
const nextConfig: NextConfig = {
  output: 'standalone',
  rewrites: async () => {
    const upstream = process.env.API_UPSTREAM || 'http://api:8080';
    return [{ source: '/api/v1/:path*', destination: `${upstream}/api/v1/:path*` }];
  },
  // Legacy: landing used to live at /avtolider before being moved to /. Keep
  // the redirect so old bookmarks, shared links, and indexed URLs still work.
  redirects: async () => [
    { source: '/avtolider', destination: '/', permanent: true },
    { source: '/avtolider/:path*', destination: '/:path*', permanent: true },
  ],
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
  turbopack: {
    resolveAlias: {
      canvas: { browser: './empty-module.js' },
    },
  },
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
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
