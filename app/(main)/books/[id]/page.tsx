import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Clock, Star, BookOpen, Heart, Bookmark, ArrowLeft, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { BookCover } from '@/components/books/BookCover'
import { BookCard } from '@/components/books/BookCard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatReadingTime, formatNumber } from '@/lib/utils'
import type { Book, BookChapter } from '@/lib/types'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('books')
    .select('title, description')
    .eq('id', id)
    .single()

  if (!data) return { title: 'ไม่พบหนังสือ' }
  const book = data as unknown as { title: string; description: string | null }
  return {
    title: book.title,
    description: book.description ?? undefined,
  }
}

async function getData(id: string) {
  const supabase = await createClient()

  const [bookRes, chaptersRes] = await Promise.all([
    supabase
      .from('books')
      .select('*, category:categories(*)')
      .eq('id', id)
      .single(),
    supabase
      .from('book_chapters')
      .select('id, title, order_index, reading_time_minutes, is_free')
      .eq('book_id', id)
      .order('order_index'),
  ])

  if (bookRes.error || !bookRes.data) return null

  // Increment view count (fire and forget)
  supabase.rpc('increment_view', { book_id: id }).then(() => {})

  return {
    book: bookRes.data as Book,
    chapters: (chaptersRes.data ?? []) as Partial<BookChapter>[],
  }
}

export default async function BookPage({ params }: Props) {
  const { id } = await params
  const data = await getData(id)
  if (!data) notFound()

  const { book, chapters } = data
  const supabase = await createClient()
  const { data: related } = await supabase
    .from('books')
    .select('*, category:categories(id,name,slug,color,icon)')
    .eq('is_published', true)
    .eq('category_id', book.category_id ?? '')
    .neq('id', book.id)
    .limit(4)

  const totalTime = chapters.reduce((s, c) => s + (c.reading_time_minutes ?? 0), 0) || book.reading_time_minutes

  return (
    <div className="page-fade">
      <div className="section-wrap py-8 md:py-12">
        {/* Back */}
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-brown-500 hover:text-brown-700 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          กลับ
        </Link>

        {/* Book hero */}
        <div className="flex flex-col md:flex-row gap-8 md:gap-12 mb-12">
          {/* Cover */}
          <div className="flex-shrink-0">
            <div className="w-48 md:w-56 mx-auto md:mx-0">
              <BookCover
                title={book.title}
                author={book.author}
                category={book.category?.name}
                color={book.category?.color}
                coverUrl={book.cover_url}
                size="lg"
              />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1">
            {book.category && (
              <Link
                href={`/categories/${book.category.slug}`}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-orange-600 hover:underline mb-3"
              >
                {book.category.icon} {book.category.name}
              </Link>
            )}

            <h1 className="font-serif text-display-sm text-brown-900 leading-tight mb-3">
              {book.title}
            </h1>

            {book.author && (
              <p className="text-brown-500 mb-4">โดย {book.author}</p>
            )}

            <div className="flex flex-wrap items-center gap-4 mb-5 text-sm text-brown-500">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-brown-400" />
                {formatReadingTime(totalTime)}
              </span>
              {book.rating > 0 && (
                <span className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  {book.rating.toFixed(1)}
                  <span className="text-brown-400">({formatNumber(book.rating_count)} รีวิว)</span>
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-brown-400" />
                {chapters.length} บท
              </span>
              <Badge variant={book.is_free ? 'free' : 'premium'}>
                {book.is_free ? 'ฟรี' : 'Premium'}
              </Badge>
            </div>

            {book.description && (
              <p className="text-brown-600 leading-relaxed mb-6 max-w-xl">
                {book.description}
              </p>
            )}

            {chapters.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                <Button size="lg" asChild>
                  <Link href={`/read/${book.id}/${chapters[0].id}`}>
                    <BookOpen className="w-4 h-4" />
                    เริ่มอ่าน
                  </Link>
                </Button>
                <Button size="lg" variant="outline">
                  <Heart className="w-4 h-4" />
                  บันทึก
                </Button>
              </div>
            ) : (
              <p className="text-brown-400 text-sm">ยังไม่มีเนื้อหา</p>
            )}
          </div>
        </div>

        {/* Table of Contents */}
        {chapters.length > 0 && (
          <div className="mb-12">
            <h2 className="font-serif text-heading-lg text-brown-800 mb-4">สารบัญ</h2>
            <div className="border border-brown-100 rounded-3xl overflow-hidden divide-y divide-brown-100">
              {chapters.map((ch, i) => (
                <ChapterRow
                  key={ch.id}
                  chapter={ch as BookChapter}
                  index={i}
                  bookId={book.id}
                  canRead={book.is_free || (ch.is_free ?? true)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Related books */}
        {related && related.length > 0 && (
          <div>
            <h2 className="font-serif text-heading-lg text-brown-800 mb-5">หนังสือที่เกี่ยวข้อง</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {(related as Book[]).map(b => (
                <BookCard key={b.id} book={b} variant="grid" />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ChapterRow({
  chapter, index, bookId, canRead,
}: {
  chapter: BookChapter
  index: number
  bookId: string
  canRead: boolean
}) {
  const href = `/read/${bookId}/${chapter.id}`

  return (
    <div className="flex items-center gap-4 px-5 py-4 hover:bg-ivory transition-colors group">
      <span className="font-serif text-lg font-light text-brown-300 w-7 flex-shrink-0 text-center">
        {index + 1}
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-brown-800 group-hover:text-brown-900 text-sm leading-snug">
          {chapter.title}
        </p>
        <p className="text-xs text-brown-400 mt-0.5">
          {formatReadingTime(chapter.reading_time_minutes)}
        </p>
      </div>
      {canRead ? (
        <Link
          href={href}
          className="text-xs text-orange-500 hover:underline flex-shrink-0"
        >
          อ่าน
        </Link>
      ) : (
        <Lock className="w-4 h-4 text-brown-300 flex-shrink-0" />
      )}
    </div>
  )
}
