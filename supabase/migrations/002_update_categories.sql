-- Add is_admin column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Remove old categories that are no longer in the spec
DELETE FROM public.categories WHERE slug IN ('career', 'psychology', 'english', 'productivity');

-- Upsert the 10 canonical categories
INSERT INTO public.categories (name, slug, description, color, icon, order_index) VALUES
  ('การเงิน',            'finance',         'บริหารเงิน ออมเงิน ลงทุน สร้างความมั่นคงทางการเงิน',            'green',  'TrendingUp',  1),
  ('การสร้างรายได้',     'income',          'สร้างรายได้เสริม passive income และอิสรภาพทางการเงิน',          'amber',  'Banknote',    2),
  ('ธุรกิจ',             'business',        'เริ่มธุรกิจ บริหารองค์กร และขยายกิจการ',                        'blue',   'Briefcase',   3),
  ('การขายและการตลาด',   'sales-marketing', 'เทคนิคการขาย การตลาดดิจิทัล และสร้างแบรนด์',                   'orange', 'Megaphone',   4),
  ('การทำงาน',           'work',            'เพิ่มประสิทธิภาพ ทักษะอาชีพ และความก้าวหน้าในงาน',             'brown',  'Laptop',      5),
  ('สุขภาพ',             'health',          'ดูแลร่างกาย โภชนาการ การนอนหลับ และออกกำลังกาย',               'teal',   'Heart',       6),
  ('สุขภาพใจ',           'mental-health',   'จัดการอารมณ์ ลดความเครียด และสุขภาพจิตที่ดี',                  'indigo', 'Brain',       7),
  ('ความสัมพันธ์',       'relationship',    'ครอบครัว คู่รัก เพื่อน และการสื่อสารที่ดี',                     'pink',   'Users',       8),
  ('การพัฒนาตัวเอง',     'self-dev',        'เพิ่มทักษะ สร้างนิสัยดี และพัฒนาศักยภาพตัวเอง',               'purple', 'Star',        9),
  ('AI และเทคโนโลยี',    'technology',      'ความรู้ด้าน AI เทคโนโลยี และดิจิทัลที่ทันสมัย',                'gray',   'Cpu',         10)
ON CONFLICT (slug) DO UPDATE SET
  name        = EXCLUDED.name,
  description = EXCLUDED.description,
  color       = EXCLUDED.color,
  icon        = EXCLUDED.icon,
  order_index = EXCLUDED.order_index;
