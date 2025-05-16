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
    // Optimize for concurrent rendering
    optimizeCss: false, // Disable this to avoid critters dependency
    // Improve bundle size
    optimizePackageImports: ["@excalidraw/excalidraw", "lodash"],
  },
  // Ensure compatibility with Excalidraw
  webpack: (config) => {
    config.externals = [...(config.externals || []), { canvas: "canvas" }];
    return config;
  },
  compiler: {
    typescript: {
      ignoreBuildErrors: true,
    },
  },
};

export default nextConfig;
