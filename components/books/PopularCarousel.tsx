'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { Clock, Star, Eye } from 'lucide-react'
import { BookCover } from './BookCover'
import { Badge } from '@/components/ui/badge'
import { formatReadingTime, formatNumber } from '@/lib/utils'
import type { Book } from '@/lib/types'

export function PopularCarousel({ books }: { books: Book[] }) {
  const [current, setCurrent] = useState(0)
  const touchStartX = useRef(0)

  if (!books.length) return null

  const prev = () => setCurrent(c => Math.max(0, c - 1))
  const next = () => setCurrent(c => Math.min(books.length - 1, c + 1))

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 40) diff > 0 ? next() : prev()
  }

  const book = books[current]

  return (
    <div>
      <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <Link href={`/books/${book.id}`} className="block">
          <div className="flex gap-4 p-4 bg-ivory rounded-3xl border border-brown-100 hover:border-brown-200 transition-colors">
            <div className="w-24 flex-shrink-0">
              <BookCover
                title={book.title}
                author={book.author}
                category={book.category?.name}
                color={book.category?.color}
                coverUrl={book.cover_url}
                size="lg"
              />
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
              <div>
                {book.category && (
                  <span className="text-xs text-orange-600 font-medium">{book.category.name}</span>
                )}
                <h3 className="font-serif font-semibold text-brown-900 text-base leading-snug mt-1 line-clamp-2">
                  {book.title}
                </h3>
                {book.author && (
                  <p className="text-xs text-brown-500 mt-0.5">โดย {book.author}</p>
                )}
              </div>
              <div>
                {book.description && (
                  <p className="text-xs text-brown-400 line-clamp-2 mt-2 leading-relaxed">{book.description}</p>
                )}
                <div className="flex items-center gap-3 mt-3 text-xs text-brown-400 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatReadingTime(book.reading_time_minutes)}
                  </span>
                  {book.rating > 0 && book.rating_count > 0 && (
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      {book.rating.toFixed(1)}
                    </span>
                  )}
                  {book.view_count > 0 && (
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {formatNumber(book.view_count)}
                    </span>
                  )}
                  <Badge variant={book.is_free ? 'free' : 'premium'} className="ml-auto">
                    {book.is_free ? 'ฟรี' : 'Premium'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {books.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {books.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === current ? 'w-6 bg-orange-500' : 'w-1.5 bg-brown-200 hover:bg-brown-300'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
