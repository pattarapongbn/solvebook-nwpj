'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, MessageCircle, Send, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface CommentProfile {
  full_name: string | null
  avatar_url: string | null
}

interface Comment {
  id: string
  book_id: string
  user_id: string
  parent_id: string | null
  content: string
  like_count: number
  created_at: string
  profiles: CommentProfile | null
  liked?: boolean
  replies?: Comment[]
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'เมื่อกี้'
  if (m < 60) return `${m} นาทีที่แล้ว`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} ชั่วโมงที่แล้ว`
  return `${Math.floor(h / 24)} วันที่แล้ว`
}

function Avatar({ profile, size = 8 }: { profile: CommentProfile | null; size?: number }) {
  const cls = `w-${size} h-${size} rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 overflow-hidden`
  if (profile?.avatar_url)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={profile.avatar_url} alt="" className={cls + ' object-cover'} />
  return (
    <div className={cls}>
      <User className={`w-${Math.floor(size * 0.5)} h-${Math.floor(size * 0.5)} text-orange-400`} />
    </div>
  )
}

interface CommentRowProps {
  comment: Comment
  userId: string | null
  bookId: string
  onLike: (id: string, liked: boolean) => void
  depth?: number
}

function CommentRow({ comment, userId, bookId, onLike, depth = 0 }: CommentRowProps) {
  const [showReply, setShowReply] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) { router.push('/login'); return }
    if (!replyText.trim()) return
    setSubmitting(true)
    const supabase = createClient()
    await supabase.from('comments').insert({
      book_id: bookId,
      user_id: userId,
      parent_id: comment.id,
      content: replyText.trim(),
    })
    setReplyText('')
    setShowReply(false)
    setSubmitting(false)
    router.refresh()
  }

  const name = comment.profiles?.full_name ?? 'ผู้ใช้'

  return (
    <div className={cn('flex gap-3', depth > 0 && 'ml-10 mt-3')}>
      <Avatar profile={comment.profiles} size={8} />
      <div className="flex-1 min-w-0">
        <div className="bg-ivory rounded-2xl px-4 py-3">
          <p className="text-xs font-semibold text-brown-700 mb-1">{name}</p>
          <p className="text-sm text-brown-600 leading-relaxed">{comment.content}</p>
        </div>
        <div className="flex items-center gap-3 mt-1.5 px-1">
          <span className="text-[11px] text-brown-400">{timeAgo(comment.created_at)}</span>
          <button
            onClick={() => onLike(comment.id, !!comment.liked)}
            className={cn(
              'flex items-center gap-1 text-[11px] font-medium transition-colors',
              comment.liked ? 'text-orange-500' : 'text-brown-400 hover:text-orange-500'
            )}
          >
            <Heart className={cn('w-3 h-3', comment.liked && 'fill-current')} />
            {comment.like_count > 0 && comment.like_count}
          </button>
          {depth === 0 && (
            <button
              onClick={() => setShowReply(s => !s)}
              className="flex items-center gap-1 text-[11px] font-medium text-brown-400 hover:text-brown-700 transition-colors"
            >
              <MessageCircle className="w-3 h-3" />
              ตอบกลับ
            </button>
          )}
        </div>

        {/* Inline reply form */}
        {showReply && (
          <form onSubmit={handleReplySubmit} className="flex gap-2 mt-2 ml-1">
            <input
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              placeholder="ตอบกลับ..."
              className="flex-1 px-3 py-2 text-sm rounded-2xl border border-brown-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400"
              autoFocus
            />
            <button
              type="submit"
              disabled={submitting || !replyText.trim()}
              className="p-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-2xl transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Nested replies */}
        {comment.replies?.map(r => (
          <CommentRow key={r.id} comment={r} userId={userId} bookId={bookId} onLike={onLike} depth={1} />
        ))}
      </div>
    </div>
  )
}

interface Props {
  bookId: string
  initialComments: Comment[]
  userId: string | null
  initialLikedIds: string[]
}

export function CommentSection({ bookId, initialComments, userId, initialLikedIds }: Props) {
  const [comments, setComments] = useState<Comment[]>(() =>
    initialComments.map(c => ({
      ...c,
      liked: initialLikedIds.includes(c.id),
      replies: c.replies?.map(r => ({ ...r, liked: initialLikedIds.includes(r.id) })),
    }))
  )
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // keep in sync when server re-fetches (router.refresh)
  useEffect(() => {
    setComments(initialComments.map(c => ({
      ...c,
      liked: initialLikedIds.includes(c.id),
      replies: c.replies?.map(r => ({ ...r, liked: initialLikedIds.includes(r.id) })),
    })))
  }, [initialComments, initialLikedIds])

  const handleLike = useCallback(async (id: string, currentlyLiked: boolean) => {
    if (!userId) { router.push('/login'); return }
    // Optimistic update
    setComments(prev => prev.map(c => {
      if (c.id === id) return { ...c, liked: !currentlyLiked, like_count: c.like_count + (currentlyLiked ? -1 : 1) }
      return { ...c, replies: c.replies?.map(r => r.id === id ? { ...r, liked: !currentlyLiked, like_count: r.like_count + (currentlyLiked ? -1 : 1) } : r) }
    }))
    await supabase.rpc('toggle_comment_like', { p_comment_id: id })
  }, [userId, router, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) { router.push('/login'); return }
    if (!newComment.trim()) return
    setSubmitting(true)
    await supabase.from('comments').insert({
      book_id: bookId,
      user_id: userId,
      content: newComment.trim(),
    })
    setNewComment('')
    setSubmitting(false)
    router.refresh()
  }

  const totalCount = comments.reduce((s, c) => s + 1 + (c.replies?.length ?? 0), 0)

  return (
    <section className="mt-10 border-t border-brown-100 pt-8">
      <h2 className="font-serif text-heading-lg text-brown-800 mb-6">
        ความคิดเห็น
        {totalCount > 0 && <span className="text-base font-normal text-brown-400 ml-2">({totalCount})</span>}
      </h2>

      {/* New comment form */}
      <form onSubmit={handleSubmit} className="flex gap-3 mb-8">
        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-orange-400" />
        </div>
        <div className="flex-1 flex gap-2">
          <input
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder={userId ? 'แสดงความคิดเห็น...' : 'เข้าสู่ระบบเพื่อแสดงความคิดเห็น'}
            onClick={() => { if (!userId) router.push('/login') }}
            readOnly={!userId}
            className="flex-1 px-4 py-2.5 text-sm rounded-2xl border border-brown-200 bg-ivory focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400 cursor-text read-only:cursor-pointer"
          />
          <button
            type="submit"
            disabled={submitting || !newComment.trim()}
            className="p-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white rounded-2xl transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Comment list */}
      {comments.length === 0 ? (
        <p className="text-center text-sm text-brown-400 py-8">ยังไม่มีความคิดเห็น เป็นคนแรกที่แสดงความคิดเห็น</p>
      ) : (
        <div className="space-y-5">
          {comments.map(c => (
            <CommentRow key={c.id} comment={c} userId={userId} bookId={bookId} onLike={handleLike} />
          ))}
        </div>
      )}
    </section>
  )
}
