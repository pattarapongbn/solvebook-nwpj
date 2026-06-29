import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Clock, Star, BookOpen, Heart, Share2, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { BookCover } from '@/components/books/BookCover'
import { BookCard } from '@/components/books/BookCard'
import { HorizontalScroll } from '@/components/books/HorizontalScroll'
import { UnlockButton } from '@/components/wallet/UnlockButton'
import { Badge } from '@/components/ui/badge'
import { getCategoryIcon } from '@/lib/category-icons'
import { formatReadingTime, formatNumber } from '@/lib/utils'
import type { Book, BookChapter } from '@/lib/types'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('books').select('title, description').eq('id', id).single()
  if (!data) return { title: 'ไม่พบหนังสือ' }
  const book = data as unknown as { title: string; description: string | null }
  return { title: book.title, description: book.description ?? undefined }
}

async function getData(id: string) {
  const supabase = await createClient()

  const [bookRes, chaptersRes] = await Promise.all([
    supabase.from('books').select('*, category:categories(*)').eq('id', id).single(),
    supabase.from('book_chapters')
      .select('id, title, order_index, reading_time_minutes, is_free')
      .eq('book_id', id)
      .order('order_index'),
  ])

  if (bookRes.error || !bookRes.data) return null

  supabase.rpc('increment_view', { book_id: id }).then(() => {})

  return {
    book: bookRes.data as Book,
    chapters: (chaptersRes.data ?? []) as Partial<BookChapter>[],
  }
}

