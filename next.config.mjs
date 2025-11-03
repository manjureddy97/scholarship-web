/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: { staleTimes: { dynamic: 0, static: 60 } }
};
export default nextConfig;
