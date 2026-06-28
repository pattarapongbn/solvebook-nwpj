'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, Menu, BookOpen, User, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AuthModal } from '@/components/auth/AuthModal'
import { createClient } from '@/lib/supabase/client'
import type { User as SupabaseUser } from '@supabase/supabase-js'

export function Header() {
  const router = useRouter()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [showSearch, setShowSearch] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [query, setQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (showSearch) searchRef.current?.focus()
  }, [showSearch])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
      setShowSearch(false)
      setQuery('')
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  const openLogin = () => { setAuthMode('login'); setShowAuth(true) }
  const openRegister = () => { setAuthMode('register'); setShowAuth(true) }

  return (
    <>
      <header className="sticky top-0 z-40 bg-cream/95 backdrop-blur-md border-b border-brown-100">
        <div className="section-wrap">
          <div className="flex items-center h-16 gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
              <div className="w-8 h-8 bg-brown-800 rounded-xl flex items-center justify-center group-hover:bg-brown-700 transition-colors">
                <BookOpen className="w-4.5 h-4.5 text-orange-400" style={{ width: '18px', height: '18px' }} />
              </div>
              <span className="font-serif font-semibold text-brown-800 text-lg">SolveBook</span>
            </Link>

            {/* Desktop search */}
            <div className="hidden md:flex flex-1 max-w-sm">
              <form onSubmit={handleSearch} className="w-full relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brown-400 pointer-events-none" />
                <input
                  ref={searchRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="ค้นหาหนังสือ หมวดหมู่ หรือคำสำคัญ"
                  className="w-full pl-10 pr-4 h-10 bg-ivory border border-brown-100 rounded-2xl text-sm text-brown-700 placeholder:text-brown-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white transition-all"
                />
              </form>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              {/* Nav links */}
              <nav className="hidden md:flex items-center gap-1">
                <Link href="/categories" className="px-3 py-2 text-sm text-brown-600 hover:text-brown-800 hover:bg-ivory rounded-xl transition-colors">
                  หมวดหมู่
                </Link>
                {user && (
                  <Link href="/library" className="px-3 py-2 text-sm text-brown-600 hover:text-brown-800 hover:bg-ivory rounded-xl transition-colors">
                    ชั้นหนังสือ
                  </Link>
                )}
              </nav>

              {/* Mobile search */}
              <button
                onClick={() => setShowSearch(true)}
                className="md:hidden p-2 text-brown-500 hover:text-brown-700 hover:bg-ivory rounded-xl transition-colors"
                aria-label="ค้นหา"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Auth */}
              {user ? (
                <Link href="/profile">
                  <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center hover:bg-orange-200 transition-colors">
                    <User className="w-4.5 h-4.5 text-orange-700" style={{ width: '18px', height: '18px' }} />
                  </div>
                </Link>
              ) : (
                <div className="hidden md:flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={openLogin}>
                    เข้าสู่ระบบ
                  </Button>
                  <Button size="sm" onClick={openRegister}>
                    สมัครสมาชิก
                  </Button>
                </div>
              )}

              {/* Hamburger */}
              <MobileMenuButton />
            </div>
          </div>
        </div>

        {/* Mobile full-screen search */}
        {showSearch && (
          <div className="fixed inset-0 z-50 bg-cream/98 backdrop-blur-sm flex flex-col p-4">
            <div className="flex items-center gap-3">
              <form onSubmit={handleSearch} className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brown-400 pointer-events-none" />
                <input
                  ref={searchRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="ค้นหา..."
                  className="w-full pl-11 pr-4 h-12 bg-ivory border border-brown-100 rounded-2xl text-brown-700 placeholder:text-brown-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </form>
              <button onClick={() => { setShowSearch(false); setQuery('') }} className="p-2.5 text-brown-500">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </header>

      <AuthModal
        open={showAuth}
        defaultMode={authMode}
        onClose={() => setShowAuth(false)}
        onSuccess={() => { setShowAuth(false); router.refresh() }}
      />
    </>
  )
}

function MobileMenuButton() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<SupabaseUser | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const nav = (href: string) => { setOpen(false); router.push(href) }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="md:hidden p-2 text-brown-500 hover:text-brown-700 hover:bg-ivory rounded-xl transition-colors"
        aria-label="เมนู"
      >
        <Menu className="w-5 h-5" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-50 bg-brown-900/30 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="fixed top-0 right-0 h-full w-80 max-w-[85vw] z-50 bg-white shadow-warm-lg flex flex-col">
            <div className="flex items-center justify-between px-5 py-5 border-b border-brown-100">
              <span className="font-serif font-semibold text-brown-800 text-lg">SolveBook</span>
              <button onClick={() => setOpen(false)} className="p-2 text-brown-400 hover:text-brown-600 hover:bg-ivory rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-5 space-y-1">
              <DrawerItem onClick={() => nav('/')} icon="🏠" label="หน้าหลัก" />
              <DrawerItem onClick={() => nav('/categories')} icon="📚" label="หมวดหมู่ทั้งหมด" />
              <DrawerItem onClick={() => nav('/search')} icon="🔍" label="ค้นหา" />
              {user && (
                <>
                  <div className="border-t border-brown-100 my-3" />
                  <DrawerItem onClick={() => nav('/library')} icon="📖" label="ชั้นหนังสือของฉัน" />
                  <DrawerItem onClick={() => nav('/profile')} icon="👤" label="โปรไฟล์" />
                </>
              )}
              <div className="border-t border-brown-100 my-3" />
              {user ? (
                <button
                  onClick={async () => { await supabase.auth.signOut(); setOpen(false); router.refresh() }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                >
                  <span>🚪</span>
                  <span>ออกจากระบบ</span>
                </button>
              ) : (
                <>
                  <DrawerItem onClick={() => nav('/login')} icon="🔑" label="เข้าสู่ระบบ" />
                  <button
                    onClick={() => nav('/register')}
                    className="w-full mt-2 bg-orange-500 text-white py-3 rounded-2xl text-sm font-medium hover:bg-orange-600 transition-colors"
                  >
                    สมัครสมาชิกฟรี
                  </button>
                </>
              )}
            </nav>
          </div>
        </>
      )}
    </>
  )
}

function DrawerItem({ onClick, icon, label }: { onClick: () => void; icon: string; label: string }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm text-brown-700 hover:bg-ivory hover:text-brown-900 transition-colors text-left"
    >
      <span className="text-base">{icon}</span>
      <span>{label}</span>
    </button>
  )
}
