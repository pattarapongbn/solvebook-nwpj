import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Wallet, TrendingUp, TrendingDown, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import type { TopupRequest, CoinTransaction } from '@/lib/types'

export const metadata: Metadata = { title: 'กระเป๋าคอยน์' }

const STATUS_LABEL: Record<string, string> = {
  pending:  'รอตรวจสอบ',
  approved: 'อนุมัติแล้ว',
  rejected: 'ถูกปฏิเสธ',
}
const STATUS_CLASS: Record<string, string> = {
  pending:  'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
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

export default async function WalletPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [walletRes, requestsRes, txRes] = await Promise.all([
    supabase.from('wallets').select('balance').eq('user_id', user.id).maybeSingle(),
    supabase
      .from('topup_requests')
      .select('id, coins, amount_thb, status, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('coin_transactions')
      .select('id, amount, kind, note, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const balance = walletRes.data?.balance ?? 0
  const requests = (requestsRes.data ?? []) as TopupRequest[]
  const transactions = (txRes.data ?? []) as CoinTransaction[]

  return (
    <div className="page-fade section-wrap py-6 max-w-lg">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/profile" className="p-2 -ml-2 text-brown-600 hover:text-brown-900 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-serif text-2xl font-semibold text-brown-900">กระเป๋าคอยน์</h1>
      </div>

      {/* Balance card */}
      <div className="bg-brown-800 rounded-3xl p-6 mb-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="w-4 h-4 text-orange-300" />
            <span className="text-xs text-brown-300 font-medium">ยอดคอยน์</span>
          </div>
          <div className="font-serif text-5xl font-bold mb-1">{balance}</div>
          <div className="text-sm text-brown-300">คอยน์ · 1 คอยน์ = 1 บาท</div>
          <Link
            href="/wallet/topup"
            className="mt-5 inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-5 py-2.5 rounded-2xl text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            เติมคอยน์
          </Link>
        </div>
      </div>

      {/* Topup requests */}
      {requests.length > 0 && (
        <section className="mb-8">
          <h2 className="font-serif text-lg font-semibold text-brown-800 mb-3">คำขอเติมล่าสุด</h2>
          <div className="border border-brown-100 rounded-2xl overflow-hidden divide-y divide-brown-100">
            {requests.map(r => (
              <div key={r.id} className="flex items-center gap-3 px-4 py-3 bg-white">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-brown-800">
                    {r.coins} คอยน์
                    <span className="font-normal text-brown-400 ml-1">· ฿{Number(r.amount_thb).toFixed(0)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-brown-400 mt-0.5">
                    <Clock className="w-3 h-3" />
                    {timeAgoTh(r.created_at)}
                  </div>
                </div>
                <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${STATUS_CLASS[r.status]}`}>
                  {STATUS_LABEL[r.status]}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Transaction history */}
      {transactions.length > 0 ? (
        <section>
          <h2 className="font-serif text-lg font-semibold text-brown-800 mb-3">ประวัติธุรกรรม</h2>
          <div className="border border-brown-100 rounded-2xl overflow-hidden divide-y divide-brown-100">
            {transactions.map(tx => {
              const isIn = tx.amount > 0
              return (
                <div key={tx.id} className="flex items-center gap-3 px-4 py-3 bg-white">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isIn ? 'bg-green-100' : 'bg-red-100'}`}>
                    {isIn
                      ? <TrendingUp className="w-4 h-4 text-green-600" />
                      : <TrendingDown className="w-4 h-4 text-red-500" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-brown-800">{tx.note ?? tx.kind}</div>
                    <div className="text-xs text-brown-400">{timeAgoTh(tx.created_at)}</div>
                  </div>
                  <span className={`text-sm font-semibold font-serif ${isIn ? 'text-green-600' : 'text-red-500'}`}>
                    {isIn ? '+' : ''}{tx.amount}
                  </span>
                </div>
              )
            })}
          </div>
        </section>
      ) : (
        <div className="text-center py-10 text-brown-400 text-sm">
          ยังไม่มีประวัติธุรกรรม
        </div>
      )}
    </div>
  )
}
