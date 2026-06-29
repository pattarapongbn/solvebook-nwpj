'use client'

import { useState, useEffect } from 'react'
import { ChevronRight, PenLine, Clock, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

type AppStatus = 'none' | 'pending' | 'approved' | 'rejected' | 'loading'

const STATUS_UI: Record<Exclude<AppStatus, 'none' | 'loading'>, { label: string; icon: typeof Clock; color: string }> = {
  pending:  { label: 'รอการอนุมัติ',       icon: Clock,         color: 'text-amber-600'  },
  approved: { label: 'คุณเป็นครีเอเตอร์แล้ว', icon: CheckCircle2, color: 'text-green-600'  },
  rejected: { label: 'คำขอถูกปฏิเสธ',       icon: Clock,         color: 'text-red-500'    },
}

interface Props {
  userId: string
}

export function CreatorApplicationButton({ userId }: Props) {
  const [status, setStatus] = useState<AppStatus>('loading')
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase
      .from('creator_applications')
      .select('status')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }) => {
        setStatus((data?.status as AppStatus | undefined) ?? 'none')
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const handleApply = async () => {
    setSubmitting(true)
    const { error } = await supabase
      .from('creator_applications')
      .insert({ user_id: userId, status: 'pending' })
    setSubmitting(false)
    if (error) { toast.error(error.message); return }
    setStatus('pending')
    setShowModal(false)
    toast.success('ส่งใบสมัครแล้ว! รอการอนุมัติ')
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center gap-3 px-5 py-4">
        <div className="w-5 h-5 rounded bg-brown-100 animate-pulse" />
        <div className="h-4 flex-1 bg-brown-100 animate-pulse rounded" />
      </div>
    )
  }

  if (status !== 'none') {
    const ui = STATUS_UI[status]
    const Icon = ui.icon
    return (
      <div className="flex items-center gap-3 px-5 py-4">
        <PenLine className="w-5 h-5 flex-shrink-0 text-brown-400" />
        <span className={`text-sm font-medium flex-1 ${ui.color}`}>
          <Icon className="w-3.5 h-3.5 inline mr-1" />
          {ui.label}
        </span>
      </div>
    )
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-3 px-5 py-4 hover:bg-ivory transition-colors group w-full"
      >
        <PenLine className="w-5 h-5 flex-shrink-0 text-brown-400 group-hover:text-brown-600" />
        <span className="text-sm font-medium text-brown-700 group-hover:text-brown-900 flex-1 text-left">
          สมัครเป็นครีเอเตอร์
        </span>
        <ChevronRight className="w-4 h-4 text-brown-300" />
      </button>

      {/* Confirmation modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-3xl p-6 max-w-sm w-full shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center mb-4">
              <PenLine className="w-6 h-6 text-orange-500" />
            </div>
            <h2 className="font-serif text-xl font-semibold text-brown-900 mb-2">สมัครเป็นครีเอเตอร์</h2>
            <p className="text-sm text-brown-500 leading-relaxed mb-6">
              ในฐานะครีเอเตอร์ คุณสามารถเขียนและเผยแพร่หนังสือบน SolveBook ได้
              ทีมงานจะตรวจสอบและยืนยันภายใน 1–3 วันทำการ
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-2xl border border-brown-200 text-sm text-brown-600 hover:bg-ivory transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleApply}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-2xl bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-sm font-medium transition-colors"
              >
                {submitting ? 'กำลังส่ง...' : 'ยืนยันสมัคร'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
