import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { BooksFilter } from '@/components/books/BooksFilter'
import { getCategoryIcon } from '@/lib/category-icons'
import { getCategoryBg, getCategoryColor } from '@/lib/utils'
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

  const { data: cat } = await supabase.from('categories').select('*').eq('slug', slug).single()
  if (!cat) notFound()

  const { data: books } = await supabase
    .from('books')
    .select('*, category:categories(id,name,slug,color,icon)')
    .eq('is_published', true)
    .eq('category_id', cat.id)
    .order('view_count', { ascending: false })

  const list = (books ?? []) as Book[]
  const Icon = getCategoryIcon(cat.slug)

  return (
    <div className="page-fade">
      {/* Sticky search */}
      <div className="sticky top-0 z-20 bg-cream/95 backdrop-blur-sm border-b border-brown-100">
        <div className="section-wrap py-3">
          <Link
            href="/search"
            className="flex items-center gap-3 w-full px-4 py-2.5 bg-ivory border border-brown-100 rounded-2xl text-sm text-brown-400 hover:border-brown-200 transition-colors"
          >
            <Search className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">ค้นหาหนังสือ...</span>
          </Link>
        </div>
      </div>

      {/* Category header */}
      <div className="bg-ivory border-b border-brown-100">
        <div className="section-wrap py-8">
          <Link href="/categories" className="inline-flex p-2 -ml-2 text-brown-600 hover:text-brown-900 transition-colors mb-3">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: getCategoryBg(cat.color) }}
            >
              <Icon className="w-6 h-6" style={{ color: getCategoryColor(cat.color) }} />
            </div>
            <div>
              <h1 className="font-serif text-display-sm text-brown-900">{cat.name}</h1>
              {cat.description && (
                <p className="text-brown-500 mt-1 max-w-lg text-sm">{cat.description}</p>
              )}
              <p className="text-xs text-brown-400 mt-1">{list.length} เล่ม</p>
            </div>
          </div>
        </div>
      </div>

      <div className="section-wrap py-8">
        <BooksFilter books={list} emptyText="ยังไม่มีหนังสือในหมวดนี้" />
      </div>
    </div>
  )
}
