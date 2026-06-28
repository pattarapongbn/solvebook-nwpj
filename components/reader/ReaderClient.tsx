'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Settings, Sun, Moon, Coffee, ChevronLeft,
  ChevronRight, BookOpen, AlignLeft, Menu, X, Minus, Plus,
} from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import type { BookChapter } from '@/lib/types'

interface ReaderBook {
  id: string
  title: string
  author?: string | null
  category?: { name: string; color: string } | null
}

interface Props {
  book: ReaderBook
  chapters: BookChapter[]
  currentChapter: BookChapter
}

type Theme = 'light' | 'sepia' | 'dark'
type FontSize = 14 | 16 | 18 | 20 | 22

const THEME_STYLES: Record<Theme, { bg: string; text: string; border: string; toolbar: string }> = {
  light: {
    bg:      'bg-[#FAFAF7]',
    text:    'text-[#2C2416]',
    border:  'border-[#E0D8CC]',
    toolbar: 'bg-[#FAFAF7]/95 border-[#E0D8CC]',
  },
  sepia: {
    bg:      'bg-[#F8F2E6]',
    text:    'text-[#3D2E1A]',
    border:  'border-[#D4C4A8]',
    toolbar: 'bg-[#F8F2E6]/95 border-[#D4C4A8]',
  },
  dark: {
    bg:      'bg-[#1A1610]',
    text:    'text-[#E5DDD0]',
    border:  'border-[#2C2416]',
    toolbar: 'bg-[#1A1610]/95 border-[#2C2416]',
  },
}

const SETTINGS_KEY = 'reader_settings'

function loadSettings() {
  try {
    if (typeof window === 'undefined') return {}
    return JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}') as Record<string, unknown>
  } catch { return {} }
}

