import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import type { Category } from '@/lib/types'

export const metadata: Metadata = {
  title: 'หมวดหมู่ทั้งหมด',
  description: 'เลือกหมวดหมู่หนังสือที่คุณสนใจ',
}

function getCategoryBg(color: string) {
  const map: Record<string, string> = {
    amber: '#FEF3C7', blue: '#DBEAFE', green: '#DCFCE7',
    red: '#FEE2E2', pink: '#FCE7F3', purple: '#EDE9FE',
    teal: '#CCFBF1', orange: '#FFEDD5', indigo: '#E0E7FF', gray: '#F3F4F6',
  }
  return map[color] ?? '#F5F0E8'
}

export default async function CategoriesPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('categories')
    .select('*, books(count)')
    .order('order_index')

  const categories = (data ?? []) as (Category & { books: { count: number }[] })[]

  return (
    <div className="page-fade section-wrap py-10">
      <div className="mb-8">
        <h1 className="font-serif text-display-sm text-brown-900">หมวดหมู่</h1>
        <p className="text-brown-500 mt-2">เลือกหัวข้อที่คุณสนใจ แล้วเริ่มอ่านได้เลย</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map(cat => {
          const count = cat.books?.[0]?.count ?? 0
          return (
            <Link
              key={cat.id}
              href={`/categories/${cat.slug}`}
              className="group flex items-center gap-5 p-5 rounded-3xl border border-brown-100 hover:border-brown-200 hover:shadow-warm transition-all bg-white"
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 transition-transform group-hover:scale-105"
                style={{ backgroundColor: getCategoryBg(cat.color) }}
              >
                {cat.icon}
              </div>
              <div className="min-w-0">
                <h2 className="font-serif font-semibold text-brown-800 group-hover:text-brown-900 truncate">
                  {cat.name}
                </h2>
                {cat.description && (
                  <p className="text-sm text-brown-500 mt-0.5 line-clamp-1">{cat.description}</p>
                )}
                <p className="text-xs text-brown-400 mt-1">{count} เล่ม</p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
