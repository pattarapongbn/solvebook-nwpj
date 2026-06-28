import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, BookOpen } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { BookCard } from '@/components/books/BookCard'
import type { Metadata } from 'next'
import type { Book, ReadingProgress, Favorite, Unlock } from '@/lib/types'

export const metadata: Metadata = { title: 'ชั้นหนังสือของฉัน' }

export default async function LibraryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [progressRes, favRes, unlocksRes] = await Promise.all([
    supabase
      .from('reading_progress')
      .select('*, book:books(*, category:categories(id,name,slug,color,icon))')
      .eq('user_id', user.id)
      .order('last_read_at', { ascending: false }),
    supabase
      .from('favorites')
      .select('*, book:books(*, category:categories(id,name,slug,color,icon))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('unlocks')
      .select('*, book:books(*, category:categories(id,name,slug,color,icon))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  const recent = (progressRes.data ?? []) as ReadingProgress[]
  const favorites = (favRes.data ?? []) as Favorite[]
  const unlocked = (unlocksRes.data ?? []) as Unlock[]
  const isEmpty = recent.length === 0 && favorites.length === 0 && unlocked.length === 0

  return (
    <div className="page-fade section-wrap py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/" className="p-2 -ml-2 text-brown-600 hover:text-brown-900 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-serif text-display-sm text-brown-900">ชั้นหนังสือของฉัน</h1>
      </div>

      {/* Section 1: อ่านล่าสุด */}
      <LibrarySection title="อ่านล่าสุด">
        {recent.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {recent.map(p => p.book && (
              <BookCard key={p.id} book={p.book as Book} variant="grid" />
            ))}
          </div>
        ) : (
          <p className="text-sm text-brown-400">ยังไม่มีหนังสือที่อ่านล่าสุด</p>
        )}
      </LibrarySection>

      {/* Section 2: ถูกใจ */}
      <LibrarySection title="ถูกใจ">
        {favorites.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {favorites.map(f => f.book && (
              <BookCard key={f.id} book={f.book as Book} variant="grid" />
            ))}
          </div>
        ) : (
          <p className="text-sm text-brown-400">ยังไม่มีหนังสือที่ถูกใจ</p>
        )}
      </LibrarySection>

      {/* Section 3: ซื้อแล้ว */}
      <LibrarySection title="ซื้อแล้ว">
        {unlocked.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {unlocked.map(u => u.book && (
              <BookCard key={u.id} book={u.book as Book} variant="grid" />
            ))}
          </div>
        ) : (
          <p className="text-sm text-brown-400">ยังไม่มีหนังสือที่ซื้อ</p>
        )}
      </LibrarySection>

      {isEmpty && (
        <div className="text-center py-16 border-t border-brown-100 mt-4">
          <BookOpen className="w-12 h-12 text-brown-200 mx-auto mb-4" />
          <p className="font-serif text-xl text-brown-600">ชั้นหนังสือของคุณว่างเปล่า</p>
          <p className="text-brown-400 mt-2 mb-6">เริ่มต้นเลือกหนังสือที่คุณสนใจ</p>
          <Link
            href="/categories"
            className="inline-flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-2xl font-medium hover:bg-orange-600 transition-colors text-sm"
          >
            เลือกหนังสือ
          </Link>
        </div>
      )}
    </div>
  )
}

function LibrarySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="font-serif text-heading-lg text-brown-800 mb-4">{title}</h2>
      {children}
    </section>
  )
}
