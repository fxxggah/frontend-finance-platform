import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Card } from './card';
import { cn } from '@/lib/utils';

const tones = {
  income: 'bg-income-soft text-income', expense: 'bg-expense-soft text-expense',
  primary: 'bg-primary-soft text-primary', accent: 'bg-primary-soft text-accent',
  warning: 'bg-warning-soft text-warning',
};

export interface MetricCardProps {
  label: string;
  value: ReactNode;
  description?: string;
  icon: LucideIcon;
  tone?: keyof typeof tones;
  comparison?: ReactNode;
  className?: string;
}

export function MetricCard({ label, value, description, icon: Icon, tone = 'primary', comparison, className }: MetricCardProps) {
  return <Card variant="metric" className={cn('p-4 sm:p-5', className)}>
    <div className="flex items-start justify-between gap-2">
      <span className={cn('grid size-8 shrink-0 place-items-center rounded-xl', tones[tone])}><Icon className="size-4" aria-hidden="true" /></span>
      {comparison}
    </div>
    <p className="mt-4 text-xs font-medium text-text-muted">{label}</p>
    <p className="mt-2 break-words tabular-nums text-lg font-semibold tracking-tight text-text sm:text-2xl">{value}</p>
    {description && <p className="mt-2 text-[11px] leading-relaxed text-text-muted">{description}</p>}
  </Card>;
}
