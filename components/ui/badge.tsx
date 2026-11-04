import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold leading-5 transition-colors',
  {
    variants: {
      variant: {
        /** Padrão — usa a cor primária suave */
        default: 'bg-primary-soft text-primary',
        /** Receita */
        income: 'bg-income-soft text-income',
        /** Despesa */
        expense: 'bg-expense-soft text-expense',
        /** Alerta / atenção */
        warning: 'bg-warning-soft text-warning',
        /** Neutro — fundo suave sem destaque */
        neutral: 'bg-surface-soft text-text-muted',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
