import { Badge } from '@/components/ui/badge';
import type { InvoiceStatus } from '@/types';

export const INVOICE_STATUS_CONFIG: Record<
  InvoiceStatus,
  { label: string; variant: 'neutral' | 'warning' | 'income' | 'expense' | 'default' }
> = {
  OPEN: { label: 'Aberta', variant: 'neutral' },
  CLOSED: { label: 'Fechada', variant: 'warning' },
  PARTIALLY_PAID: { label: 'Parcialmente paga', variant: 'default' },
  PAID: { label: 'Paga', variant: 'income' },
  OVERDUE: { label: 'Vencida', variant: 'expense' },
};

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
  className?: string;
}

export function InvoiceStatusBadge({ status, className }: InvoiceStatusBadgeProps) {
  const config = INVOICE_STATUS_CONFIG[status] || { label: status, variant: 'neutral' };
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}

