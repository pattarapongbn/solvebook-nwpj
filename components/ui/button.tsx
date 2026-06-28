import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:  'bg-orange-500 text-white hover:bg-orange-600 active:bg-orange-700',
        dark:     'bg-brown-800 text-cream hover:bg-brown-700 active:bg-brown-900',
        outline:  'border border-brown-200 bg-transparent text-brown-700 hover:bg-ivory hover:border-brown-300',
        ghost:    'text-brown-700 hover:bg-ivory hover:text-brown-800',
        muted:    'bg-brown-100 text-brown-700 hover:bg-brown-200',
        danger:   'bg-red-600 text-white hover:bg-red-700',
      },
      size: {
        sm:   'h-8  px-3 text-sm rounded-xl',
        md:   'h-10 px-4 text-sm rounded-2xl',
        lg:   'h-12 px-6 text-base rounded-2xl',
        xl:   'h-14 px-8 text-base rounded-3xl',
        icon: 'h-10 w-10 rounded-2xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
