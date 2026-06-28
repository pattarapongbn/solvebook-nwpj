import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl font-serif font-light text-brown-200 mb-6">404</p>
      <h1 className="text-display-sm font-serif text-brown-800 mb-3">
        ไม่พบหน้าที่คุณต้องการ
      </h1>
      <p className="text-brown-500 mb-8 max-w-sm">
        หน้านี้อาจถูกย้ายหรือลบไปแล้ว ลองกลับไปหน้าหลักได้เลย
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 bg-brown-800 text-cream px-6 py-3 rounded-2xl font-medium hover:bg-brown-700 transition-colors"
      >
        กลับหน้าหลัก
      </Link>
    </div>
  )
}
