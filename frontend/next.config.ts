import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" }, // สินค้า mock/crawl มาจากหลาย CDN
    ],
  },
};

export default nextConfig;
