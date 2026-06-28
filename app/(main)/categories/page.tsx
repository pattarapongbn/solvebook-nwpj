import Link from 'next/link'
import { Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getCategoryIcon } from '@/lib/category-icons'
import { getCategoryBg, getCategoryColor } from '@/lib/utils'
import type { Metadata } from 'next'
import type { Category } from '@/lib/types'

export const metadata: Metadata = {
  title: 'หมวดหมู่ทั้งหมด',
  description: 'เลือกหมวดหมู่หนังสือที่คุณสนใจ',
}

export default async function CategoriesPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('categories')
    .select('*, books(count)')
    .order('order_index')

  const categories = (data ?? []) as (Category & { books: { count: number }[] })[]

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

      <div className="section-wrap py-8">
        <div className="mb-6">
          <h1 className="font-serif text-display-sm text-brown-900">หมวดหมู่</h1>
          <p className="text-brown-500 mt-1">เลือกหัวข้อที่คุณสนใจ</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(cat => {
            const count = cat.books?.[0]?.count ?? 0
            const Icon = getCategoryIcon(cat.slug)
            return (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug}`}
                className="group flex items-center gap-4 p-4 rounded-3xl border border-brown-100 hover:border-brown-200 hover:shadow-warm transition-all bg-white"
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
                  style={{ backgroundColor: getCategoryBg(cat.color) }}
                >
                  <Icon
                    className="w-5 h-5"
                    style={{ color: getCategoryColor(cat.color) }}
                  />
                </div>
                <div className="min-w-0">
                  <h2 className="font-serif font-semibold text-brown-800 group-hover:text-brown-900 truncate text-sm">
                    {cat.name}
                  </h2>
                  <p className="text-xs text-brown-400 mt-0.5">{count} เล่ม</p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
