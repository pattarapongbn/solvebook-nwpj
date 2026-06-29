'use client'

import { Share2 } from 'lucide-react'
import { toast } from 'sonner'

export function ShareButton({ title, bookId }: { title: string; bookId: string }) {
  const handleShare = async () => {
    const url = `${window.location.origin}/books/${bookId}`
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, url })
      } catch {}
    } else {
      await navigator.clipboard.writeText(url)
      toast.success('คัดลอก URL แล้ว')
    }
  }

  return (
    <button
      onClick={handleShare}
      className="p-2 text-brown-400 hover:text-brown-700 transition-colors"
      aria-label="แชร์"
    >
      <Share2 className="w-5 h-5" />
    </button>
  )
}
