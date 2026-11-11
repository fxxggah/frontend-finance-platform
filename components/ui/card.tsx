import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import styles from './surfaces.module.css';

// ─── Container ───────────────────────────────────────────────────────────────

const cardVariants = cva('min-w-0 transition-shadow duration-200', {
  variants: {
    variant: {
      /** Cartão padrão com fundo sólido e borda sutil */
      solid: 'bg-surface border border-border rounded-3xl',
      panel: `${styles.glass} rounded-3xl`,
      metric: `${styles.metric} rounded-2xl`,
      chart: 'min-w-0 rounded-3xl border border-border bg-surface p-5 sm:p-6',
      /** Cartão hero com gradiente de marca */
      brand: [
        'rounded-3xl text-white',
        'bg-gradient-hero',
        // overlay translúcido para textura
        'relative overflow-hidden',
        styles.hero,
        'before:pointer-events-none before:absolute before:inset-0',
        'before:bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.12)_0%,transparent_60%)]',
      ].join(' '),
      /** Vidro restrito a barras compactas de ações. */
      glass: [
        styles.glass, styles.dock,
        'fin-glass rounded-3xl sm:backdrop-blur-md',
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
  ({ className, variant, padding, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, padding, className }))}
      {...props}
    >
      {variant === 'brand' && <div className={styles.orbit} aria-hidden="true" />}
      {children}
    </div>
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