export default async function BookPage({ params }: Props) {
  const { id } = await params
  const data = await getData(id)
  if (!data) return notFound()

  const { book, chapters } = data
  const supabase = await createClient()

  const [relatedRes, userRes] = await Promise.all([
    supabase.from('books')
      .select('*, category:categories(id,name,slug,color,icon)')
      .eq('is_published', true)
      .eq('category_id', book.category_id ?? '')
      .neq('id', book.id)
      .limit(6),
    supabase.auth.getUser(),
  ])

  const user = userRes.data.user

  const [progressRes2, unlockRes2, walletRes2] = user ? await Promise.all([
    supabase
      .from('reading_progress')
      .select('chapter_id, progress_percent')
      .eq('user_id', user.id)
      .eq('book_id', id)
      .maybeSingle(),
    book.is_free ? Promise.resolve({ data: null as { id: string } | null }) : supabase
      .from('unlocks')
      .select('id')
      .eq('user_id', user.id)
      .eq('book_id', id)
      .maybeSingle(),
    book.is_free ? Promise.resolve({ data: null as { balance: number } | null }) : supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', user.id)
      .maybeSingle(),
  ]) : [{ data: null }, { data: null }, { data: null }]

  const readingProgress = progressRes2.data as { chapter_id: string | null; progress_percent: number } | null
  const isUnlocked = !!unlockRes2.data
  const walletBalance: number | null = walletRes2.data ? (walletRes2.data as { balance: number }).balance : null

  const canRead = book.is_free || isUnlocked
  const totalTime = chapters.reduce((s, c) => s + (c.reading_time_minutes ?? 0), 0) || book.reading_time_minutes
  const startChapterId = readingProgress?.chapter_id ?? chapters[0]?.id ?? null
  const ctaText = readingProgress ? 'อ่านต่อ' : 'เริ่มอ่าน'
  const related = (relatedRes.data ?? []) as Book[]
  const CategoryIcon = book.category ? getCategoryIcon(book.category.slug) : null

  return (
    <div className="page-fade pb-48 md:pb-0">
      {/* Top bar */}
      <div className="section-wrap py-4 flex items-center justify-between">
        <Link
          href="/"
          className="p-2 -ml-2 text-brown-600 hover:text-brown-900 transition-colors"
          aria-label="กลับ"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-1">
          <button className="p-2 text-brown-400 hover:text-orange-500 transition-colors" aria-label="บันทึก">
            <Heart className="w-5 h-5" />
          </button>
          <button className="p-2 text-brown-400 hover:text-brown-700 transition-colors" aria-label="แชร์">
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="section-wrap pb-8 md:py-8">
        {/* Book hero */}
        <div className="flex flex-col md:flex-row gap-8 md:gap-12 mb-10">
          <div className="flex-shrink-0">
            <div className="w-44 md:w-52 mx-auto md:mx-0">
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

          <div className="flex-1">
            {book.category && CategoryIcon && (
              <Link
                href={`/categories/${book.category.slug}`}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-orange-600 hover:underline mb-3"
              >
                <CategoryIcon className="w-3.5 h-3.5" />
                {book.category.name}
              </Link>
            )}

            <h1 className="font-serif text-display-sm text-brown-900 leading-tight mb-3">
              {book.title}
            </h1>

            {book.author && (
              <p className="text-brown-500 mb-4">โดย {book.author}</p>
            )}

            {/* Stats bar */}
            <div className="flex flex-wrap items-center gap-4 mb-5 text-sm text-brown-500">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-brown-400" />
                {formatReadingTime(totalTime)}
              </span>
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-brown-400" />
                {chapters.length} บท
              </span>
              {book.rating_count > 0 ? (
                <span className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  {book.rating.toFixed(1)}
                  <span className="text-brown-400 text-xs">({formatNumber(book.rating_count)} รีวิว)</span>
                </span>
              ) : (
                <span className="text-xs text-brown-400">ยังไม่มีรีวิว</span>
              )}
              <Badge variant={book.is_free ? 'free' : 'premium'}>
                {book.is_free ? 'ฟรี' : 'Premium'}
              </Badge>
            </div>

            {book.description && (
              <div>
                <h2 className="font-serif text-sm font-semibold text-brown-700 mb-2">เกี่ยวกับเล่มนี้</h2>
                <p className="text-brown-600 leading-relaxed max-w-xl text-sm">
                  {book.description}
                </p>
              </div>
            )}

            {/* Desktop CTA */}
            {chapters.length > 0 && (
              <div className="hidden md:block mt-6">
                {canRead && startChapterId ? (
                  <Link
                    href={`/read/${book.id}/${startChapterId}`}
                    className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-2xl px-6 py-3 text-sm transition-colors"
                  >
                    <BookOpen className="w-4 h-4" />
                    {ctaText}
                  </Link>
                ) : !canRead ? (
                  <UnlockButton
                    bookId={book.id}
                    priceThb={book.price_thb ?? 0}
                    balance={walletBalance}
                    startChapterId={startChapterId}
                    ctaText={ctaText}
                    className="px-6 py-3 text-sm inline-flex w-auto"
                  />
                ) : null}
              </div>
            )}
          </div>
        </div>

        {/* Related books */}
        {related.length > 0 && (
          <div>
            <h2 className="font-serif text-heading-lg text-brown-800 mb-5">อ่านต่อในหมวดนี้</h2>
            <HorizontalScroll books={related} />
          </div>
        )}
      </div>

      {/* Mobile sticky CTA */}
      {chapters.length > 0 && (
        <div className="md:hidden fixed bottom-16 left-0 right-0 z-30 p-4 bg-white/95 backdrop-blur-sm border-t border-brown-100">
          {canRead && startChapterId ? (
            <Link
              href={`/read/${book.id}/${startChapterId}`}
              className="block w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold text-center rounded-2xl py-3.5 text-base transition-colors"
            >
              {ctaText}
            </Link>
          ) : !canRead ? (
            <UnlockButton
              bookId={book.id}
              priceThb={book.price_thb ?? 0}
              balance={walletBalance}
              startChapterId={startChapterId}
              ctaText={ctaText}
              className="py-3.5 text-base"
            />
          ) : null}
        </div>
      )}
    </div>
  )
}
