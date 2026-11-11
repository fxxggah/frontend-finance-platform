'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CategoryIcon } from '@/components/icons/CategoryIcon';
import { formatMoney } from '@/lib/format/money';
import { formatDate } from '@/lib/format/date';
import type { Goal } from '@/types';

const STATE_LABEL: Record<string, string> = {
  IN_PROGRESS: 'Em andamento',
  WARNING: 'Atenção',
  EXCEEDED: 'Estourada',
  ACHIEVED: 'Concluída',
  EXPIRED: 'Expirada',
};

const STATE_COLOR: Record<string, string> = {
  IN_PROGRESS: 'var(--color-primary)',
  WARNING: 'var(--color-warning)',
  EXCEEDED: 'var(--color-expense)',
  ACHIEVED: 'var(--color-income)',
  EXPIRED: 'var(--color-text-muted)',
};

function GoalCard({ goal }: { goal: Goal }) {
  const tone = STATE_COLOR[goal.state] ?? 'var(--color-text-muted)';
  return (
    <Card className="min-w-[260px] snap-start lg:min-w-0 p-5">
      <div className="flex items-start justify-between">
        <CategoryIcon name={goal.icon} className="size-5" />
        <Badge style={{ color: tone, backgroundColor: 'var(--color-surface-soft)' }}>
          {STATE_LABEL[goal.state] ?? goal.state}
        </Badge>
      </div>
      <h3 className="mt-4 font-bold text-text">{goal.name}</h3>
      <p className="mt-1 tabular-nums text-sm text-text-muted">
        {formatMoney(goal.currentAmount)}{' '}
        <span className="text-xs">
          / {goal.type === 'EXPENSE' ? 'limite' : 'alvo'} {formatMoney(goal.targetAmount)}
        </span>
      </p>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-soft">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(goal.percentage, 100)}%`, backgroundColor: tone }}
        />
      </div>
      <div className="mt-2 flex justify-between text-xs font-bold">
        <span style={{ color: tone }}>
          {goal.percentage.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%
        </span>
        <span className="text-text-muted">
          {goal.endDate ? `Até ${formatDate(goal.endDate)}` : 'Sem prazo'}
        </span>
      </div>
      {goal.supportText && (
        <p className="mt-3 text-xs text-text-muted">{goal.supportText}</p>
      )}
    </Card>
  );
}

interface GoalsSectionProps {
  goals: Goal[];
  isLoading?: boolean;
}

export function GoalsSection({ goals, isLoading }: GoalsSectionProps) {
  return (
    <section className="mt-9">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-text">Metas em andamento</h2>
        <Link
          href="/goals"
          className="text-sm font-bold text-primary hover:underline"
          aria-label="Ver todas as metas"
        >
          Ver todas
        </Link>
      </div>

      {isLoading ? (
        <div className="flex gap-4 overflow-x-auto pb-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-52 min-w-[280px] rounded-2xl" />
          ))}
        </div>
      ) : goals.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-text-muted text-sm">Nenhuma meta ativa no momento.</p>
          <Link
            href="/goals"
            className="mt-3 inline-block text-sm font-bold text-primary hover:underline"
          >
            Criar primeira meta
          </Link>
        </Card>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory lg:grid lg:grid-cols-3 lg:overflow-visible">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      )}
    </section>
  );
}
