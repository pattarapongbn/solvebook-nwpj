'use client'

import { useState } from 'react'
import { Heart } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface Props {
  bookId: string
  userId: string | null
  initialFavorited: boolean
}

export function FavoriteButton({ bookId, userId, initialFavorited }: Props) {
  const [favorited, setFavorited] = useState(initialFavorited)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleToggle = async () => {
    if (!userId) { router.push('/login'); return }
    if (loading) return
    setLoading(true)
    const supabase = createClient()
    if (favorited) {
      await supabase.from('favorites').delete().eq('book_id', bookId).eq('user_id', userId)
    } else {
      await supabase.from('favorites').insert({ book_id: bookId, user_id: userId })
    }
    setFavorited(f => !f)
    setLoading(false)
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={cn(
        'p-2 transition-colors',
        favorited ? 'text-orange-500' : 'text-brown-400 hover:text-orange-500'
      )}
      aria-label={favorited ? 'เอาออกจากรายการโปรด' : 'บันทึก'}
    >
      <Heart className={cn('w-5 h-5', favorited && 'fill-current')} />
    </button>
  )
}
