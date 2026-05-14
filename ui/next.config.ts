import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // Next server → FastAPI (browser never opens :8000 directly when using /api-proxy in axios).
    const backend = (
      process.env.INTERNAL_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://127.0.0.1:8000"
    ).replace(/\/$/, "");

    return [
      // Static files from FastAPI (images use same-origin when NEXT_PUBLIC_API_URL is unset)
      { source: "/uploads/:path*", destination: `${backend}/uploads/:path*` },
      // API: /api-proxy/auth/login → FastAPI /auth/login (no clash with Next /dashboard page)
      { source: "/api-proxy/:path*", destination: `${backend}/:path*` },
    ];
  },
};

export default nextConfig;
