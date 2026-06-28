import type { Config } from 'tailwindcss'
import typography from '@tailwindcss/typography'

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx,mdx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        cream: '#FAFAF7',
        ivory: '#F5F0E8',
        paper: '#EDE8DE',
        parchment: '#E5DDD0',
        brown: {
          50:  '#FAF8F5',
          100: '#F0EBE3',
          200: '#DDD5C8',
          300: '#C4BAA8',
          400: '#9A9080',
          500: '#7A7060',
          600: '#5C5346',
          700: '#3C3422',
          800: '#2C2416',
          900: '#1C1509',
        },
        orange: {
          50:  '#FDF5EF',
          100: '#F9E5D3',
          200: '#F2C9A3',
          300: '#E8A870',
          400: '#DA8445',
          500: '#C8622A',
          600: '#A84E20',
          700: '#883D19',
          800: '#6A2E13',
          900: '#4D200D',
        },
      },
      fontFamily: {
        serif: ['var(--font-playfair)', 'Georgia', 'Times New Roman', 'serif'],
        sans:  ['var(--font-body)', 'system-ui', 'sans-serif'],
        mono:  ['ui-monospace', 'monospace'],
      },
      fontSize: {
        'display-lg': ['3.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display':    ['2.75rem', { lineHeight: '1.15', letterSpacing: '-0.015em' }],
        'display-sm': ['2.25rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        'heading-xl': ['1.875rem', { lineHeight: '1.25' }],
        'heading-lg': ['1.5rem', { lineHeight: '1.35' }],
        'heading':    ['1.25rem', { lineHeight: '1.4' }],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '88': '22rem',
        '96': '24rem',
        '128': '32rem',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'warm-sm': '0 1px 3px rgba(44,36,22,0.06), 0 1px 2px rgba(44,36,22,0.04)',
        'warm':    '0 4px 12px rgba(44,36,22,0.08), 0 2px 4px rgba(44,36,22,0.04)',
        'warm-md': '0 8px 24px rgba(44,36,22,0.10), 0 4px 8px rgba(44,36,22,0.04)',
        'warm-lg': '0 16px 48px rgba(44,36,22,0.12), 0 8px 16px rgba(44,36,22,0.06)',
      },
      typography: () => ({
        reader: {
          css: {
            '--tw-prose-body':         '#2C2416',
            '--tw-prose-headings':     '#1C1509',
            '--tw-prose-lead':         '#5C5346',
            '--tw-prose-links':        '#C8622A',
            '--tw-prose-bold':         '#2C2416',
            '--tw-prose-counters':     '#7A7060',
            '--tw-prose-bullets':      '#7A7060',
            '--tw-prose-hr':           '#E0D8CC',
            '--tw-prose-quotes':       '#2C2416',
            '--tw-prose-quote-borders':'#E0D8CC',
            '--tw-prose-captions':     '#7A7060',
            '--tw-prose-code':         '#2C2416',
            '--tw-prose-pre-code':     '#F5F0E8',
            '--tw-prose-pre-bg':       '#2C2416',
            '--tw-prose-th-borders':   '#E0D8CC',
            '--tw-prose-td-borders':   '#E0D8CC',
            lineHeight: '1.95',
            fontSize: '1.125rem',
            p: { marginTop: '1.5em', marginBottom: '1.5em' },
          },
        },
        'reader-dark': {
          css: {
            '--tw-prose-body':         '#E5DDD0',
            '--tw-prose-headings':     '#FAF8F5',
            '--tw-prose-lead':         '#C4BAA8',
            '--tw-prose-links':        '#DA8445',
            '--tw-prose-bold':         '#F0EBE3',
            '--tw-prose-hr':           '#3C3422',
            '--tw-prose-quotes':       '#E5DDD0',
            '--tw-prose-quote-borders':'#3C3422',
          },
        },
      }),
    },
  },
  plugins: [typography],
}

export default config
