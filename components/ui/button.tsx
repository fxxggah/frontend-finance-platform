'use client';

import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  [
    // base
    'inline-flex items-center justify-center gap-2 font-medium',
    'rounded-2xl transition-colors duration-200 select-none whitespace-nowrap',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'motion-reduce:transition-none',
    '[&_svg]:pointer-events-none [&_svg]:shrink-0',
  ].join(' '),
  {
    variants: {
      variant: {
        /** Gradiente violeta/azul — ação principal */
        primary: [
          'bg-primary text-white shadow-sm',
          'hover:opacity-90 active:scale-[0.98]',
        ].join(' '),
        /** Alias para brand */
        brand: [
          'bg-primary text-white shadow-sm',
          'hover:opacity-90 active:scale-[0.98]',
        ].join(' '),
        /** Superfície suave + borda — ação secundária */
        secondary: [
          'bg-surface-soft text-text border border-border',
          'hover:bg-border active:scale-[0.98]',
        ].join(' '),
        /** Contorno apenas */
        outline: [
          'border border-border bg-transparent text-text',
          'hover:bg-surface-soft active:scale-[0.98]',
        ].join(' '),
        /** Sem fundo — ação terciária */
        ghost: [
          'bg-transparent text-text',
          'hover:bg-surface-soft active:scale-[0.98]',
        ].join(' '),
        /** Ação destrutiva (excluir, etc.) */
        danger: [
          'bg-expense-soft text-expense border border-expense/20',
          'hover:bg-expense/10 active:scale-[0.98]',
        ].join(' '),
      },
      size: {
        sm: 'h-11 px-3 text-sm [&_svg:not([class*="size-"])]:size-4',
        md: 'h-11 px-4 text-sm [&_svg:not([class*="size-"])]:size-4',
        lg: 'h-13 px-6 text-base [&_svg:not([class*="size-"])]:size-5',
        icon: 'size-11 p-0 [&_svg:not([class*="size-"])]:size-5',
        'icon-sm': 'size-11 p-0 [&_svg:not([class*="size-"])]:size-4',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Exibe spinner e desabilita o botão enquanto `true`. */
  isLoading?: boolean;
  /** Texto alternativo do spinner (acessibilidade). */
  loadingText?: string;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      isLoading = false,
      loadingText,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled || isLoading}
        aria-disabled={disabled || isLoading}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading && (
          <Loader2
            className="animate-spin"
            size={size === 'lg' ? 20 : 16}
            aria-hidden="true"
          />
        )}
        {isLoading && loadingText ? loadingText : children}
      </button>
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
