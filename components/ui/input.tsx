import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        'flex h-10 w-full rounded-2xl border border-brown-200 bg-white px-4 py-2',
        'text-brown-800 placeholder:text-brown-400',
        'text-sm font-sans',
        'focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-0 focus:border-transparent',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'transition-shadow',
        className
      )}
      {...props}
    />
  )
)
Input.displayName = 'Input'

export { Input }
