'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Lock, BookOpen } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface Props {
  bookId: string
  priceThb: number
  balance: number | null
  startChapterId: string | null
  ctaText: string
  className?: string
}

export function UnlockButton({ bookId, priceThb, balance, startChapterId, ctaText, className }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [unlocked, setUnlocked] = useState(false)

  const handleUnlock = async () => {
    if (balance === null) {
      router.push('/login')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { error: rpcError } = await supabase.rpc('unlock_book', { p_book_id: bookId })
      if (rpcError) {
        if (rpcError.message.includes('คอยน์ไม่พอ') || balance < priceThb) {
          router.push('/wallet/topup')
          return
        }
        if (rpcError.message.includes('ต้องเข้าสู่ระบบ')) {
          router.push('/login')
          return
        }
        throw rpcError
      }
      setUnlocked(true)
      router.refresh()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  if (unlocked && startChapterId) {
    return (
      <Link
        href={`/read/${bookId}/${startChapterId}`}
        className={cn(
          'flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-2xl transition-colors',
          className
        )}
      >
        <BookOpen className="w-4 h-4" />
        {ctaText}
      </Link>
    )
  }

  return (
    <div className="w-full">
      <button
        onClick={handleUnlock}
        disabled={loading}
        className={cn(
          'flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold rounded-2xl transition-colors w-full',
          className
        )}
      >
        <Lock className="w-4 h-4" />
        {loading ? 'กำลังปลดล็อก...' : `ปลดล็อก • ${priceThb} คอยน์`}
      </button>
      {error && <p className="text-red-500 text-xs text-center mt-2">{error}</p>}
    </div>
  )
}
