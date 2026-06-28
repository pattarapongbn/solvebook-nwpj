export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id'>>
      }
      categories: {
        Row: Category
        Insert: Omit<Category, 'id' | 'created_at'>
        Update: Partial<Omit<Category, 'id' | 'created_at'>>
      }
      books: {
        Row: Book
        Insert: Omit<Book, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Book, 'id' | 'created_at'>>
      }
      book_chapters: {
        Row: BookChapter
        Insert: Omit<BookChapter, 'id' | 'created_at'>
        Update: Partial<Omit<BookChapter, 'id' | 'created_at'>>
      }
      bookmarks: {
        Row: Bookmark
        Insert: Omit<Bookmark, 'id' | 'created_at'>
        Update: Partial<Omit<Bookmark, 'id' | 'created_at'>>
      }
      reading_progress: {
        Row: ReadingProgress
        Insert: Omit<ReadingProgress, 'id' | 'created_at'>
        Update: Partial<Omit<ReadingProgress, 'id' | 'created_at'>>
      }
      favorites: {
        Row: Favorite
        Insert: Omit<Favorite, 'id' | 'created_at'>
        Update: Partial<Omit<Favorite, 'id' | 'created_at'>>
      }
      subscriptions: {
        Row: Subscription
        Insert: Omit<Subscription, 'id' | 'created_at'>
        Update: Partial<Omit<Subscription, 'id' | 'created_at'>>
      }
    }
  }
}

export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  is_admin: boolean
  reading_streak: number
  books_finished: number
  minutes_read: number
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  cover_url: string | null
  color: string
  icon: string
  order_index: number
  book_count?: number
  created_at: string
}

export interface Book {
  id: string
  title: string
  slug: string
  author: string | null
  description: string | null
  cover_url: string | null
  category_id: string | null
  reading_time_minutes: number
  is_published: boolean
  is_free: boolean
  price_thb: number
  view_count: number
  rating: number
  rating_count: number
  created_at: string
  updated_at: string
  category?: Category
  chapter_count?: number
}

export interface BookChapter {
  id: string
  book_id: string
  title: string
  content: string | null
  order_index: number
  reading_time_minutes: number
  is_free: boolean
  created_at: string
}

export interface Bookmark {
  id: string
  user_id: string
  book_id: string
  chapter_id: string | null
  note: string | null
  created_at: string
  book?: Book
}

export interface ReadingProgress {
  id: string
  user_id: string
  book_id: string
  chapter_id: string | null
  progress_percent: number
  is_completed: boolean
  last_read_at: string
  created_at: string
  book?: Book
}

export interface Favorite {
  id: string
  user_id: string
  book_id: string
  created_at: string
  book?: Book
}

export interface Subscription {
  id: string
  user_id: string
  plan: 'free' | 'premium'
  started_at: string
  expires_at: string | null
  created_at: string
}

export interface AdminLog {
  id: string
  admin_id: string
  action: string
  resource_type: string | null
  resource_id: string | null
  details: Json | null
  created_at: string
}

export interface Wallet {
  user_id: string
  balance: number
  updated_at: string
}

export interface CoinPackage {
  code: string
  label: string
  coins: number
  amount_thb: number
  is_welcome: boolean
  active: boolean
  sort_order: number
}

export interface TopupRequest {
  id: string
  user_id: string
  coins: number
  amount_thb: number
  slip_url: string | null
  status: 'pending' | 'approved' | 'rejected'
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
}

export interface CoinTransaction {
  id: string
  user_id: string
  amount: number
  kind: 'topup' | 'unlock' | 'refund' | 'admin_adjust'
  ref_id: string | null
  note: string | null
  created_at: string
}

export interface Unlock {
  id: string
  user_id: string
  book_id: string
  coins_paid: number
  created_at: string
  book?: Book
}

export type ReaderFontSize = 'sm' | 'md' | 'lg' | 'xl'
export type ReaderTheme = 'light' | 'sepia' | 'dark'

export interface ReaderSettings {
  fontSize: ReaderFontSize
  theme: ReaderTheme
  lineHeight: 'normal' | 'relaxed' | 'loose'
}
