/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    // Enable React 19 features
    serverActions: true,
    serverComponents: true,
    // Optimize for concurrent rendering
    optimizeCss: true,
    // Improve bundle size
    optimizePackageImports: ['@excalidraw/excalidraw', 'lodash'],
  },
  // Ensure compatibility with Excalidraw
  webpack: (config) => {
    config.externals = [...(config.externals || []), { canvas: 'canvas' }];
    return config;
  },
}

export default nextConfig
