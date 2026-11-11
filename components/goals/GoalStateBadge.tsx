import { Badge } from '@/components/ui/badge';
import type { GoalState } from '@/types';

export const GOAL_STATE_CONFIG: Record<
  GoalState,
  { label: string; variant: 'default' | 'warning' | 'expense' | 'income' | 'neutral' }
> = {
  IN_PROGRESS: { label: 'Em andamento', variant: 'default' },
  WARNING: { label: 'Atenção', variant: 'warning' },
  EXCEEDED: { label: 'Excedida', variant: 'expense' },
  ACHIEVED: { label: 'Atingida', variant: 'income' },
  EXPIRED: { label: 'Expirada', variant: 'neutral' },
};

interface GoalStateBadgeProps {
  state: GoalState;
  className?: string;
}

export function GoalStateBadge({ state, className }: GoalStateBadgeProps) {
  const config = GOAL_STATE_CONFIG[state] || { label: state, variant: 'neutral' };
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}

