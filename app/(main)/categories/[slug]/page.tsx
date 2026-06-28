import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BookCard } from '@/components/books/BookCard'
import type { Metadata } from 'next'
import type { Book } from '@/lib/types'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('categories').select('name, description').eq('slug', slug).single()
  if (!data) return { title: 'หมวดหมู่' }
  const c = data as unknown as { name: string; description: string | null }
  return { title: c.name, description: c.description ?? undefined }
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: cat } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!cat) notFound()

  const { data: books } = await supabase
    .from('books')
    .select('*, category:categories(id,name,slug,color,icon)')
    .eq('is_published', true)
    .eq('category_id', cat.id)
    .order('view_count', { ascending: false })

  const list = (books ?? []) as Book[]

  const getCategoryBg = (color: string) => {
    const map: Record<string, string> = {
      amber: '#FEF3C7', blue: '#DBEAFE', green: '#DCFCE7',
      red: '#FEE2E2', pink: '#FCE7F3', purple: '#EDE9FE',
      teal: '#CCFBF1', orange: '#FFEDD5', indigo: '#E0E7FF', gray: '#F3F4F6',
    }
    return map[color] ?? '#F5F0E8'
  }

  return (
    <div className="page-fade">
      {/* Category header */}
      <div className="bg-ivory border-b border-brown-100">
        <div className="section-wrap py-10">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
              style={{ backgroundColor: getCategoryBg(cat.color) }}
            >
              {cat.icon}
            </div>
            <div>
              <h1 className="font-serif text-display-sm text-brown-900">{cat.name}</h1>
              {cat.description && (
                <p className="text-brown-500 mt-1 max-w-lg">{cat.description}</p>
              )}
              <p className="text-sm text-brown-400 mt-1">{list.length} เล่ม</p>
            </div>
          </div>
        </div>
      </div>

      <div className="section-wrap py-8">
        {list.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {list.map(book => (
              <BookCard key={book.id} book={book} variant="grid" />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-brown-400">
            <p className="text-5xl mb-4">📚</p>
            <p className="font-serif text-lg text-brown-600">ยังไม่มีหนังสือในหมวดนี้</p>
            <p className="text-sm mt-2">กำลังจัดเตรียมเนื้อหา</p>
          </div>
        )}
      </div>
    </div>
  )
}
