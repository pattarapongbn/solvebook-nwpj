import { redirect } from 'next/navigation'
import Link from 'next/link'
import { User, BookOpen, Clock, Flame, Settings, LogOut, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { SignOutButton } from '@/components/auth/SignOutButton'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'โปรไฟล์' }

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const displayName = profile?.full_name ?? user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'ผู้ใช้งาน'
  const isAdmin = user.user_metadata?.role === 'admin'

  const stats = [
    { label: 'อ่านต่อเนื่อง', value: profile?.reading_streak ?? 0, unit: 'วัน', icon: Flame, color: 'text-orange-500' },
    { label: 'อ่านจบแล้ว', value: profile?.books_finished ?? 0, unit: 'เล่ม', icon: BookOpen, color: 'text-green-600' },
    { label: 'เวลาอ่านรวม', value: profile?.minutes_read ?? 0, unit: 'นาที', icon: Clock, color: 'text-blue-500' },
  ]

  return (
    <div className="page-fade section-wrap py-8 max-w-lg">
      {/* Avatar & Name */}
      <div className="flex flex-col items-center text-center mb-8">
        <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center mb-4">
          {profile?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatar_url} alt={displayName} className="w-full h-full rounded-full object-cover" />
          ) : (
            <User className="w-8 h-8 text-orange-500" />
          )}
        </div>
        <h1 className="font-serif text-heading-xl text-brown-800">{displayName}</h1>
        <p className="text-sm text-brown-400 mt-1">{user.email}</p>
        {isAdmin && (
          <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5" />
            Admin
          </span>
        )}
      </div>

      {/* Reading stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {stats.map(s => (
          <div key={s.label} className="bg-white border border-brown-100 rounded-2xl p-4 text-center">
            <s.icon className={`w-5 h-5 ${s.color} mx-auto mb-2`} />
            <div className="font-serif text-2xl font-semibold text-brown-800">{s.value}</div>
            <div className="text-xs text-brown-400 mt-0.5">{s.unit}</div>
            <div className="text-[10px] text-brown-300 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Menu */}
      <div className="border border-brown-100 rounded-3xl overflow-hidden divide-y divide-brown-100 bg-white">
        {isAdmin && (
          <MenuItem href="/admin" icon={ShieldCheck} label="Admin Dashboard" accent />
        )}
        <MenuItem href="/library" icon={BookOpen} label="ชั้นหนังสือของฉัน" />
        <MenuItem href="/settings" icon={Settings} label="ตั้งค่า" />
        <div className="px-5 py-4">
          <SignOutButton />
        </div>
      </div>
    </div>
  )
}

function MenuItem({
  href, icon: Icon, label, accent = false,
}: {
  href: string; icon: React.ElementType; label: string; accent?: boolean
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-5 py-4 hover:bg-ivory transition-colors group"
    >
      <Icon className={`w-5 h-5 flex-shrink-0 ${accent ? 'text-orange-500' : 'text-brown-400 group-hover:text-brown-600'}`} />
      <span className={`text-sm font-medium ${accent ? 'text-orange-600' : 'text-brown-700 group-hover:text-brown-900'}`}>
        {label}
      </span>
    </Link>
  )
}
