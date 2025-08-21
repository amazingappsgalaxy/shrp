/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental features
  experimental: {
    scrollRestoration: true,
  },
  
  // Netlify deployment settings
  trailingSlash: false,
  output: 'standalone',
  
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    domains: [],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  
  // Static file serving
  async headers() {
    return [
      {
        source: '/testpics/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:path*',
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
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ]
  },
  
  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    // Optimize bundle size
    if (!dev && !isServer) {
      config.optimization.splitChunks.cacheGroups = {
        ...config.optimization.splitChunks.cacheGroups,
        framerMotion: {
          name: 'framer-motion',
          chunks: 'all',
          test: /[\\/\\]node_modules[\\/\\]framer-motion[\\/\\]/,
          priority: 30,
          reuseExistingChunk: true,
        },
        lucideReact: {
          name: 'lucide-react',
          chunks: 'all',
          test: /[\\/\\]node_modules[\\/\\]lucide-react[\\/\\]/,
          priority: 25,
          reuseExistingChunk: true,
        },
      }
    }
    
    return config
  },
  
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
