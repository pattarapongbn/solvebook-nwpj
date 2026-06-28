import Link from 'next/link'
import { Clock, Star } from 'lucide-react'
import { BookCover } from './BookCover'
import { Badge } from '@/components/ui/badge'
import { formatReadingTime } from '@/lib/utils'
import type { Book } from '@/lib/types'

interface BookCardProps {
  book: Book
  variant?: 'grid' | 'horizontal' | 'list'
}

export function BookCard({ book, variant = 'grid' }: BookCardProps) {
  const href = `/books/${book.id}`

  if (variant === 'list') {
    return (
      <Link href={href} className="flex gap-4 p-4 rounded-2xl hover:bg-ivory transition-colors group">
        <div className="w-16 flex-shrink-0">
          <BookCover
            title={book.title}
            author={book.author}
            category={book.category?.name}
            color={book.category?.color}
            coverUrl={book.cover_url}
            size="sm"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-serif font-semibold text-brown-800 line-clamp-2 group-hover:text-brown-900 leading-snug">
            {book.title}
          </h3>
          {book.author && <p className="text-sm text-brown-500 mt-0.5">{book.author}</p>}
          <div className="flex items-center gap-3 mt-2 text-xs text-brown-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatReadingTime(book.reading_time_minutes)}
            </span>
            {book.rating > 0 && (
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                {book.rating.toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </Link>
    )
  }

  if (variant === 'horizontal') {
    return (
      <Link href={href} className="flex-shrink-0 w-36 group">
        <BookCover
          title={book.title}
          author={book.author}
          category={book.category?.name}
          color={book.category?.color}
          coverUrl={book.cover_url}
          size="sm"
          className="w-36"
        />
        <div className="mt-2.5 px-0.5">
          <h3 className="text-sm font-medium text-brown-800 line-clamp-2 group-hover:text-brown-900 leading-snug">
            {book.title}
          </h3>
          <div className="flex items-center gap-2 mt-1 text-xs text-brown-400">
            <Clock className="w-3 h-3" />
            {formatReadingTime(book.reading_time_minutes)}
          </div>
        </div>
      </Link>
    )
  }

  // Grid
  return (
    <Link href={href} className="group flex flex-col">
      <BookCover
        title={book.title}
        author={book.author}
        category={book.category?.name}
        color={book.category?.color}
        coverUrl={book.cover_url}
      />
      <div className="mt-3 flex-1 flex flex-col">
        <h3 className="text-sm font-semibold text-brown-800 line-clamp-2 group-hover:text-brown-900 leading-snug flex-1">
          {book.title}
        </h3>
        {book.author && (
          <p className="text-xs text-brown-500 mt-1">{book.author}</p>
        )}
        <div className="flex items-center gap-3 mt-2 text-xs text-brown-400">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatReadingTime(book.reading_time_minutes)}
          </span>
          {book.rating > 0 && (
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              {book.rating.toFixed(1)}
            </span>
          )}
          {book.is_free && <Badge variant="free" className="ml-auto">ฟรี</Badge>}
        </div>
      </div>
    </Link>
  )
}
