import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatReadingTime(minutes: number): string {
  if (minutes < 60) return `${minutes} นาที`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h} ชม. ${m} นาที` : `${h} ชม.`
}

export function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return String(n)
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^฀-๿a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function timeAgo(date: string): string {
  const now = Date.now()
  const diff = now - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'เมื่อกี้'
  if (mins < 60) return `${mins} นาทีที่แล้ว`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} วันที่แล้ว`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} เดือนที่แล้ว`
  return `${Math.floor(months / 12)} ปีที่แล้ว`
}

export function getCategoryColor(color: string): string {
  const map: Record<string, string> = {
    amber:  '#B7791F',
    blue:   '#2B6CB0',
    green:  '#276749',
    red:    '#C53030',
    pink:   '#97266D',
    purple: '#553C9A',
    teal:   '#285E61',
    orange: '#C05621',
    indigo: '#434190',
    gray:   '#4A5568',
    brown:  '#7B4F2E',
  }
  return map[color] ?? '#5C5346'
}

export function getCategoryBg(color: string): string {
  const map: Record<string, string> = {
    amber:  '#FFFBEB',
    blue:   '#EBF8FF',
    green:  '#F0FFF4',
    red:    '#FFF5F5',
    pink:   '#FFF5F7',
    purple: '#FAF5FF',
    teal:   '#E6FFFA',
    orange: '#FFFAF0',
    indigo: '#EBF4FF',
    gray:   '#F7FAFC',
    brown:  '#FEF3E8',
  }
  return map[color] ?? '#FAF8F5'
}
