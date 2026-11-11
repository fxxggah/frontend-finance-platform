import { cn } from '@/lib/utils';

export type ProgressVariant = 'primary' | 'income' | 'warning' | 'expense';

export interface ProgressBarProps {
  /** Valor entre 0–100+ (suporta overflow > 100%) */
  value: number;
  variant?: ProgressVariant;
  /** Altura da barra */
  size?: 'sm' | 'md';
  /** Exibe o percentual no lado direito */
  showLabel?: boolean;
  className?: string;
  /** Label acessível para leitores de tela */
  'aria-label'?: string;
}

const fillClass: Record<ProgressVariant, string> = {
  primary: 'bg-primary',
  income: 'bg-income',
  warning: 'bg-warning',
  expense: 'bg-expense',
};

const sizeClass = {
  sm: 'h-2',
  md: 'h-3',
};

export function ProgressBar({
  value,
  variant = 'primary',
  size = 'md',
  showLabel = false,
  className,
  'aria-label': ariaLabel,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(value, 100));
  const isOver = value > 100;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        role="progressbar"
        aria-valuenow={Math.round(clamped)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={ariaLabel}
        className={cn(
          'relative flex-1 overflow-hidden rounded-full bg-surface-soft',
          sizeClass[size],
        )}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-200 motion-reduce:transition-none',
            isOver ? 'bg-expense' : fillClass[variant],
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>

      {showLabel && (
        <span
          className={cn(
            'shrink-0 text-xs font-medium tabular-nums',
            isOver ? 'text-expense' : 'text-text-muted',
          )}
        >
          {Math.round(value)}%
        </span>
      )}
    </div>
  );
}

