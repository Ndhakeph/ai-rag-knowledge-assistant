/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  webpack: (config) => {
    // Handle canvas module for pdf-parse
    config.resolve.alias.canvas = false;
    return config;
  },
}

module.exports = nextConfig
