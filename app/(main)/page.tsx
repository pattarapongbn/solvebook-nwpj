import Link from 'next/link'
import { ArrowRight, Clock, BookOpen, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { BookCard } from '@/components/books/BookCard'
import { HorizontalScroll } from '@/components/books/HorizontalScroll'
import { Button } from '@/components/ui/button'
import { formatReadingTime } from '@/lib/utils'
import type { Book, Category } from '@/lib/types'

async function getHomeData() {
  const supabase = await createClient()

  const [catsRes, featuredRes, quickRes, popularRes] = await Promise.all([
    supabase
      .from('categories')
      .select('*, books(count)')
      .order('order_index')
      .limit(10),

    supabase
      .from('books')
      .select('*, category:categories(id,name,slug,color,icon)')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(6),

    supabase
      .from('books')
      .select('*, category:categories(id,name,slug,color,icon)')
      .eq('is_published', true)
      .lte('reading_time_minutes', 6)
      .order('view_count', { ascending: false })
      .limit(8),

    supabase
      .from('books')
      .select('*, category:categories(id,name,slug,color,icon)')
      .eq('is_published', true)
      .order('view_count', { ascending: false })
      .limit(4),
  ])

  return {
    categories: (catsRes.data ?? []) as Category[],
    featured: (featuredRes.data ?? []) as Book[],
    quick: (quickRes.data ?? []) as Book[],
    popular: (popularRes.data ?? []) as Book[],
  }
}

export default async function HomePage() {
  const { categories, featured, quick, popular } = await getHomeData()

  return (
    <div className="page-fade">
      <HeroSection />
      <div className="section-wrap">
        <CategorySection categories={categories} />
        {featured.length > 0 && <FeaturedSection books={featured} />}
        {quick.length > 0 && <QuickReadsSection books={quick} />}
        {popular.length > 0 && <PopularSection books={popular} />}
        <CtaBanner />
      </div>
    </div>
  )
}

function HeroSection() {
  return (
    <section className="relative bg-ivory border-b border-brown-100 overflow-hidden">
      {/* Subtle texture pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #2C2416 1px, transparent 0)`,
          backgroundSize: '28px 28px',
        }}
      />
      <div className="section-wrap relative py-20 md:py-28 lg:py-32">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-orange-600 bg-orange-50 px-3 py-1.5 rounded-full mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            อ่านง่าย เข้าใจได้จริง
          </div>

          <h1 className="font-serif text-display lg:text-display-lg text-brown-900 leading-tight text-balance">
            หนังสือสั้น
            <br />
            <span className="text-orange-500">สำหรับชีวิต</span>
            <br />
            ที่วุ่นวาย
          </h1>

          <p className="mt-6 text-lg md:text-xl text-brown-500 leading-relaxed max-w-lg">
            อ่านง่าย ใช้เวลาเพียง 5 นาที ได้ความรู้ที่นำไปใช้ได้จริงในชีวิตประจำวัน
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link href="/categories">
                เริ่มอ่านเลย
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/categories">หมวดหมู่ทั้งหมด</Link>
            </Button>
          </div>

          <div className="mt-10 flex flex-wrap gap-6 text-sm text-brown-400">
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" />
              หนังสือหลากหลายหมวดหมู่
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              อ่านจบใน 5–15 นาที
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

function CategorySection({ categories }: { categories: Category[] }) {
  if (!categories.length) return null

  return (
    <section className="section-gap">
      <SectionHead title="หมวดหมู่" href="/categories" />
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-8 gap-3">
        {categories.map(cat => (
          <Link
            key={cat.id}
            href={`/categories/${cat.slug}`}
            className="group flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-ivory border border-transparent hover:border-brown-100 transition-all text-center"
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-warm-sm transition-transform group-hover:scale-105"
              style={{ backgroundColor: getCategoryBgLight(cat.color) }}
            >
              {cat.icon}
            </div>
            <span className="text-xs font-medium text-brown-600 group-hover:text-brown-800 leading-tight">
              {cat.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}

function FeaturedSection({ books }: { books: Book[] }) {
  return (
    <section className="section-gap border-t border-brown-100">
      <SectionHead title="หนังสือแนะนำ" href="/categories" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
        {books.map(book => (
          <BookCard key={book.id} book={book} variant="grid" />
        ))}
      </div>
    </section>
  )
}

function QuickReadsSection({ books }: { books: Book[] }) {
  return (
    <section className="section-gap border-t border-brown-100">
      <SectionHead title="อ่านจบภายใน 5 นาที" href="/categories" />
      <HorizontalScroll books={books} />
    </section>
  )
}

function PopularSection({ books }: { books: Book[] }) {
  return (
    <section className="section-gap border-t border-brown-100">
      <SectionHead title="มาแรงตอนนี้" href="/categories" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {books.map((book, i) => (
          <Link
            key={book.id}
            href={`/books/${book.id}`}
            className="flex items-center gap-4 p-4 rounded-2xl hover:bg-ivory transition-colors group"
          >
            <span className="font-serif text-2xl font-light text-brown-200 w-8 text-center flex-shrink-0">
              {i + 1}
            </span>
            <div>
              <h3 className="font-medium text-brown-800 group-hover:text-brown-900 line-clamp-2 leading-snug">
                {book.title}
              </h3>
              <div className="flex items-center gap-2 mt-1 text-xs text-brown-400">
                {book.category?.name && <span>{book.category.name}</span>}
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatReadingTime(book.reading_time_minutes)}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

function CtaBanner() {
  return (
    <section className="section-gap border-t border-brown-100">
      <div className="bg-brown-800 rounded-3xl p-8 md:p-12 text-center">
        <h2 className="font-serif text-heading-xl text-cream">
          เริ่มต้นวันละ 5 นาที
        </h2>
        <p className="mt-3 text-brown-400 max-w-md mx-auto">
          สร้างนิสัยการอ่านที่ดีด้วยหนังสือสั้นคุณภาพสูง สมัครฟรีวันนี้
        </p>
        <Button size="lg" className="mt-6" asChild>
          <Link href="/register">สมัครสมาชิกฟรี</Link>
        </Button>
      </div>
    </section>
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

function getCategoryBgLight(color: string) {
  const map: Record<string, string> = {
    amber:  '#FEF3C7', blue: '#DBEAFE', green: '#DCFCE7',
    red:    '#FEE2E2', pink: '#FCE7F3', purple: '#EDE9FE',
    teal:   '#CCFBF1', orange: '#FFEDD5', indigo: '#E0E7FF', gray: '#F3F4F6',
  }
  return map[color] ?? '#F5F0E8'
}
