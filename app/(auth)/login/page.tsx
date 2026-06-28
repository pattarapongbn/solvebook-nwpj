import Link from 'next/link'
import { BookOpen } from 'lucide-react'
import { LoginForm } from '@/components/auth/LoginForm'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'เข้าสู่ระบบ' }

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-ivory flex flex-col items-center justify-center p-4">
      <Link href="/" className="flex items-center gap-2.5 mb-8">
        <div className="w-9 h-9 bg-brown-800 rounded-xl flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-orange-400" />
        </div>
        <span className="font-serif font-semibold text-brown-800 text-xl">SolveBook</span>
      </Link>

      <div className="w-full max-w-sm bg-white rounded-3xl shadow-warm-md p-7">
        <h1 className="font-serif text-2xl font-semibold text-brown-900 mb-5">เข้าสู่ระบบ</h1>
        <LoginForm />
        <p className="text-center text-sm text-brown-500 mt-5">
          ยังไม่มีบัญชี?{' '}
          <Link href="/register" className="text-orange-500 font-medium hover:underline">
            สมัครฟรี
          </Link>
        </p>
      </div>
    </div>
  )
}
