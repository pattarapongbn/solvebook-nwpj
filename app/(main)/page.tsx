import Link from 'next/link'
import { ArrowRight, Bell, Heart, Search, SlidersHorizontal, BookOpen, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { BookCard } from '@/components/books/BookCard'
import { PopularCarousel } from '@/components/books/PopularCarousel'
import { getCategoryIcon } from '@/lib/category-icons'
import { getCategoryBg, getCategoryColor, formatReadingTime } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import type { Book, Category, ReadingProgress } from '@/lib/types'

async function getHomeData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [catsRes, popularRes, featuredRes] = await Promise.all([
    supabase.from('categories').select('*').order('order_index').limit(10),
    supabase.from('books')
      .select('*, category:categories(id,name,slug,color,icon)')
      .eq('is_published', true)
      .order('view_count', { ascending: false })
      .limit(6),
    supabase.from('books')
      .select('*, category:categories(id,name,slug,color,icon)')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(6),
  ])

  let profile: { full_name: string | null; avatar_url: string | null } | null = null
  let continueReading: ReadingProgress[] = []

  if (user) {
    const [profileRes, progressRes] = await Promise.all([
      supabase.from('profiles').select('full_name, avatar_url').eq('id', user.id).single(),
      supabase.from('reading_progress')
        .select('*, book:books(*, category:categories(id,name,slug,color,icon))')
        .eq('user_id', user.id)
        .eq('is_completed', false)
        .order('last_read_at', { ascending: false })
        .limit(3),
    ])
    profile = profileRes.data
    continueReading = (progressRes.data ?? []) as ReadingProgress[]
  }

  return {
    user: user ? { ...user, profile } : null,
    categories: (catsRes.data ?? []) as Category[],
    popular:    (popularRes.data ?? []) as Book[],
    featured:   (featuredRes.data ?? []) as Book[],
    continueReading,
  }
}

export default async function HomePage() {
  const { user, categories, popular, featured, continueReading } = await getHomeData()

  const displayName =
    (user?.profile as { full_name?: string | null } | null)?.full_name ??
    user?.user_metadata?.full_name ??
    null

  return (
    <div className="page-fade">
      {/* Mobile greeting */}
      <div className="md:hidden section-wrap pt-5 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-brown-400">สวัสดี</p>
            <h1 className="font-serif text-xl text-brown-900">
              {displayName ? displayName.split(' ')[0] : 'นักอ่าน'}
            </h1>
          </div>
          <div className="flex items-center gap-1">
            <Link href="/library" className="p-2 rounded-full text-brown-400 hover:bg-ivory transition-colors">
              <Heart className="w-5 h-5" />
            </Link>
            <button className="p-2 rounded-full text-brown-400 hover:bg-ivory transition-colors">
              <Bell className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile search bar */}
      <div className="md:hidden section-wrap pb-4">
        <Link
          href="/search"
          className="flex items-center gap-3 w-full px-4 py-2.5 bg-ivory border border-brown-100 rounded-2xl text-sm text-brown-400 hover:border-brown-200 transition-colors"
        >
          <Search className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1">ค้นหาหนังสือ หมวดหมู่...</span>
          <SlidersHorizontal className="w-4 h-4 flex-shrink-0" />
        </Link>
      </div>

      <div className="section-wrap">
        {/* Popular carousel */}
        {popular.length > 0 && (
          <section className="section-gap">
            <SectionHead title="มาแรงตอนนี้" href="/categories" />
            <PopularCarousel books={popular} />
          </section>
        )}

        {/* Category strip */}
        <section className="section-gap border-t border-brown-100">
          <SectionHead title="หมวดหมู่" href="/categories" />
          <div className="-mx-4 md:mx-0 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            <div className="flex gap-3 px-4 md:px-0 pb-2 w-max md:w-auto md:flex-wrap">
              {categories.map(cat => {
                const Icon = getCategoryIcon(cat.slug)
                return (
                  <Link
                    key={cat.id}
                    href={`/categories/${cat.slug}`}
                    className="flex flex-col items-center gap-1.5 flex-shrink-0 group"
                  >
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105"
                      style={{ backgroundColor: getCategoryBg(cat.color) }}
                    >
                      <Icon
                        className="w-6 h-6"
                        style={{ color: getCategoryColor(cat.color) }}
                      />
                    </div>
                    <span className="text-[11px] font-medium text-brown-600 text-center leading-tight max-w-[56px] group-hover:text-brown-800">
                      {cat.name}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>

        {/* Continue reading */}
        {continueReading.length > 0 && (
          <section className="section-gap border-t border-brown-100">
            <SectionHead title="อ่านต่อ" href="/library" />
            <div className="space-y-3">
              {continueReading.map(p => (
                <ContinueReadingCard key={p.id} progress={p} />
              ))}
            </div>
          </section>
        )}

        {/* Featured books */}
        {featured.length > 0 && (
          <section className="section-gap border-t border-brown-100">
            <SectionHead title="หนังสือแนะนำ" href="/categories" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {featured.map(book => (
                <BookCard key={book.id} book={book} variant="grid" />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function SectionHead({ title, href }: { title: string; href: string }) {
  return (
    <div className="flex items-baseline justify-between mb-5">
      <h2 className="font-serif text-heading-lg text-brown-800">{title}</h2>
      <Link href={href} className="text-sm text-orange-500 hover:underline flex items-center gap-1">
        ดูทั้งหมด <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  )
}

function ContinueReadingCard({ progress }: { progress: ReadingProgress }) {
  const book = progress.book as Book | undefined
  if (!book) return null
  return (
    <Link
      href={`/read/${book.id}/${progress.chapter_id ?? ''}`}
      className="flex gap-4 p-4 rounded-2xl border border-brown-100 hover:border-brown-200 hover:shadow-warm-sm transition-all bg-white group"
    >
      <div className="w-12 flex-shrink-0">
        <div className="book-aspect rounded-xl bg-brown-800 flex items-end justify-center p-1.5 overflow-hidden">
          <span className="text-cream text-[8px] font-serif text-center opacity-70 leading-tight">{book.title}</span>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-brown-800 group-hover:text-brown-900 line-clamp-1 text-sm">{book.title}</h3>
        <p className="text-xs text-brown-400 mt-0.5 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatReadingTime(book.reading_time_minutes)}
        </p>
        <div className="mt-2">
          <div className="flex items-center justify-between text-xs text-brown-400 mb-1">
            <span className="flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              อ่านต่อ
            </span>
            <span>{progress.progress_percent}%</span>
          </div>
          <Progress value={progress.progress_percent} />
        </div>
      </div>
    </Link>
  )
}
