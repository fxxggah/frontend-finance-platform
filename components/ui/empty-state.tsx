import { type LucideIcon, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button, type ButtonProps } from '@/components/ui/button';

export interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  href?: string;
  variant?: ButtonProps['variant'];
}

export interface EmptyStateProps {
  /** Ícone Lucide a exibir (padrão: Inbox) */
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

/**
 * Estado vazio padronizado para listas e seções sem dados.
 */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  const effectiveAction: EmptyStateAction | undefined =
    action ?? (actionLabel ? { label: actionLabel, onClick: onAction } : undefined);
  return (
    <div
      role="status"
      aria-label={title}
      className={cn(
        'flex flex-col items-center justify-center gap-4 rounded-3xl border border-border bg-surface py-12 px-5 text-center',
        className,
      )}
    >
      {/* Círculo de ícone */}
      <span
        aria-hidden="true"
        className="flex size-16 items-center justify-center rounded-full bg-surface-soft text-text-muted"
      >
        <Icon size={28} strokeWidth={1.5} />
      </span>

      <div className="flex flex-col gap-1">
        <p className="text-base font-semibold tracking-tight text-text">{title}</p>
        {description && (
          <p className="text-sm text-text-muted max-w-xs">{description}</p>
        )}
      </div>

      {effectiveAction && (
        <Button
          variant={effectiveAction.variant ?? 'primary'}
          size="md"
          onClick={effectiveAction.onClick}
          {...(effectiveAction.href ? { as: 'a', href: effectiveAction.href } : {})}
        >
          {effectiveAction.label}
        </Button>
      )}
    </div>
  );
}