export function ReaderClient({ book, chapters, currentChapter }: Props) {
  const router = useRouter()
  const [loaded, setLoaded] = useState(false)
  const [theme, setTheme] = useState<Theme>('light')
  const [fontSize, setFontSize] = useState<FontSize>(18)
  const [lineHeight, setLineHeight] = useState(1.95)
  const [showSettings, setShowSettings] = useState(false)
  const [showToc, setShowToc] = useState(false)
  const [toolbarVisible, setToolbarVisible] = useState(true)
  const [scrollPct, setScrollPct] = useState(0)
  const [lastY, setLastY] = useState(0)

  // Load settings from localStorage on mount
  useEffect(() => {
    const s = loadSettings()
    if (['light','sepia','dark'].includes(s.theme as string)) setTheme(s.theme as Theme)
    if ([14,16,18,20,22].includes(s.fontSize as number))     setFontSize(s.fontSize as FontSize)
    if ([1.7,1.95,2.2].includes(s.lineHeight as number))     setLineHeight(s.lineHeight as number)
    setLoaded(true)
  }, [])

  // Persist settings whenever they change (after initial load)
  useEffect(() => {
    if (!loaded) return
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ theme, fontSize, lineHeight }))
  }, [loaded, theme, fontSize, lineHeight])

  const currentIndex = chapters.findIndex(c => c.id === currentChapter.id)
  const prevChapter = chapters[currentIndex - 1]
  const nextChapter = chapters[currentIndex + 1]
  const t = THEME_STYLES[theme]

  // Hide/show toolbar on scroll
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      const doc = document.documentElement
      const pct = Math.round((y / (doc.scrollHeight - doc.clientHeight)) * 100)
      setScrollPct(Math.min(100, pct || 0))
      setToolbarVisible(y < lastY || y < 80)
      setLastY(y)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [lastY])

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return
      if (e.key === 'ArrowRight' && nextChapter) router.push(`/read/${book.id}/${nextChapter.id}`)
      if (e.key === 'ArrowLeft' && prevChapter) router.push(`/read/${book.id}/${prevChapter.id}`)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [nextChapter, prevChapter, book.id, router])

  const toggleTheme = () => {
    const order: Theme[] = ['light', 'sepia', 'dark']
    setTheme(t => order[(order.indexOf(t) + 1) % 3])
  }

  const adjustFont = (delta: number) => {
    const sizes: FontSize[] = [14, 16, 18, 20, 22]
    const idx = sizes.indexOf(fontSize)
    const next = sizes[Math.max(0, Math.min(sizes.length - 1, idx + delta))]
    setFontSize(next)
  }

  return (
    <div className={cn('min-h-screen', t.bg, t.text, 'transition-colors duration-200')}>
      {/* Reading progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-0.5">
        <div
          className="h-full bg-orange-500 transition-all duration-150"
          style={{ width: `${scrollPct}%` }}
        />
      </div>

      {/* Top toolbar */}
      <div
        className={cn(
          'fixed top-0 left-0 right-0 z-40 border-b backdrop-blur-md transition-transform duration-200',
          t.toolbar,
          toolbarVisible ? 'translate-y-0' : '-translate-y-full'
        )}
      >
        <div className="flex items-center h-14 px-4 max-w-3xl mx-auto">
          <Link
            href={`/books/${book.id}`}
            className={cn('p-2 rounded-xl hover:bg-black/5 transition-colors mr-2', t.text)}
            aria-label="กลับ"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div className="flex-1 min-w-0 mx-2">
            <p className="text-xs opacity-50 truncate">{book.title}</p>
            <p className="text-sm font-medium truncate leading-tight">{currentChapter.title}</p>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => { setShowToc(true); setShowSettings(false) }}
              className={cn('p-2 rounded-xl hover:bg-black/5 transition-colors', t.text)}
              aria-label="สารบัญ"
            >
              <AlignLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => { setShowSettings(s => !s); setShowToc(false) }}
              className={cn('p-2 rounded-xl hover:bg-black/5 transition-colors', t.text)}
              aria-label="ตั้งค่าการอ่าน"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="px-4 pb-2 max-w-3xl mx-auto">
          <div className="flex items-center gap-3 text-xs opacity-40">
            <span>บทที่ {currentIndex + 1}/{chapters.length}</span>
            <Progress value={scrollPct} className="flex-1 h-1 bg-black/10" />
            <span>{scrollPct}%</span>
          </div>
        </div>
      </div>

      {/* Reader content */}
      <article
        className="max-w-2xl mx-auto px-5 md:px-8 pt-28 pb-32"
        style={{ fontSize: `${fontSize}px`, lineHeight }}
      >
        {/* Chapter header */}
        <header className="mb-10">
          <p className="text-xs font-medium uppercase tracking-widest opacity-40 mb-3">
            บทที่ {currentIndex + 1}
          </p>
          <h1 className={cn('font-serif font-semibold leading-tight text-balance', t.text)}
              style={{ fontSize: `${fontSize * 1.6}px`, lineHeight: 1.25 }}>
            {currentChapter.title}
          </h1>
          <div className={cn('mt-6 h-px', t.border)} />
        </header>

        {/* Body */}
        <div
          className="prose prose-reader max-w-none"
          style={{ color: 'inherit', fontSize: 'inherit', lineHeight: 'inherit' }}
          dangerouslySetInnerHTML={{ __html: formatContent(currentChapter.content ?? '') }}
        />
      </article>

      {/* Bottom navigation */}
      <div
        className={cn(
          'fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-md transition-transform duration-200',
          t.toolbar,
          toolbarVisible ? 'translate-y-0' : 'translate-y-full'
        )}
      >
        <div className="flex items-center h-16 px-4 max-w-3xl mx-auto gap-3">
          {prevChapter ? (
            <Link
              href={`/read/${book.id}/${prevChapter.id}`}
              className={cn('flex items-center gap-1.5 text-sm font-medium px-4 py-2.5 rounded-2xl border transition-colors hover:bg-black/5', t.border, t.text)}
            >
              <ChevronLeft className="w-4 h-4" />
              ก่อนหน้า
            </Link>
          ) : (
            <div className="flex-shrink-0 w-28" />
          )}

          <div className="flex-1 text-center text-xs opacity-40">
            {currentIndex + 1} / {chapters.length}
          </div>

          {nextChapter ? (
            <Link
              href={`/read/${book.id}/${nextChapter.id}`}
              className="flex items-center gap-1.5 text-sm font-medium px-4 py-2.5 rounded-2xl bg-orange-500 text-white hover:bg-orange-600 transition-colors"
            >
              ถัดไป
              <ChevronRight className="w-4 h-4" />
            </Link>
          ) : (
            <Link
              href={`/books/${book.id}`}
              className="flex items-center gap-1.5 text-sm font-medium px-4 py-2.5 rounded-2xl bg-brown-800 text-cream hover:bg-brown-700 transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              จบแล้ว
            </Link>
          )}
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <SettingsPanel
          theme={theme}
          fontSize={fontSize}
          lineHeight={lineHeight}
          onThemeChange={setTheme}
          onFontAdjust={adjustFont}
          onLineHeightChange={setLineHeight}
          onClose={() => setShowSettings(false)}
          textClass={t.text}
          bgClass={t.bg}
          borderClass={t.border}
        />
      )}

      {/* TOC panel */}
      {showToc && (
        <TocPanel
          book={book}
          chapters={chapters}
          currentId={currentChapter.id}
          onClose={() => setShowToc(false)}
          textClass={t.text}
          borderClass={t.border}
        />
      )}
    </div>
  )
}

