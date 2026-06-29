'use client'

import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export function SignOutButton() {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    toast.success('ออกจากระบบแล้ว')
    router.push('/login')
  }

  return (
    <button
      onClick={handleSignOut}
      className="flex items-center gap-3 text-red-500 hover:text-red-600 text-sm font-medium transition-colors w-full"
    >
      <LogOut className="w-5 h-5" />
      ออกจากระบบ
    </button>
  )
}
