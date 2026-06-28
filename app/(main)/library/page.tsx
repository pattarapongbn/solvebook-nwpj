import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { BookCard } from '@/components/books/BookCard'
import { Progress } from '@/components/ui/progress'
import { formatReadingTime } from '@/lib/utils'
import type { Metadata } from 'next'
import type { Book, ReadingProgress, Favorite, Bookmark } from '@/lib/types'

export const metadata: Metadata = { title: 'ชั้นหนังสือของฉัน' }

export default async function LibraryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [progressRes, favRes, bookmarkRes] = await Promise.all([
    supabase
      .from('reading_progress')
      .select('*, book:books(*, category:categories(id,name,slug,color,icon))')
      .eq('user_id', user.id)
      .order('last_read_at', { ascending: false }),
    supabase
      .from('favorites')
      .select('*, book:books(*, category:categories(id,name,slug,color,icon))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('bookmarks')
      .select('*, book:books(*, category:categories(id,name,slug,color,icon))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  const progress = (progressRes.data ?? []) as ReadingProgress[]
  const reading = progress.filter(p => !p.is_completed)
  const completed = progress.filter(p => p.is_completed)
  const favorites = (favRes.data ?? []) as Favorite[]
  const bookmarks = (bookmarkRes.data ?? []) as Bookmark[]

  return (
    <div className="page-fade section-wrap py-8">
      <h1 className="font-serif text-display-sm text-brown-900 mb-8">ชั้นหนังสือของฉัน</h1>

      {/* Currently reading */}
      {reading.length > 0 && (
        <LibrarySection title="กำลังอ่านอยู่">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reading.map(p => (
              <ReadingProgressCard key={p.id} progress={p} />
            ))}
          </div>
        </LibrarySection>
      )}

      {/* Favorites */}
      {favorites.length > 0 && (
        <LibrarySection title="หนังสือที่บันทึกไว้">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {favorites.map(f => f.book && (
              <BookCard key={f.id} book={f.book as Book} variant="grid" />
            ))}
          </div>
        </LibrarySection>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <LibrarySection title="อ่านจบแล้ว">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {completed.map(p => p.book && (
              <BookCard key={p.id} book={p.book as Book} variant="grid" />
            ))}
          </div>
        </LibrarySection>
      )}

      {/* Bookmarks */}
      {bookmarks.length > 0 && (
        <LibrarySection title="ที่คั่นหนังสือ">
          <div className="space-y-2">
            {bookmarks.map(b => b.book && (
              <Link
                key={b.id}
                href={`/read/${b.book_id}/${b.chapter_id ?? ''}`}
                className="flex items-center gap-4 p-4 rounded-2xl border border-brown-100 hover:bg-ivory transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-brown-800 line-clamp-1">{b.book.title}</p>
                  {b.note && <p className="text-sm text-brown-500 mt-0.5 line-clamp-1">{b.note}</p>}
                </div>
                <span className="text-xs text-orange-500">อ่านต่อ</span>
              </Link>
            ))}
          </div>
        </LibrarySection>
      )}

      {reading.length === 0 && favorites.length === 0 && completed.length === 0 && (
        <div className="text-center py-24">
          <p className="text-5xl mb-4">📚</p>
          <p className="font-serif text-xl text-brown-600">ชั้นหนังสือของคุณว่างเปล่า</p>
          <p className="text-brown-400 mt-2 mb-6">เริ่มต้นเลือกหนังสือที่คุณสนใจ</p>
          <Link
            href="/categories"
            className="inline-flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-2xl font-medium hover:bg-orange-600 transition-colors"
          >
            เลือกหนังสือ
          </Link>
        </div>
      )}
    </div>
  )
}

function LibrarySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="font-serif text-heading-lg text-brown-800 mb-4">{title}</h2>
      {children}
    </section>
  )
}

function ReadingProgressCard({ progress }: { progress: ReadingProgress }) {
  const book = progress.book as Book | undefined
  if (!book) return null

  return (
    <Link
      href={`/read/${book.id}/${progress.chapter_id ?? ''}`}
      className="flex gap-4 p-4 rounded-2xl border border-brown-100 hover:border-brown-200 hover:shadow-warm-sm transition-all bg-white group"
    >
      <div className="w-14 flex-shrink-0">
        <div className="book-aspect rounded-xl bg-brown-800 flex items-end justify-center p-2 overflow-hidden">
          <span className="text-cream text-[9px] font-serif text-center opacity-70 leading-tight">{book.title}</span>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-brown-800 group-hover:text-brown-900 line-clamp-2 leading-snug text-sm">
          {book.title}
        </h3>
        <p className="text-xs text-brown-400 mt-1">{formatReadingTime(book.reading_time_minutes)}</p>
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-brown-400 mb-1">
            <span>ความคืบหน้า</span>
            <span>{progress.progress_percent}%</span>
          </div>
          <Progress value={progress.progress_percent} />
        </div>
      </div>
    </Link>
  )
}
