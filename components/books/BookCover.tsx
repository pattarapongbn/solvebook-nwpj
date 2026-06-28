import Image from 'next/image'
import { cn } from '@/lib/utils'
import { getCategoryColor } from '@/lib/utils'

const COVER_COLORS: Record<string, { bg: string; text: string; accent: string }> = {
  amber:  { bg: '#3D2E1A', text: '#F5F0E8', accent: '#D4A054' },
  blue:   { bg: '#1A2E3D', text: '#EBF4FF', accent: '#6BADD4' },
  green:  { bg: '#1A3D2E', text: '#F0FFF4', accent: '#68D391' },
  red:    { bg: '#3D1A1A', text: '#FFF5F5', accent: '#FC8181' },
  pink:   { bg: '#3D1A2E', text: '#FFF5F7', accent: '#F687B3' },
  purple: { bg: '#2E1A3D', text: '#FAF5FF', accent: '#B794F4' },
  teal:   { bg: '#1A3D3D', text: '#E6FFFA', accent: '#4FD1C5' },
  orange: { bg: '#3D2E1A', text: '#FFFAF0', accent: '#ED8936' },
  indigo: { bg: '#1A1A3D', text: '#EBF4FF', accent: '#7F9CF5' },
  gray:   { bg: '#2C2416', text: '#FAF8F5', accent: '#CBD5E0' },
}

interface BookCoverProps {
  title: string
  author?: string | null
  category?: string
  color?: string
  coverUrl?: string | null
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function BookCover({
  title,
  author,
  category,
  color = 'gray',
  coverUrl,
  className,
  size = 'md',
}: BookCoverProps) {
  const palette = COVER_COLORS[color] ?? COVER_COLORS.gray

  const sizeClass = {
    sm: 'rounded-xl',
    md: 'rounded-2xl',
    lg: 'rounded-3xl',
  }[size]

  if (coverUrl) {
    return (
      <div className={cn('book-aspect relative overflow-hidden', sizeClass, 'shadow-warm', className)}>
        <Image
          src={coverUrl}
          alt={title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 40vw, 20vw"
        />
      </div>
    )
  }

  return (
    <div
      className={cn('book-aspect relative overflow-hidden flex flex-col justify-between p-4 shadow-warm', sizeClass, className)}
      style={{ backgroundColor: palette.bg }}
    >
      {/* Top accent line */}
      <div className="w-8 h-0.5 rounded-full opacity-60" style={{ backgroundColor: palette.accent }} />

      {/* Category tag */}
      {category && (
        <div className="text-[10px] font-medium uppercase tracking-widest" style={{ color: palette.accent, opacity: 0.75 }}>
          {category}
        </div>
      )}

      {/* Decorative lines */}
      <div className="flex-1 flex flex-col justify-center gap-1.5 my-2">
        <div className="h-px opacity-10" style={{ backgroundColor: palette.text }} />
        <div className="h-px opacity-10 w-3/4" style={{ backgroundColor: palette.text }} />
      </div>

      {/* Title */}
      <div>
        <h3
          className="font-serif font-semibold leading-snug text-balance mb-2"
          style={{
            color: palette.text,
            fontSize: size === 'sm' ? '0.8rem' : size === 'md' ? '0.92rem' : '1.05rem',
          }}
        >
          {title}
        </h3>
        {author && (
          <p className="text-[10px] opacity-50" style={{ color: palette.text }}>
            {author}
          </p>
        )}
        <p className="text-[9px] mt-1 opacity-35 font-medium tracking-wider" style={{ color: palette.text }}>
          SOLVEBOOK
        </p>
      </div>
    </div>
  )
}
