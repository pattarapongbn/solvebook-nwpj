import type { Metadata, Viewport } from 'next'
import { Playfair_Display, IBM_Plex_Sans_Thai } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

const ibmPlex = IBM_Plex_Sans_Thai({
  subsets: ['thai', 'latin'],
  variable: '--font-body',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://solvebook.app'),
  title: {
    default: 'SolveBook — หนังสือสั้น สำหรับชีวิตที่วุ่นวาย',
    template: '%s | SolveBook',
  },
  description:
    'อ่านหนังสือสั้นคุณภาพสูง เข้าใจง่าย อ่านจบใน 5 นาที แก้ปัญหาชีวิตได้จริง',
  keywords: ['หนังสือสั้น', 'ebook', 'การพัฒนาตนเอง', 'การเงิน', 'ธุรกิจ', 'สุขภาพ'],
  authors: [{ name: 'SolveBook' }],
  creator: 'SolveBook',
  openGraph: {
    type: 'website',
    locale: 'th_TH',
    siteName: 'SolveBook',
    title: 'SolveBook — หนังสือสั้น สำหรับชีวิตที่วุ่นวาย',
    description: 'อ่านหนังสือสั้นคุณภาพสูง เข้าใจง่าย อ่านจบใน 5 นาที',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SolveBook',
    description: 'หนังสือสั้น สำหรับชีวิตที่วุ่นวาย',
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FAFAF7' },
    { media: '(prefers-color-scheme: dark)',  color: '#1A1610' },
  ],
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="th"
      className={`${playfair.variable} ${ibmPlex.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-cream text-brown-800 antialiased">
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#2C2416',
              color: '#F5F0E8',
              borderRadius: '12px',
              border: 'none',
              fontFamily: 'var(--font-body)',
            },
          }}
        />
      </body>
    </html>
  )
}
