'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Grid2X2, Search, BookMarked, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/',          icon: Home,       label: 'หน้าหลัก' },
  { href: '/categories',icon: Grid2X2,    label: 'หมวดหมู่' },
  { href: '/search',    icon: Search,     label: 'ค้นหา' },
  { href: '/library',   icon: BookMarked, label: 'ชั้นหนังสือ' },
  { href: '/profile',   icon: User,       label: 'โปรไฟล์' },
]

export function BottomNav() {
  const path = usePathname()
  const isReader = path.startsWith('/read/')
  if (isReader) return null

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-brown-100 safe-area-pb">
      <div className="flex items-stretch justify-around h-16">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = href === '/' ? path === '/' : path.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 flex-1 text-[10px] font-medium transition-colors',
                active ? 'text-orange-500' : 'text-brown-400'
              )}
            >
              <Icon className={cn('w-5 h-5 transition-all', active && 'scale-110')} />
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
