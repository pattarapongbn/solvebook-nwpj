'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeft, Sun, Moon, Coffee, Check } from 'lucide-react'
import type { Metadata } from 'next'

type Theme = 'light' | 'sepia' | 'dark'
type FontSize = 14 | 16 | 18 | 20 | 22

const SETTINGS_KEY = 'reader_settings'

const THEME_CFG: Record<Theme, { bg: string; text: string; label: string; icon: typeof Sun }> = {
  light: { bg: '#FAFAF7', text: '#2C2416', label: 'สว่าง',  icon: Sun    },
  sepia: { bg: '#F8F2E6', text: '#3D2E1A', label: 'ซีเปีย', icon: Coffee },
  dark:  { bg: '#1A1610', text: '#E5DDD0', label: 'มืด',    icon: Moon   },
}

export default function SettingsPage() {
  const [theme, setTheme]           = useState<Theme>('light')
  const [fontSize, setFontSize]     = useState<FontSize>(18)
  const [lineHeight, setLineHeight] = useState(1.95)
  const [loaded, setLoaded]         = useState(false)
  const [justSaved, setJustSaved]   = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load from localStorage
  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}')
      if (['light','sepia','dark'].includes(s.theme))       setTheme(s.theme)
      if ([14,16,18,20,22].includes(s.fontSize))            setFontSize(s.fontSize)
      if ([1.7,1.95,2.2].includes(s.lineHeight))            setLineHeight(s.lineHeight)
    } catch {}
    setLoaded(true)
  }, [])

  // Auto-save whenever settings change (after initial load)
  useEffect(() => {
    if (!loaded) return
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ theme, fontSize, lineHeight }))
    setJustSaved(true)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => setJustSaved(false), 1500)
  }, [loaded, theme, fontSize, lineHeight])

  const tc = THEME_CFG[theme]

  return (
    <div className="page-fade section-wrap py-6 max-w-lg">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link href="/profile" className="p-2 -ml-2 text-brown-600 hover:text-brown-900 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-serif text-2xl font-semibold text-brown-900">ตั้งค่าการอ่าน</h1>
        </div>
        {justSaved && (
          <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
            <Check className="w-3.5 h-3.5" />
            บันทึกแล้ว
          </span>
        )}
      </div>

      {/* Live preview */}
      <div
        className="rounded-2xl p-5 mb-8 border transition-all duration-200"
        style={{ background: tc.bg, color: tc.text, borderColor: tc.text + '18' }}
      >
        <p className="text-[10px] font-semibold uppercase tracking-widest opacity-30 mb-3">ตัวอย่างการอ่าน</p>
        <p style={{ fontSize: `${fontSize}px`, lineHeight }}>
          การอ่านหนังสือทุกวันช่วยพัฒนาความรู้และทักษะอย่างต่อเนื่อง
          เลือกรูปแบบที่เหมาะกับการอ่านของคุณเพื่อประสบการณ์ที่ดีที่สุด
        </p>
      </div>

      <div className="space-y-7">
        {/* Theme */}
        <div>
          <label className="block text-sm font-medium text-brown-700 mb-3">ธีมการอ่าน</label>
          <div className="grid grid-cols-3 gap-2">
            {(Object.entries(THEME_CFG) as [Theme, typeof THEME_CFG.light][]).map(([key, cfg]) => {
              const Icon = cfg.icon
              const active = theme === key
              return (
                <button
                  key={key}
                  onClick={() => setTheme(key)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                    active ? 'border-orange-500 shadow-md' : 'border-brown-100 hover:border-brown-200'
                  }`}
                  style={{ background: cfg.bg, color: cfg.text }}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-xs font-medium">{cfg.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Font size */}
        <div>
          <label className="block text-sm font-medium text-brown-700 mb-3">
            ขนาดตัวอักษร
            <span className="ml-2 text-orange-600 font-semibold">{fontSize}px</span>
          </label>
          <div className="flex gap-2">
            {([14, 16, 18, 20, 22] as FontSize[]).map(s => (
              <button
                key={s}
                onClick={() => setFontSize(s)}
                className={`flex-1 py-2.5 rounded-2xl border text-sm font-medium transition-all ${
                  fontSize === s
                    ? 'border-orange-500 bg-orange-50 text-orange-600'
                    : 'border-brown-100 text-brown-500 hover:border-brown-300'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Line height */}
        <div>
          <label className="block text-sm font-medium text-brown-700 mb-3">ระยะห่างบรรทัด</label>
          <div className="grid grid-cols-3 gap-2">
            {([1.7, 1.95, 2.2] as const).map((lh, i) => (
              <button
                key={lh}
                onClick={() => setLineHeight(lh)}
                className={`py-3 rounded-2xl border text-sm font-medium transition-all ${
                  lineHeight === lh
                    ? 'border-orange-500 bg-orange-50 text-orange-600'
                    : 'border-brown-100 text-brown-500 hover:border-brown-300'
                }`}
              >
                {['ชิด', 'ปกติ', 'กว้าง'][i]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="text-xs text-brown-400 text-center mt-8">
        การตั้งค่าจะมีผลทันทีในหน้าอ่านหนังสือ
      </p>
    </div>
  )
}
