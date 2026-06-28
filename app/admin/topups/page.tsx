'use client'

import { useEffect, useState, useCallback } from 'react'
import { CheckCircle, XCircle, Clock, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { TopupRequest } from '@/lib/types'

type RequestWithUser = TopupRequest & {
  displayName: string
}

function timeAgoTh(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'เมื่อกี้'
  if (m < 60) return `${m} นาทีที่แล้ว`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} ชั่วโมงที่แล้ว`
  return `${Math.floor(h / 24)} วันที่แล้ว`
}

export default function AdminTopupsPage() {
  const supabase = createClient()
  const [requests, setRequests] = useState<RequestWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: rawReqs, error: reqErr } = await supabase
        .from('topup_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (reqErr) throw reqErr

      const userIds = [...new Set((rawReqs ?? []).map(r => r.user_id))]
      const profileMap: Record<string, string> = {}
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name, full_name')
          .in('id', userIds)
        for (const p of profiles ?? []) {
          profileMap[p.id] = p.display_name ?? p.full_name ?? p.id.slice(0, 8)
        }
      }

      setRequests(
        (rawReqs ?? []).map(r => ({
          ...(r as TopupRequest),
          displayName: profileMap[r.user_id] ?? r.user_id.slice(0, 8),
        }))
      )
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'โหลดข้อมูลไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => { fetchRequests() }, [fetchRequests])

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setActing(id)
    setError(null)
    try {
      const fn = action === 'approve' ? 'approve_topup' : 'reject_topup'
      const { error: rpcErr } = await supabase.rpc(fn, { p_request_id: id })
      if (rpcErr) throw rpcErr
      await fetchRequests()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด')
    } finally {
      setActing(null)
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-gray-900">อนุมัติการเติมคอยน์</h1>
          <p className="text-sm text-gray-500 mt-1">คำขอที่รอตรวจสอบ</p>
        </div>
        <button
          onClick={fetchRequests}
          className="text-sm text-gray-600 hover:text-gray-900 border border-gray-200 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors"
        >
          รีเฟรช
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3 mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-gray-400 text-sm">กำลังโหลด...</div>
      ) : requests.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-300" />
          <p className="font-medium">ไม่มีคำขอที่รอตรวจสอบ</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map(r => (
            <div key={r.id} className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col sm:flex-row gap-4">
              {/* Slip image */}
              {r.slip_url ? (
                <a
                  href={r.slip_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 group relative"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={r.slip_url}
                    alt="สลิป"
                    className="w-24 h-32 object-cover rounded-xl border border-gray-200 group-hover:opacity-80 transition-opacity"
                  />
                  <ExternalLink className="absolute bottom-1 right-1 w-3 h-3 text-gray-500 bg-white rounded" />
                </a>
              ) : (
                <div className="flex-shrink-0 w-24 h-32 rounded-xl bg-gray-100 flex items-center justify-center text-xs text-gray-400">
                  ไม่มีสลิป
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="font-medium text-gray-800">{r.displayName}</div>
                    <div className="text-xs text-gray-400 font-mono">{r.user_id.slice(0, 12)}...</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-serif font-semibold text-orange-600 text-lg">{r.coins} คอยน์</div>
                    <div className="text-sm text-gray-500">฿{Number(r.amount_thb).toFixed(0)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400 mb-4">
                  <Clock className="w-3 h-3" />
                  {timeAgoTh(r.created_at)}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAction(r.id, 'approve')}
                    disabled={acting === r.id}
                    className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    อนุมัติ
                  </button>
                  <button
                    onClick={() => handleAction(r.id, 'reject')}
                    disabled={acting === r.id}
                    className="flex items-center gap-1.5 bg-red-100 hover:bg-red-200 disabled:opacity-60 text-red-700 text-sm font-medium px-4 py-2 rounded-xl transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    ปฏิเสธ
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
