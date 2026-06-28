'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Download, Upload, CheckCircle, Clock, Wallet } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { CoinPackage } from '@/lib/types'

type Step = 'select' | 'pay' | 'success'

interface Props {
  packages: CoinPackage[]
  promptpayId: string
  isWelcomeAvailable: boolean
  balance: number
}

export function TopupClient({ packages, promptpayId, isWelcomeAvailable, balance }: Props) {
  const [step, setStep] = useState<Step>('select')
  const [selectedPkg, setSelectedPkg] = useState<CoinPackage | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [slipFile, setSlipFile] = useState<File | null>(null)
  const [slipPreview, setSlipPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (step !== 'pay' || !selectedPkg) return
    let cancelled = false
    ;(async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const generatePayload = ((await import('promptpay-qr')) as any).default
        const QRCode = await import('qrcode')
        const payload = generatePayload(promptpayId, { amount: Number(selectedPkg.amount_thb) })
        const url = await QRCode.toDataURL(payload, { errorCorrectionLevel: 'H', margin: 2, width: 280 })
        if (!cancelled) setQrDataUrl(url)
      } catch {
        if (!cancelled) setError('ไม่สามารถสร้าง QR ได้')
      }
    })()
    return () => { cancelled = true }
  }, [step, selectedPkg, promptpayId])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSlipFile(file)
    const reader = new FileReader()
    reader.onload = () => setSlipPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSubmit = async () => {
    setError(null)
    setUploading(true)
    try {
      const supabase = createClient()
      let slipUrl: string | null = null

      if (slipFile) {
        const ext = slipFile.name.split('.').pop() ?? 'jpg'
        const path = `${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage.from('slips').upload(path, slipFile)
        if (uploadError) throw new Error('อัปโหลดสลิปไม่สำเร็จ: ' + uploadError.message)
        const { data: { publicUrl } } = supabase.storage.from('slips').getPublicUrl(path)
        slipUrl = publicUrl
      }

      const { error: rpcError } = await supabase.rpc('create_topup_request', {
        p_pack_code: selectedPkg!.code,
        p_slip_url: slipUrl,
      })
      if (rpcError) throw new Error(rpcError.message)
      setStep('success')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด')
    } finally {
      setUploading(false)
    }
  }

  const downloadQr = () => {
    if (!qrDataUrl) return
    const a = document.createElement('a')
    a.href = qrDataUrl
    a.download = 'promptpay-qr.png'
    a.click()
  }

  const resetPay = () => {
    setStep('select')
    setQrDataUrl(null)
    setSlipFile(null)
    setSlipPreview(null)
    setError(null)
  }

  if (step === 'success') {
    return (
      <div className="flex flex-col items-center text-center py-12 gap-4">
        <CheckCircle className="w-16 h-16 text-green-500" />
        <h2 className="font-serif text-2xl font-semibold text-brown-800">ส่งคำขอเรียบร้อย</h2>
        <p className="text-brown-500 max-w-xs leading-relaxed">
          แอดมินจะตรวจสอบสลิปและเติมคอยน์ให้คุณภายใน 24 ชั่วโมง
        </p>
        <Link
          href="/wallet"
          className="mt-4 bg-orange-500 text-white px-6 py-3 rounded-2xl font-medium hover:bg-orange-600 transition-colors"
        >
          กลับหน้ากระเป๋า
        </Link>
      </div>
    )
  }

  if (step === 'pay' && selectedPkg) {
    return (
      <div>
        <button
          onClick={resetPay}
          className="flex items-center gap-2 text-sm text-brown-500 hover:text-brown-800 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          เปลี่ยนแพ็กเกจ
        </button>

        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-6 flex items-center justify-between">
          <div>
            <div className="font-medium text-brown-800">{selectedPkg.label}</div>
            <div className="text-sm text-brown-500">{selectedPkg.coins} คอยน์</div>
          </div>
          <div className="text-2xl font-serif font-semibold text-orange-600">
            ฿{Number(selectedPkg.amount_thb).toFixed(0)}
          </div>
        </div>

        <div className="flex flex-col items-center mb-8">
          <h3 className="font-serif text-lg font-semibold text-brown-800 mb-4">สแกน QR เพื่อชำระเงิน</h3>
          {qrDataUrl ? (
            <div className="flex flex-col items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrDataUrl} alt="PromptPay QR" className="w-56 h-56 rounded-2xl border-4 border-white shadow-lg" />
              <p className="text-xs text-brown-400">PromptPay · {promptpayId}</p>
              <button
                onClick={downloadQr}
                className="flex items-center gap-2 text-sm text-brown-600 hover:text-brown-900 border border-brown-200 rounded-xl px-4 py-2 hover:bg-ivory transition-colors"
              >
                <Download className="w-4 h-4" />
                บันทึก QR
              </button>
            </div>
          ) : (
            <div className="w-56 h-56 rounded-2xl bg-brown-50 animate-pulse flex items-center justify-center">
              <Clock className="w-8 h-8 text-brown-300" />
            </div>
          )}
        </div>

        <div className="mb-6">
          <h3 className="font-serif text-lg font-semibold text-brown-800 mb-3">อัปโหลดสลิปการโอน</h3>
          <label className="block cursor-pointer">
            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            {slipPreview ? (
              <div className="text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={slipPreview} alt="สลิป" className="w-full max-w-xs mx-auto rounded-2xl border-2 border-orange-300 object-cover max-h-72" />
                <p className="text-sm text-orange-600 font-medium mt-2">กดเพื่อเปลี่ยนรูป</p>
              </div>
            ) : (
              <div className="border-2 border-dashed border-brown-200 rounded-2xl p-8 flex flex-col items-center gap-2 hover:border-orange-400 hover:bg-orange-50 transition-colors">
                <Upload className="w-8 h-8 text-brown-300" />
                <span className="text-sm text-brown-500">กดเพื่อเลือกรูปสลิป</span>
                <span className="text-xs text-brown-400">JPG, PNG ขนาดไม่เกิน 10MB</span>
              </div>
            )}
          </label>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 text-sm rounded-xl p-3 mb-4 border border-red-200">
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={uploading}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold py-3.5 rounded-2xl transition-colors"
        >
          {uploading ? 'กำลังส่ง...' : 'ยืนยันการชำระเงิน'}
        </button>
        <p className="text-xs text-brown-400 text-center mt-3">
          แอดมินจะตรวจสอบและอนุมัติภายใน 24 ชั่วโมง
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="bg-ivory border border-brown-100 rounded-2xl p-4 mb-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
          <Wallet className="w-5 h-5 text-orange-600" />
        </div>
        <div>
          <div className="text-xs text-brown-400">ยอดคอยน์ปัจจุบัน</div>
          <div className="font-serif text-2xl font-semibold text-brown-800">
            {balance} <span className="text-sm font-sans font-normal text-brown-500">คอยน์</span>
          </div>
        </div>
      </div>

      <h2 className="font-serif text-lg font-semibold text-brown-800 mb-4">เลือกแพ็กเกจ</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {packages.map(pkg => {
          const isWelcome = pkg.is_welcome
          const disabled = isWelcome && !isWelcomeAvailable
          const bonus = pkg.coins - Number(pkg.amount_thb)

          return (
            <button
              key={pkg.code}
              onClick={() => { if (!disabled) { setSelectedPkg(pkg); setStep('pay') } }}
              disabled={disabled}
              className={`relative text-left p-4 rounded-2xl border-2 transition-all ${
                isWelcome
                  ? disabled
                    ? 'border-brown-100 bg-brown-50 opacity-50 cursor-not-allowed'
                    : 'border-orange-400 bg-orange-50 hover:bg-orange-100 shadow-md'
                  : 'border-brown-100 bg-white hover:border-orange-300 hover:bg-orange-50'
              }`}
            >
              {isWelcome && !disabled && (
                <span className="absolute top-2 right-2 bg-orange-500 text-white text-[10px] font-medium px-2 py-0.5 rounded-full leading-none">
                  ครั้งเดียว ภายใน 7 วัน
                </span>
              )}
              {isWelcome && disabled && (
                <span className="absolute top-2 right-2 bg-brown-300 text-white text-[10px] font-medium px-2 py-0.5 rounded-full leading-none">
                  ใช้ไปแล้ว
                </span>
              )}
              <div className="font-serif font-semibold text-brown-800 mb-1 pr-24">{pkg.label}</div>
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="text-2xl font-bold text-orange-600">{pkg.coins}</span>
                <span className="text-sm text-brown-500">คอยน์</span>
                {bonus > 0 && (
                  <span className="text-xs text-green-600 font-medium">(+{bonus} โบนัส)</span>
                )}
              </div>
              <div className="text-sm text-brown-400 mt-1">฿{Number(pkg.amount_thb).toFixed(0)}</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
