import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow LAN and tunnel access without dev origin warnings
  allowedDevOrigins: [
    "10.10.20.53",
    "localhost",
    "127.0.0.1",
    "*.devtunnels.ms",
    "*.asse.devtunnels.ms",
  ],
  // Proxy /api/v1/:path* requests internally to FastAPI backend on 127.0.0.1:8000
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: "http://127.0.0.1:8000/api/v1/:path*",
      },
    ];
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
