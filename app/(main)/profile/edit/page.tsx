'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function EditProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const [fullName, setFullName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetched, setFetched] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      supabase.from('profiles').select('full_name, avatar_url').eq('id', user.id).single()
        .then(({ data }) => {
          setFullName(data?.full_name ?? '')
          setAvatarUrl(data?.avatar_url ?? '')
          setFetched(true)
        })
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim() || null, avatar_url: avatarUrl.trim() || null })
      .eq('id', user.id)
    setLoading(false)
    if (error) { toast.error(error.message); return }
    toast.success('บันทึกโปรไฟล์แล้ว')
    router.push('/profile')
  }

  if (!fetched) {
    return (
      <div className="section-wrap py-6 max-w-lg">
        <div className="h-8 w-32 bg-brown-100 animate-pulse rounded-xl mb-6" />
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => <div key={i} className="h-12 bg-brown-100 animate-pulse rounded-2xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="page-fade section-wrap py-6 max-w-lg">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/profile" className="p-2 -ml-2 text-brown-600 hover:text-brown-900 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-serif text-2xl font-semibold text-brown-900">แก้ไขโปรไฟล์</h1>
      </div>

      {/* Avatar preview */}
      <div className="flex justify-center mb-8">
        <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center overflow-hidden border-2 border-brown-100">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="รูปโปรไฟล์" className="w-full h-full object-cover" />
          ) : (
            <User className="w-8 h-8 text-orange-400" />
          )}
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-brown-700 mb-1.5">ชื่อแสดง</label>
          <input
            type="text"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="ชื่อของคุณ"
            className="w-full px-4 py-2.5 rounded-2xl border border-brown-200 bg-ivory text-sm text-brown-800 placeholder:text-brown-300 focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-brown-700 mb-1.5">URL รูปโปรไฟล์</label>
          <input
            type="url"
            value={avatarUrl}
            onChange={e => setAvatarUrl(e.target.value)}
            placeholder="https://..."
            className="w-full px-4 py-2.5 rounded-2xl border border-brown-200 bg-ivory text-sm text-brown-800 placeholder:text-brown-300 focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-medium rounded-2xl py-3 text-sm transition-colors"
        >
          {loading ? 'กำลังบันทึก...' : <><Check className="w-4 h-4" />บันทึก</>}
        </button>
      </form>
    </div>
  )
}
