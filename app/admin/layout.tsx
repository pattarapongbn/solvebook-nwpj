import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, LayoutDashboard, Book, Users, Tag, LogOut, Coins } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) redirect('/')

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-60 bg-brown-800 flex flex-col shrink-0">
        <div className="px-5 py-5 border-b border-brown-700">
          <Link href="/" className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-orange-400" />
            <span className="font-serif font-semibold text-cream text-base">SolveBook</span>
          </Link>
          <p className="text-xs text-brown-400 mt-0.5">Admin Panel</p>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          <AdminNavLink href="/admin" icon={LayoutDashboard} label="ภาพรวม" />
          <AdminNavLink href="/admin/books" icon={Book} label="จัดการหนังสือ" />
          <AdminNavLink href="/admin/categories" icon={Tag} label="หมวดหมู่" />
          <AdminNavLink href="/admin/users" icon={Users} label="ผู้ใช้งาน" />
          <AdminNavLink href="/admin/topups" icon={Coins} label="อนุมัติเติมคอยน์" />
        </nav>
        <div className="p-3 border-t border-brown-700">
          <Link href="/" className="flex items-center gap-2 px-3 py-2 text-sm text-brown-400 hover:text-cream rounded-xl transition-colors">
            <LogOut className="w-4 h-4" />
            กลับหน้าหลัก
          </Link>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}

function AdminNavLink({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-brown-300 hover:text-cream hover:bg-brown-700 transition-colors"
    >
      <Icon className="w-4 h-4" />
      {label}
    </Link>
  )
}
