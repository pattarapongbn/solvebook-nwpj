-- ============================================================
-- SolveBook — Initial Schema
-- Apply via: Supabase Dashboard > SQL Editor
-- ============================================================

-- Enable uuid extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── PROFILES ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id              UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name       TEXT,
  avatar_url      TEXT,
  bio             TEXT,
  reading_streak  INTEGER DEFAULT 0,
  books_finished  INTEGER DEFAULT 0,
  minutes_read    INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_read_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Auto-create profile on sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ── CATEGORIES ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.categories (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  description TEXT,
  cover_url   TEXT,
  color       TEXT DEFAULT 'gray',
  icon        TEXT DEFAULT '📚',
  order_index INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_public_read" ON public.categories FOR SELECT USING (true);

-- ── BOOKS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.books (
  id                     UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title                  TEXT NOT NULL,
  slug                   TEXT UNIQUE NOT NULL,
  author                 TEXT,
  description            TEXT,
  cover_url              TEXT,
  category_id            UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  reading_time_minutes   INTEGER DEFAULT 5,
  is_published           BOOLEAN DEFAULT FALSE,
  is_free                BOOLEAN DEFAULT TRUE,
  view_count             INTEGER DEFAULT 0,
  rating                 DECIMAL(3,2) DEFAULT 0,
  rating_count           INTEGER DEFAULT 0,
  created_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at             TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
CREATE POLICY "books_public_read" ON public.books
  FOR SELECT USING (is_published = true);

-- ── BOOK CHAPTERS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.book_chapters (
  id                   UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id              UUID REFERENCES public.books(id) ON DELETE CASCADE NOT NULL,
  title                TEXT NOT NULL,
  content              TEXT,
  order_index          INTEGER NOT NULL DEFAULT 0,
  reading_time_minutes INTEGER DEFAULT 2,
  is_free              BOOLEAN DEFAULT TRUE,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.book_chapters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chapters_public_read" ON public.book_chapters
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.books b
      WHERE b.id = book_id AND b.is_published = true
    )
  );

-- ── BOOKMARKS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  book_id    UUID REFERENCES public.books(id) ON DELETE CASCADE NOT NULL,
  chapter_id UUID REFERENCES public.book_chapters(id) ON DELETE SET NULL,
  note       TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, book_id, chapter_id)
);

ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bookmarks_own" ON public.bookmarks USING (auth.uid() = user_id);

-- ── READING PROGRESS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reading_progress (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  book_id          UUID REFERENCES public.books(id) ON DELETE CASCADE NOT NULL,
  chapter_id       UUID REFERENCES public.book_chapters(id) ON DELETE SET NULL,
  progress_percent INTEGER DEFAULT 0,
  is_completed     BOOLEAN DEFAULT FALSE,
  last_read_at     TIMESTAMPTZ DEFAULT NOW(),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, book_id)
);

ALTER TABLE public.reading_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "progress_own" ON public.reading_progress USING (auth.uid() = user_id);

-- ── FAVORITES ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.favorites (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  book_id    UUID REFERENCES public.books(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, book_id)
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "favorites_own" ON public.favorites USING (auth.uid() = user_id);

-- ── SUBSCRIPTIONS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  plan       TEXT DEFAULT 'free',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subscriptions_own" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- ── ADMIN LOGS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id      UUID REFERENCES auth.users(id),
  action        TEXT NOT NULL,
  resource_type TEXT,
  resource_id   UUID,
  details       JSONB,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── HELPER FUNCTION ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.increment_view(book_id UUID)
RETURNS void AS $$
  UPDATE public.books SET view_count = view_count + 1 WHERE id = book_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- ── INDEXES ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_books_category ON public.books(category_id);
CREATE INDEX IF NOT EXISTS idx_books_published ON public.books(is_published);
CREATE INDEX IF NOT EXISTS idx_books_view_count ON public.books(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_chapters_book ON public.book_chapters(book_id, order_index);
CREATE INDEX IF NOT EXISTS idx_progress_user ON public.reading_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON public.favorites(user_id);

-- ── SEED DATA — CATEGORIES ───────────────────────────────────
INSERT INTO public.categories (name, slug, description, color, icon, order_index) VALUES
  ('การเงิน',         'finance',        'บริหารเงิน ออมเงิน ลงทุน และสร้างความมั่นคงทางการเงิน',   'amber',  '💰', 1),
  ('ธุรกิจ',          'business',       'เริ่มธุรกิจ การตลาด บริหารองค์กร และเพิ่มรายได้',          'blue',   '💼', 2),
  ('การพัฒนาตนเอง',   'self-dev',       'เพิ่มทักษะ สร้างนิสัยดี และพัฒนาศักยภาพตัวเอง',          'green',  '🌱', 3),
  ('สุขภาพ',          'health',         'ดูแลร่างกาย นอนหลับ โภชนาการ และออกกำลังกาย',             'red',    '❤️', 4),
  ('ความรัก',         'relationship',   'ความสัมพันธ์ การสื่อสาร และการสร้างความรักที่ยั่งยืน',    'pink',   '💕', 5),
  ('การทำงาน',        'career',         'เพิ่มประสิทธิภาพ ทักษะอาชีพ และความก้าวหน้าในงาน',       'purple', '🏆', 6),
  ('จิตวิทยา',        'psychology',     'เข้าใจตัวเอง จัดการอารมณ์ และสุขภาพจิตที่ดี',            'teal',   '🧠', 7),
  ('ภาษาอังกฤษ',      'english',        'เรียนรู้ภาษาอังกฤษในชีวิตประจำวัน',                       'indigo', '🇬🇧', 8),
  ('ผลิตภาพ',         'productivity',   'จัดการเวลา กำหนดเป้าหมาย และทำงานได้มากขึ้น',            'orange', '⚡', 9),
  ('เทคโนโลยี',       'technology',     'ความรู้ด้านเทคโนโลยีและดิจิทัลที่ทันสมัย',               'gray',   '💻', 10)
ON CONFLICT (slug) DO NOTHING;
