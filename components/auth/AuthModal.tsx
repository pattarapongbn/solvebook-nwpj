'use client'

import React, { useState } from 'react'
import { Eye, EyeOff, Mail } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface AuthModalProps {
  open: boolean
  defaultMode?: 'login' | 'register'
  onClose: () => void
  onSuccess?: () => void
}

export function AuthModal({ open, defaultMode = 'login', onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(defaultMode)
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', fullName: '' })
  const supabase = createClient()

  React.useEffect(() => { setMode(defaultMode) }, [defaultMode])

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }))

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    })
    setLoading(false)
    if (error) { toast.error(localizeError(error.message)); return }
    toast.success('ยินดีต้อนรับกลับมา')
    onSuccess?.()
    onClose()
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.fullName.trim()) { toast.error('กรุณากรอกชื่อ'); return }
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.fullName },
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    })
    setLoading(false)
    if (error) { toast.error(localizeError(error.message)); return }
    toast.success('ส่งอีเมลยืนยันแล้ว กรุณาตรวจสอบกล่องจดหมาย')
    onClose()
  }

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(form.email, {
      redirectTo: `${location.origin}/auth/callback?type=recovery`,
    })
    setLoading(false)
    if (error) { toast.error(localizeError(error.message)); return }
    toast.success('ส่งลิงก์รีเซ็ตรหัสผ่านแล้ว')
    setMode('login')
  }

  const handleGoogle = async () => {
    setLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback` },
    })
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {mode === 'login' ? 'เข้าสู่ระบบ' : mode === 'register' ? 'สมัครสมาชิก' : 'ลืมรหัสผ่าน'}
          </DialogTitle>
        </DialogHeader>

        {mode !== 'forgot' && (
          <>
            <button
              onClick={handleGoogle}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 border border-brown-200 rounded-2xl py-2.5 text-sm text-brown-700 hover:bg-ivory transition-colors disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {mode === 'login' ? 'เข้าสู่ระบบด้วย Google' : 'สมัครด้วย Google'}
            </button>

            <div className="flex items-center gap-3 text-brown-300 text-xs">
              <div className="flex-1 h-px bg-brown-100" />
              <span>หรือ</span>
              <div className="flex-1 h-px bg-brown-100" />
            </div>
          </>
        )}

        <form onSubmit={mode === 'login' ? handleLogin : mode === 'register' ? handleRegister : handleForgot} className="space-y-3">
          {mode === 'register' && (
            <div>
              <label className="block text-xs text-brown-500 mb-1.5">ชื่อ-นามสกุล</label>
              <Input
                value={form.fullName}
                onChange={set('fullName')}
                placeholder="กรอกชื่อ-นามสกุล"
                required
                autoComplete="name"
              />
            </div>
          )}

          <div>
            <label className="block text-xs text-brown-500 mb-1.5">อีเมล</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brown-400 pointer-events-none" />
              <Input
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="your@email.com"
                required
                className="pl-10"
                autoComplete="email"
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs text-brown-500">รหัสผ่าน</label>
                {mode === 'login' && (
                  <button type="button" onClick={() => setMode('forgot')} className="text-xs text-orange-500 hover:underline">
                    ลืมรหัสผ่าน?
                  </button>
                )}
              </div>
              <div className="relative">
                <Input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  placeholder="รหัสผ่านอย่างน้อย 6 ตัวอักษร"
                  required
                  minLength={6}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brown-400 hover:text-brown-600"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          <Button type="submit" size="lg" className="w-full mt-2" disabled={loading}>
            {loading
              ? 'กำลังดำเนินการ...'
              : mode === 'login' ? 'เข้าสู่ระบบ'
              : mode === 'register' ? 'สมัครสมาชิก'
              : 'ส่งลิงก์รีเซ็ต'}
          </Button>
        </form>

        <p className="text-center text-sm text-brown-500">
          {mode === 'login' ? (
            <>ยังไม่มีบัญชี?{' '}
              <button onClick={() => setMode('register')} className="text-orange-500 font-medium hover:underline">
                สมัครฟรี
              </button>
            </>
          ) : mode === 'register' ? (
            <>มีบัญชีแล้ว?{' '}
              <button onClick={() => setMode('login')} className="text-orange-500 font-medium hover:underline">
                เข้าสู่ระบบ
              </button>
            </>
          ) : (
            <button onClick={() => setMode('login')} className="text-orange-500 hover:underline">
              กลับไปเข้าสู่ระบบ
            </button>
          )}
        </p>
      </DialogContent>
    </Dialog>
  )
}

function localizeError(msg: string): string {
  if (msg.includes('Invalid login')) return 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
  if (msg.includes('Email not confirmed')) return 'กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ'
  if (msg.includes('already registered')) return 'อีเมลนี้มีผู้ใช้งานแล้ว'
  if (msg.includes('Password should be')) return 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'
  if (msg.includes('rate limit')) return 'ลองใหม่อีกครั้งในสักครู่'
  return 'เกิดข้อผิดพลาด กรุณาลองใหม่'
}
