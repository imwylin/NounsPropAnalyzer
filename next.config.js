/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: false,
  },
  env: {
    EDGE_CONFIG: process.env.EDGE_CONFIG,
  },
}

module.exports = nextConfig 