function SettingsPanel({
  theme, fontSize, lineHeight,
  onThemeChange, onFontAdjust, onLineHeightChange, onClose,
  textClass, bgClass, borderClass,
}: {
  theme: Theme
  fontSize: FontSize
  lineHeight: number
  onThemeChange: (t: Theme) => void
  onFontAdjust: (d: number) => void
  onLineHeightChange: (h: number) => void
  onClose: () => void
  textClass: string; bgClass: string; borderClass: string
}) {
  return (
    <div className={cn('fixed top-14 right-4 z-50 w-72 rounded-3xl border shadow-warm-lg p-5', bgClass, borderClass)}>
      <div className="flex items-center justify-between mb-5">
        <span className={cn('font-medium text-sm', textClass)}>ตั้งค่าการอ่าน</span>
        <button onClick={onClose} className={cn('p-1 rounded-lg hover:bg-black/5', textClass)}>
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Theme */}
      <div className="mb-5">
        <label className={cn('text-xs opacity-50 block mb-2', textClass)}>ธีม</label>
        <div className="flex gap-2">
          {(['light', 'sepia', 'dark'] as Theme[]).map(t => (
            <button
              key={t}
              onClick={() => onThemeChange(t)}
              className={cn(
                'flex-1 py-2.5 rounded-2xl text-xs font-medium border transition-all',
                theme === t ? 'border-orange-500 text-orange-600' : `opacity-60 ${borderClass}`,
              )}
              style={{
                background: t === 'light' ? '#FAFAF7' : t === 'sepia' ? '#F8F2E6' : '#1A1610',
                color: t === 'dark' ? '#E5DDD0' : '#2C2416',
              }}
            >
              {t === 'light' ? <><Sun className="w-3.5 h-3.5 mx-auto mb-0.5" />สว่าง</> : null}
              {t === 'sepia' ? <><Coffee className="w-3.5 h-3.5 mx-auto mb-0.5" />ซีเปีย</> : null}
              {t === 'dark' ? <><Moon className="w-3.5 h-3.5 mx-auto mb-0.5" />มืด</> : null}
            </button>
          ))}
        </div>
      </div>

      {/* Font size */}
      <div className="mb-5">
        <label className={cn('text-xs opacity-50 block mb-2', textClass)}>ขนาดตัวอักษร ({fontSize}px)</label>
        <div className="flex items-center gap-3">
          <button onClick={() => onFontAdjust(-1)} className={cn('p-2 rounded-xl hover:bg-black/5', textClass)}>
            <Minus className="w-4 h-4" />
          </button>
          <div className="flex-1 h-1 rounded-full bg-black/10">
            <div
              className="h-full rounded-full bg-orange-500"
              style={{ width: `${((fontSize - 14) / 8) * 100}%` }}
            />
          </div>
          <button onClick={() => onFontAdjust(1)} className={cn('p-2 rounded-xl hover:bg-black/5', textClass)}>
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Line height */}
      <div>
        <label className={cn('text-xs opacity-50 block mb-2', textClass)}>ระยะห่างบรรทัด</label>
        <div className="flex gap-2">
          {[1.7, 1.95, 2.2].map(lh => (
            <button
              key={lh}
              onClick={() => onLineHeightChange(lh)}
              className={cn(
                'flex-1 py-2 rounded-2xl text-xs border transition-all',
                lineHeight === lh ? 'border-orange-500 text-orange-600' : `opacity-50 ${borderClass}`,
                textClass,
              )}
            >
              {lh === 1.7 ? 'ชิด' : lh === 1.95 ? 'ปกติ' : 'กว้าง'}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function TocPanel({
  book, chapters, currentId, onClose, textClass, borderClass,
}: {
  book: ReaderBook
  chapters: BookChapter[]
  currentId: string
  onClose: () => void
  textClass: string; borderClass: string
}) {
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed top-0 left-0 h-full w-80 max-w-[85vw] z-50 bg-white shadow-warm-lg flex flex-col">
        <div className={cn('flex items-center justify-between p-5 border-b', borderClass)}>
          <div>
            <p className="text-xs text-brown-400 mb-0.5">กำลังอ่าน</p>
            <h2 className="font-serif font-semibold text-brown-800 text-base leading-snug">{book.title}</h2>
          </div>
          <button onClick={onClose} className="p-2 text-brown-400 hover:text-brown-600 hover:bg-ivory rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-0.5">
          {chapters.map((ch, i) => (
            <Link
              key={ch.id}
              href={`/read/${book.id}/${ch.id}`}
              onClick={onClose}
              className={cn(
                'flex items-start gap-3 px-4 py-3 rounded-2xl text-sm transition-colors',
                ch.id === currentId
                  ? 'bg-orange-50 text-orange-700 font-medium'
                  : 'text-brown-600 hover:bg-ivory hover:text-brown-800',
              )}
            >
              <span className="font-serif text-xs opacity-40 mt-0.5 w-5 flex-shrink-0 text-right">{i + 1}</span>
              <span className="leading-snug">{ch.title}</span>
            </Link>
          ))}
        </nav>
      </div>
    </>
  )
}

function formatContent(raw: string): string {
  if (!raw) return ''
  // Convert plain text paragraphs to HTML
  if (!raw.startsWith('<')) {
    return raw
      .split(/\n\n+/)
      .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
      .join('')
  }
  return raw
}
