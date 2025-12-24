import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva } from 'class-variance-authority'
import type { VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60',
  {
    variants: {
      variant: {
        default:
          'bg-gradient-to-r from-rose-500 via-fuchsia-500 to-indigo-500 text-white shadow-lg shadow-rose-500/30 hover:from-rose-400 hover:via-fuchsia-400 hover:to-indigo-400',
        secondary:
          'bg-white/10 text-white hover:bg-white/20 border border-white/10 shadow-inner shadow-black/40',
        outline:
          'border border-white/20 bg-transparent text-white hover:bg-white/10',
        ghost: 'text-white hover:bg-white/10',
        destructive:
          'bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-500',
      },
      size: {
        default: 'h-10 min-w-28',
        sm: 'h-9 px-3 text-xs',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10 rounded-full p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
