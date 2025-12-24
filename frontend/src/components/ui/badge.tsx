import * as React from 'react'
import { cva } from 'class-variance-authority'
import type { VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide transition-colors',
  {
    variants: {
      variant: {
        default: 'border-white/15 bg-white/10 text-white',
        outline: 'border-white/30 text-white',
        success: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200',
        warning: 'border-amber-400/30 bg-amber-500/10 text-amber-100',
        danger: 'border-rose-500/40 bg-rose-600/10 text-rose-200',
        info: 'border-sky-400/30 bg-sky-500/10 text-sky-100',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
