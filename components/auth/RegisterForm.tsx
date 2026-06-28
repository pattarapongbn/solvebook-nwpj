'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export function RegisterForm() {
  const router = useRouter()
  const supabase = createClient()
  const [form, setForm] = useState({
    name: '', email: '', password: '', age: '', gender: '', occupation: '',
  })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.name,
          age: form.age,
          gender: form.gender,
          occupation: form.occupation,
        },
      },
    })
    setLoading(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('สมัครสมาชิกสำเร็จ กรุณายืนยันอีเมล')
    router.push('/')
  }

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/api/auth/callback` },
    })
  }

  const inputClass = 'w-full px-4 py-2.5 rounded-2xl border border-brown-200 bg-ivory text-sm text-brown-800 placeholder:text-brown-300 focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400'

  return (
    <div className="space-y-4">
      <button
        onClick={handleGoogle}
        className="w-full flex items-center justify-center gap-2.5 border border-brown-200 rounded-2xl py-2.5 text-sm font-medium text-brown-700 hover:bg-ivory transition-colors"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        สมัครด้วย Google
      </button>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-brown-100" />
        <span className="text-xs text-brown-400">หรือ</span>
        <div className="flex-1 h-px bg-brown-100" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input type="text" placeholder="ชื่อ-นามสกุล" required value={form.name} onChange={set('name')} className={inputClass} />
        <input type="email" placeholder="อีเมล" required value={form.email} onChange={set('email')} className={inputClass} />
        <div className="relative">
          <input
            type={showPw ? 'text' : 'password'}
            placeholder="รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)"
            required minLength={6}
            value={form.password}
            onChange={set('password')}
            className={`${inputClass} pr-10`}
          />
          <button type="button" onClick={() => setShowPw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-brown-400 hover:text-brown-600">
            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input type="number" placeholder="อายุ" min={1} max={120} value={form.age} onChange={set('age')} className={inputClass} />
          <select value={form.gender} onChange={set('gender')} className={inputClass}>
            <option value="">เพศ</option>
            <option value="male">ชาย</option>
            <option value="female">หญิง</option>
            <option value="other">อื่นๆ</option>
          </select>
        </div>
        <input type="text" placeholder="อาชีพ" value={form.occupation} onChange={set('occupation')} className={inputClass} />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-medium rounded-2xl py-2.5 text-sm transition-colors"
        >
          {loading ? 'กำลังสมัคร...' : 'สมัครสมาชิกฟรี'}
        </button>
      </form>
    </div>
  )
}
