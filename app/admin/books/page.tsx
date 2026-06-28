import Link from 'next/link'
import { Plus, Eye, Edit } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatReadingTime } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Admin — จัดการหนังสือ' }

export default async function AdminBooksPage() {
  const supabase = await createClient()
  const { data: books } = await supabase
    .from('books')
    .select('*, category:categories(name)')
    .order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">จัดการหนังสือ</h1>
        <Link
          href="/admin/books/new"
          className="inline-flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-orange-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          เพิ่มหนังสือ
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">ชื่อหนังสือ</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">หมวด</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">เวลาอ่าน</th>
              <th className="text-right px-6 py-3 text-gray-500 font-medium">ยอดอ่าน</th>
              <th className="text-center px-6 py-3 text-gray-500 font-medium">สถานะ</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(books ?? []).map((book: {
              id: string; title: string; reading_time_minutes: number;
              view_count: number; is_published: boolean; is_free: boolean;
              category: { name: string } | null
            }) => (
              <tr key={book.id} className="hover:bg-gray-50">
                <td className="px-6 py-3">
                  <p className="font-medium text-gray-800 line-clamp-1">{book.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{book.is_free ? 'ฟรี' : 'Premium'}</p>
                </td>
                <td className="px-6 py-3 text-gray-500">{book.category?.name ?? '—'}</td>
                <td className="px-6 py-3 text-gray-500">{formatReadingTime(book.reading_time_minutes)}</td>
                <td className="px-6 py-3 text-right text-gray-600">{book.view_count.toLocaleString()}</td>
                <td className="px-6 py-3 text-center">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                    book.is_published
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {book.is_published ? 'เผยแพร่' : 'ร่าง'}
                  </span>
                </td>
                <td className="px-6 py-3">
                  <div className="flex items-center gap-2 justify-end">
                    <Link href={`/books/${book.id}`} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                      <Eye className="w-4 h-4" />
                    </Link>
                    <Link href={`/admin/books/${book.id}/edit`} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                      <Edit className="w-4 h-4" />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
