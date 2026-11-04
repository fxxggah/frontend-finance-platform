import { cn } from '@/lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * Bloco de carregamento animado.
 * Mantém exatamente a forma do elemento que está sendo carregado.
 *
 * @example
 * // Linha de texto
 * <Skeleton className="h-4 w-48" />
 *
 * // Card completo
 * <Skeleton className="h-32 w-full rounded-2xl" />
 */
function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      aria-busy="true"
      aria-label="Carregando…"
      className={cn(
        'animate-pulse rounded-lg bg-surface-soft motion-reduce:animate-none',
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };

