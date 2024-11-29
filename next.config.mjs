/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    EDGE_CONFIG: process.env.EDGE_CONFIG,
  }
};

export default nextConfig; 