import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // static export ล้วน — ไม่มี server ฝั่ง Next.js อีกแล้ว
  // ทุกหน้ากลายเป็นไฟล์นิ่งใน out/ แล้วเสิร์ฟจาก Cloudflare Pages
  // API ทุกเส้นวิ่งข้ามโดเมนไปหา backend บน Render ผ่าน NEXT_PUBLIC_API_URL
  output: "export",
  images: {
    // export ไม่มีตัว optimize รูประหว่างรัน — ต้องปิด
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "**" }, // สินค้า mock/crawl มาจากหลาย CDN
    ],
  },
};

export default nextConfig;
