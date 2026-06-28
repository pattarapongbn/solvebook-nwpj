import { BookCard } from './BookCard'
import type { Book } from '@/lib/types'

interface HorizontalScrollProps {
  books: Book[]
}

export function HorizontalScroll({ books }: HorizontalScrollProps) {
  if (!books.length) return null

  return (
    <div className="scroll-row">
      {books.map(book => (
        <BookCard key={book.id} book={book} variant="horizontal" />
      ))}
    </div>
  )
}
