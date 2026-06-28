import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { TopupClient } from '@/components/wallet/TopupClient'
import type { Metadata } from 'next'
import type { CoinPackage } from '@/lib/types'

export const metadata: Metadata = { title: 'เติมคอยน์' }

export default async function TopupPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [packagesRes, walletRes, settingRes, welcomeRes] = await Promise.all([
    supabase
      .from('coin_packages')
      .select('*')
      .eq('active', true)
      .order('sort_order'),
    supabase.from('wallets').select('balance').eq('user_id', user.id).maybeSingle(),
    supabase.from('app_settings').select('value').eq('key', 'promptpay_id').maybeSingle(),
    supabase.rpc('welcome_available'),
  ])

  const packages = (packagesRes.data ?? []) as CoinPackage[]
  const balance = walletRes.data?.balance ?? 0
  const promptpayId = settingRes.data?.value ?? ''
  const isWelcomeAvailable = welcomeRes.data === true

  return (
    <div className="page-fade section-wrap py-6 max-w-lg">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/wallet" className="p-2 -ml-2 text-brown-600 hover:text-brown-900 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-serif text-2xl font-semibold text-brown-900">เติมคอยน์</h1>
      </div>

      <TopupClient
        packages={packages}
        promptpayId={promptpayId}
        isWelcomeAvailable={isWelcomeAvailable}
        balance={balance}
      />
    </div>
  )
}
