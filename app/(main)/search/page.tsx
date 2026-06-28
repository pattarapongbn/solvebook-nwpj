import { createClient } from '@/lib/supabase/server'
import { Search, BookOpen } from 'lucide-react'
import { BooksFilter } from '@/components/books/BooksFilter'
import type { Metadata } from 'next'
import type { Book } from '@/lib/types'

interface Props {
  searchParams: Promise<{ q?: string }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams
  return { title: q ? `ค้นหา: ${q}` : 'ค้นหา' }
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams
  const query = q?.trim() ?? ''

  let books: Book[] = []

  if (query) {
    const supabase = await createClient()
    const { data } = await supabase
      .from('books')
      .select('*, category:categories(id,name,slug,color,icon)')
      .eq('is_published', true)
      .or(`title.ilike.%${query}%,description.ilike.%${query}%,author.ilike.%${query}%`)
      .order('view_count', { ascending: false })
      .limit(40)

    books = (data ?? []) as Book[]
  }

  return (
    <div className="page-fade">
      {/* Sticky search bar */}
      <div className="sticky top-0 z-20 bg-cream/95 backdrop-blur-sm border-b border-brown-100">
        <div className="section-wrap py-3">
          <form method="GET" action="/search" className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brown-400 pointer-events-none" />
            <input
              name="q"
              defaultValue={query}
              placeholder="ค้นหาหนังสือ ผู้แต่ง หมวดหมู่..."
              className="w-full pl-11 pr-4 py-2.5 bg-ivory border border-brown-100 rounded-2xl text-sm text-brown-700 placeholder:text-brown-400 focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400"
            />
          </form>
        </div>
      </div>

      <div className="section-wrap py-8">
        {query && (
          <div className="mb-6">
            <h1 className="font-serif text-heading-xl text-brown-800">
              ผลการค้นหา &ldquo;{query}&rdquo;
            </h1>
            <p className="text-sm text-brown-500 mt-1">พบ {books.length} เล่ม</p>
          </div>
        )}

        {!query && (
          <div className="text-center py-24">
            <Search className="w-12 h-12 text-brown-200 mx-auto mb-4" />
            <p className="font-serif text-lg text-brown-600">พิมพ์คำค้นหาด้านบน</p>
            <p className="text-sm text-brown-400 mt-2">ค้นหาโดยชื่อเรื่อง ผู้แต่ง หรือหมวดหมู่</p>
          </div>
        )}

        {query && books.length === 0 && (
          <div className="text-center py-24">
            <BookOpen className="w-12 h-12 text-brown-200 mx-auto mb-4" />
            <p className="font-serif text-lg text-brown-600">ไม่พบหนังสือที่ตรงกัน</p>
            <p className="text-sm text-brown-400 mt-2">ลองใช้คำค้นหาอื่น</p>
          </div>
        )}

        {books.length > 0 && (
          <BooksFilter books={books} emptyText="ไม่พบหนังสือที่ตรงกับตัวกรอง" />
        )}
      </div>
    </div>
  )
}
