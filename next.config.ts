import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // O preview e o HMR do dev abrem em 127.0.0.1. Sem isto o Next bloqueia o cliente.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  devIndicators: false,
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75, 90],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "hmucyddslhwnevmuyltj.supabase.co",
        pathname: "/storage/v1/object/**",
      },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
