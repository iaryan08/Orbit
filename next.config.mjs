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
    // Avoids shipping server-only code to the client bundle
    serverComponentsExternalPackages: ['geo-tz'],
    serverActions: {
      allowedOrigins: ['localhost:3000', '*.vercel.app'],
    },
  },
  images: {
    unoptimized: false,
    formats: ['image/avif', 'image/webp'],
    qualities: [75, 85],
    deviceSizes: [360, 640, 750, 1080, 1920],
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
}

export default nextConfig
