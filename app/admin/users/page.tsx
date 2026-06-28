import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Admin — ผู้ใช้งาน' }

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">ผู้ใช้งาน</h1>
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">ชื่อ</th>
              <th className="text-right px-6 py-3 text-gray-500 font-medium">อ่านจบ</th>
              <th className="text-right px-6 py-3 text-gray-500 font-medium">เวลาอ่าน</th>
              <th className="text-right px-6 py-3 text-gray-500 font-medium">สตรีค</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(profiles ?? []).map((p: {
              id: string; full_name: string | null;
              books_finished: number; minutes_read: number; reading_streak: number
            }) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-6 py-3 text-gray-800">{p.full_name ?? 'ไม่ระบุชื่อ'}</td>
                <td className="px-6 py-3 text-right text-gray-600">{p.books_finished}</td>
                <td className="px-6 py-3 text-right text-gray-600">{p.minutes_read} นาที</td>
                <td className="px-6 py-3 text-right text-gray-600">{p.reading_streak} วัน</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
