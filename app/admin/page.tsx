import { createClient } from '@/lib/supabase/server'
import { BookOpen, Users, Eye, Clock } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Admin — ภาพรวม' }

export default async function AdminPage() {
  const supabase = await createClient()

  const [booksRes, usersRes, viewsRes, chaptersRes, recentBooksRes] = await Promise.all([
    supabase.from('books').select('id', { count: 'exact' }).eq('is_published', true),
    supabase.from('profiles').select('id', { count: 'exact' }),
    supabase.from('books').select('view_count'),
    supabase.from('book_chapters').select('id', { count: 'exact' }),
    supabase
      .from('books')
      .select('id, title, view_count, is_published, created_at, category:categories(name)')
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const totalViews = (viewsRes.data ?? []).reduce((s, b) => s + (b.view_count ?? 0), 0)
  const stats = [
    { label: 'หนังสือที่เผยแพร่', value: booksRes.count ?? 0, icon: BookOpen, color: 'text-orange-500' },
    { label: 'ผู้ใช้งานทั้งหมด', value: usersRes.count ?? 0, icon: Users, color: 'text-blue-500' },
    { label: 'ยอดการอ่านรวม', value: totalViews, icon: Eye, color: 'text-green-600' },
    { label: 'บทความทั้งหมด', value: chaptersRes.count ?? 0, icon: Clock, color: 'text-purple-500' },
  ]

  const recentBooks = recentBooksRes.data

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">ภาพรวมระบบ</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-5">
            <s.icon className={`w-6 h-6 ${s.color} mb-3`} />
            <div className="text-2xl font-semibold text-gray-900">{s.value.toLocaleString()}</div>
            <div className="text-sm text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-medium text-gray-800">หนังสือล่าสุด</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">ชื่อหนังสือ</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">หมวด</th>
              <th className="text-right px-6 py-3 text-gray-500 font-medium">ยอดอ่าน</th>
              <th className="text-center px-6 py-3 text-gray-500 font-medium">สถานะ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {((recentBooks ?? []) as unknown as { id: string; title: string; view_count: number; is_published: boolean; created_at: string; category: { name: string } | null }[]).map((book) => (
              <tr key={book.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-3 text-gray-800">{book.title}</td>
                <td className="px-6 py-3 text-gray-500">{book.category?.name ?? '—'}</td>
                <td className="px-6 py-3 text-right text-gray-600">{book.view_count.toLocaleString()}</td>
                <td className="px-6 py-3 text-center">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                    book.is_published
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {book.is_published ? 'เผยแพร่' : 'ฉบับร่าง'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
