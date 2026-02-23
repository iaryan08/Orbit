/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Compress responses (gzip) — significant bandwidth & parse time reduction
  compress: true,
  // Power-user: inline small CSS for critical path
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      'date-fns',
      '@supabase/supabase-js',
      '@supabase/ssr',
    ],
    serverActions: {
      allowedOrigins: ['localhost:3000', '*.vercel.app'],
    },
  },
  // Avoids shipping server-only code to the client bundle
  serverExternalPackages: ['geo-tz'],
  images: {
    unoptimized: false,
    formats: ['image/avif', 'image/webp'],
    qualities: [50, 55, 75, 85],
    deviceSizes: [360, 640, 750, 1080, 1920],
    minimumCacheTTL: 2678400,
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },
  // Trace geo-tz data for serverless functions
  outputFileTracingIncludes: {
    '/**': ['./node_modules/geo-tz/**/*'],
  },
  async headers() {
    if (process.env.NODE_ENV !== 'production') {
      return []
    }

    return [
      {
        source: '/_next/static/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/images/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/favicon.ico',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/site.webmanifest',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }],
      },
    ]
  },
}

export default nextConfig
