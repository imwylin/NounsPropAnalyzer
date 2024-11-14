/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Allow all domains for now - you might want to restrict this in production
      },
    ],
    unoptimized: true,
  },
}

module.exports = nextConfig; 