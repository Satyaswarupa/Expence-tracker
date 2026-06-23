/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['*.devtunnels.ms'],
    },
  },
};

export default nextConfig;
