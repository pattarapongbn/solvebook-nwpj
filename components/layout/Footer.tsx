import Link from 'next/link'
import { BookOpen } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-brown-100 bg-ivory mt-auto">
      <div className="section-wrap py-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-brown-800 rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-orange-400" />
            </div>
            <span className="font-serif font-semibold text-brown-800">SolveBook</span>
          </div>

          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-brown-500">
            <Link href="/about" className="hover:text-brown-700 transition-colors">เกี่ยวกับเรา</Link>
            <Link href="/categories" className="hover:text-brown-700 transition-colors">หมวดหมู่</Link>
            <Link href="/privacy" className="hover:text-brown-700 transition-colors">นโยบายความเป็นส่วนตัว</Link>
            <Link href="/terms" className="hover:text-brown-700 transition-colors">เงื่อนไขการใช้งาน</Link>
            <Link href="/contact" className="hover:text-brown-700 transition-colors">ติดต่อเรา</Link>
          </nav>
        </div>
        <div className="border-t border-brown-100 mt-8 pt-6 text-sm text-brown-400 text-center">
          &copy; {new Date().getFullYear()} SolveBook. สงวนสิทธิ์ทุกประการ
        </div>
      </div>
    </footer>
  )
}
