import { createClient } from '@/lib/supabase/server'
import { BookCard } from '@/components/books/BookCard'
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
    <div className="page-fade section-wrap py-8">
      <div className="mb-6">
        <h1 className="font-serif text-heading-xl text-brown-800">
          {query ? `ผลการค้นหา "${query}"` : 'ค้นหาหนังสือ'}
        </h1>
        {query && (
          <p className="text-sm text-brown-500 mt-1">
            พบ {books.length} เล่ม
          </p>
        )}
      </div>

      {!query && (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">🔍</p>
          <p className="font-serif text-lg text-brown-600">พิมพ์คำค้นหาด้านบน</p>
          <p className="text-sm text-brown-400 mt-2">ค้นหาโดยชื่อเรื่อง ผู้แต่ง หรือหมวดหมู่</p>
        </div>
      )}

      {query && books.length === 0 && (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">📭</p>
          <p className="font-serif text-lg text-brown-600">ไม่พบหนังสือที่ตรงกัน</p>
          <p className="text-sm text-brown-400 mt-2">ลองใช้คำค้นหาอื่น</p>
        </div>
      )}

      {books.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {books.map(book => (
            <BookCard key={book.id} book={book} variant="grid" />
          ))}
        </div>
      )}
    </div>
  )
}
