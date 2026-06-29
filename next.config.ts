import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://ygbmpfgyxroybcnigwwz.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnYm1wZmd5eHJveWJjbmlnd3d6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1NDgyOTMsImV4cCI6MjA5ODEyNDI5M30.AcJSKbYJjP4U2Vlg9IHlJCS4ToT031Yda6VVTuJ2kgw',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
}

export default nextConfig
