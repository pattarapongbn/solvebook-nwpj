import { redirect } from 'next/navigation'
import Link from 'next/link'
import { User, BookOpen, Settings, LogOut, ArrowLeft, ChevronRight, Pencil } from 'lucide-react'
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
    .select('full_name, avatar_url, books_finished')
    .eq('id', user.id)
    .single()

  const displayName = profile?.full_name ?? user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'ผู้ใช้งาน'

  return (
    <div className="page-fade section-wrap py-6 max-w-lg">
      {/* Back */}
      <Link href="/" className="inline-flex p-2 -ml-2 text-brown-600 hover:text-brown-900 transition-colors mb-6">
        <ArrowLeft className="w-5 h-5" />
      </Link>

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
      </div>

      {/* Single stat: books finished */}
      <div className="flex justify-center mb-8">
        <div className="bg-white border border-brown-100 rounded-2xl p-5 text-center min-w-[140px]">
          <BookOpen className="w-5 h-5 text-green-600 mx-auto mb-2" />
          <div className="font-serif text-3xl font-semibold text-brown-800">
            {profile?.books_finished ?? 0}
          </div>
          <div className="text-xs text-brown-400 mt-1">เล่มที่อ่านจบ</div>
        </div>
      </div>

      {/* Menu */}
      <div className="border border-brown-100 rounded-3xl overflow-hidden divide-y divide-brown-100 bg-white">
        <MenuItem href="/profile/edit" icon={Pencil} label="แก้ไขโปรไฟล์" />
        <MenuItem href="/settings" icon={Settings} label="ตั้งค่าการอ่าน" />
        <div className="px-5 py-4">
          <SignOutButton />
        </div>
      </div>
    </div>
  )
}

function MenuItem({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-5 py-4 hover:bg-ivory transition-colors group"
    >
      <Icon className="w-5 h-5 flex-shrink-0 text-brown-400 group-hover:text-brown-600" />
      <span className="text-sm font-medium text-brown-700 group-hover:text-brown-900 flex-1">
        {label}
      </span>
      <ChevronRight className="w-4 h-4 text-brown-300" />
    </Link>
  )
}
