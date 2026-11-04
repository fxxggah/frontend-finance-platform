import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// ─── Container ───────────────────────────────────────────────────────────────

const cardVariants = cva('transition-shadow duration-200', {
  variants: {
    variant: {
      /** Cartão padrão com fundo sólido e borda sutil */
      solid: 'bg-surface border border-border rounded-2xl shadow-[var(--shadow-default)]',
      /** Cartão hero com gradiente de marca */
      brand: [
        'rounded-3xl text-white border-transparent',
        'bg-[linear-gradient(135deg,#3B1FA8_0%,#5B3DF5_55%,#4F7BFF_100%)]',
        'shadow-[0_16px_40px_-16px_rgba(91,61,245,0.55)]',
        // overlay translúcido para textura
        'relative overflow-hidden',
        'before:pointer-events-none before:absolute before:inset-0',
        'before:bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.12)_0%,transparent_60%)]',
      ].join(' '),
      /**
       * Glassmorphism — exclusivo para pílula de atalhos e BottomNav mobile.
       * NÃO usar em outros contextos (ver design-system.md §4).
       */
      glass: [
        'rounded-2xl border border-white/60',
        'bg-white/85 dark:bg-white/10 backdrop-blur-md',
        'shadow-[0_4px_24px_-8px_rgba(20,23,46,0.12)]',
      ].join(' '),
    },
    padding: {
      none: '',
      sm: 'p-4',
      md: 'p-5',
      lg: 'p-6',
    },
  },
  defaultVariants: {
    variant: 'solid',
    padding: 'none',
  },
});

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, padding, className }))}
      {...props}
    />
  ),
);
Card.displayName = 'Card';

// ─── Sub-components ───────────────────────────────────────────────────────────

const CardHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col gap-1 px-5 pt-5', className)}
      {...props}
    />
  ),
);
CardHeader.displayName = 'CardHeader';

const CardTitle = forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-base font-semibold leading-tight text-text', className)}
      {...props}
    />
  ),
);
CardTitle.displayName = 'CardTitle';

const CardDescription = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-text-muted', className)}
      {...props}
    />
  ),
);
CardDescription.displayName = 'CardDescription';

const CardContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('px-5 pb-2 pt-3', className)} {...props} />
  ),
);
CardContent.displayName = 'CardContent';

const CardFooter = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center px-5 pb-5 pt-2', className)}
      {...props}
    />
  ),
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, cardVariants };
