/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["mammoth"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async redirects() {
    // Keep hostnames in sync with src/lib/app-origin.ts
    return [
      {
        source: "/",
        has: [{ type: "host", value: "www.almoayed.app" }],
        destination: "https://almoayed.app",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.almoayed.app" }],
        destination: "https://almoayed.app/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
