/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // Enable optimization for production
    unoptimized: false,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'buyussagywhwcgxnieui.supabase.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    qualities: [75, 85, 90],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion', 'date-fns'],
    serverActions: {
      allowedOrigins: ['localhost:3000', '10.81.17.116:3000', '192.168.56.1:3000'],
    },
  },
}

export default nextConfig
