import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ReaderClient } from '@/components/reader/ReaderClient'
import type { Metadata } from 'next'
import type { BookChapter } from '@/lib/types'

interface Props {
  params: Promise<{ bookId: string; chapterId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { chapterId } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('book_chapters')
    .select('title')
    .eq('id', chapterId)
    .single()
  const ch = data as unknown as { title: string } | null
  return { title: ch?.title ?? 'กำลังอ่าน' }
}

async function getData(bookId: string, chapterId: string) {
  const supabase = await createClient()

  const [bookRes, chaptersRes] = await Promise.all([
    supabase
      .from('books')
      .select('id, title, author, category:categories(name, color)')
      .eq('id', bookId)
      .single(),
    supabase
      .from('book_chapters')
      .select('*')
      .eq('book_id', bookId)
      .order('order_index'),
  ])

  if (bookRes.error || !bookRes.data) return null

  // Normalize Supabase join result (may be array without Database generic)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = bookRes.data as any
  const cat = Array.isArray(raw.category) ? raw.category[0] ?? null : raw.category ?? null

  const book = {
    id: raw.id as string,
    title: raw.title as string,
    author: (raw.author ?? null) as string | null,
    category: cat as { name: string; color: string } | null,
  }

  const chapters = (chaptersRes.data ?? []) as BookChapter[]
  const currentChapter = chapters.find(c => c.id === chapterId)
  if (!currentChapter) return null

  return { book, chapters, currentChapter }
}

export default async function ReaderPage({ params }: Props) {
  const { bookId, chapterId } = await params
  const data = await getData(bookId, chapterId)
  if (!data) notFound()

  return <ReaderClient {...data} />
}
