import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" }, // สินค้า mock/crawl มาจากหลาย CDN
    ],
  },
  // บน Vercel (single project: Next.js + FastAPI) ให้ /api/v1/* วิ่งเข้า Python
  // serverless function ที่ api/index.py — function เห็น path เดิมของ request
  // จึง match route /api/v1/... ใน FastAPI ได้ตรง ๆ (dev ใช้ NEXT_PUBLIC_API_URL แทน)
  async rewrites() {
    return [{ source: "/api/v1/:path*", destination: "/api/index" }];
  },
};

export default nextConfig;
