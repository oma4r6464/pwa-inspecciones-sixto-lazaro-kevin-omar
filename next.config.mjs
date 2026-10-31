/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; worker-src 'self'; manifest-src 'self'"
          },
          {
            key: "Permissions-Policy",
            value: "camera=(self), geolocation=(self), microphone=(), notifications=(self), payment=(), usb=()"
          }
        ]
      }
    ];
  }
};

export default nextConfig;
