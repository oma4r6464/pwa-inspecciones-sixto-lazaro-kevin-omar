import { getSecurityHeaders } from "./src/lib/security/security-headers.mjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: getSecurityHeaders({ isDev: process.env.NODE_ENV !== "production" })
      }
    ];
  }
};

export default nextConfig;
