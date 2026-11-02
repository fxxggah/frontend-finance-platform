import { cn } from '@/lib/utils'
import type { HTMLAttributes } from 'react'

type CardProps = HTMLAttributes<HTMLDivElement> & { variant?: 'solid' | 'brand' | 'glass' }
export function Card({ className, variant = 'solid', ...props }: CardProps) {
  return <div className={cn('rounded-3xl border shadow-[0_8px_30px_-12px_rgba(20,23,46,0.18)]', variant === 'solid' && 'border-border bg-card', variant === 'brand' && 'border-transparent bg-[linear-gradient(135deg,#3B1FA8_0%,#5B3DF5_55%,#4F7BFF_100%)] text-white shadow-[0_16px_40px_-16px_rgba(91,61,245,0.55)]', variant === 'glass' && 'border-white/60 bg-white/85 backdrop-blur-xl', className)} {...props} />
}
