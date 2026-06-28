'use client'

import { useState, useMemo } from 'react'
import { BookCard } from './BookCard'
import type { Book } from '@/lib/types'

type FilterKey = 'all' | 'free' | 'premium' | 'new' | 'popular'

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all',     label: 'ทั้งหมด'  },
  { key: 'free',    label: 'ฟรี'      },
  { key: 'premium', label: 'พรีเมียม' },
  { key: 'new',     label: 'ใหม่'     },
  { key: 'popular', label: 'ยอดนิยม'  },
]

export function BooksFilter({ books, emptyText = 'ยังไม่มีหนังสือ' }: { books: Book[]; emptyText?: string }) {
  const [filter, setFilter] = useState<FilterKey>('all')

  const filtered = useMemo(() => {
    let result = [...books]
    if (filter === 'free')    result = result.filter(b => b.is_free)
    if (filter === 'premium') result = result.filter(b => !b.is_free)
    if (filter === 'new')     result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    if (filter === 'popular') result.sort((a, b) => b.view_count - a.view_count)
    return result
  }, [books, filter])

  return (
    <>
      <div className="flex gap-2 overflow-x-auto pb-1 mb-6" style={{ scrollbarWidth: 'none' }}>
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
              filter === f.key
                ? 'bg-brown-800 text-cream border-brown-800'
                : 'bg-white text-brown-600 border-brown-100 hover:border-brown-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 md:gap-6">
          {filtered.map(book => (
            <BookCard key={book.id} book={book} variant="grid" />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="font-serif text-lg text-brown-600">{emptyText}</p>
          <p className="text-sm text-brown-400 mt-2">กำลังจัดเตรียมเนื้อหา</p>
        </div>
      )}
    </>
  )
}
