'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ProgressBar, type ProgressVariant } from '@/components/ui/progress-bar';
import { CategoryIcon } from '@/components/icons/CategoryIcon';
import { GoalStateBadge } from '@/components/goals/GoalStateBadge';
import { formatMoney } from '@/lib/format/money';
import type { Goal, GoalState, GoalType } from '@/types';

export const GOAL_TYPE_LABELS: Record<GoalType, string> = {
  SAVINGS: 'Economia',
  INCOME: 'Ganho',
  EXPENSE: 'Teto de Gasto',
};

const STATE_TO_PROGRESS_VARIANT: Record<GoalState, ProgressVariant> = {
  IN_PROGRESS: 'primary',
  WARNING: 'warning',
  EXCEEDED: 'expense',
  ACHIEVED: 'income',
  EXPIRED: 'warning',
};

interface GoalCardProps {
  goal: Goal;
}

export function GoalCard({ goal }: GoalCardProps) {
  const isExpense = goal.type === 'EXPENSE';
  const progressVariant = STATE_TO_PROGRESS_VARIANT[goal.state] || 'primary';

  // Texto de apoio padrão caso a API não tenha fornecido supportText
  const support =
    goal.supportText ||
    (goal.monthlyNeeded
      ? `Guardar ${formatMoney(goal.monthlyNeeded)} por mês para chegar a tempo`
      : isExpense
      ? `Restam ${formatMoney(Math.max(0, goal.targetAmount - goal.currentAmount))} do limite`
      : `${Math.round(goal.percentage)}% concluído`);

  return (
    <Link href={`/goals/${goal.id}`} className="block">
      <Card className="p-5 sm:p-6 transition-all hover:border-primary/40 hover:shadow-md flex flex-col justify-between space-y-4">
        {/* Topo: Ícone, Nome, Tipo e Badge de Estado */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className="flex size-12 shrink-0 items-center justify-center rounded-2xl shadow-sm"
              style={{
                backgroundColor: `${goal.color || '#5B3DF5'}15`,
                color: goal.color || '#5B3DF5',
              }}
            >
              <CategoryIcon name={goal.icon || 'target'} size={24} />
            </div>

            <div className="min-w-0">
              <h3 className="truncate font-semibold text-text text-base" title={goal.name}>
                {goal.name}
              </h3>
              <p className="text-xs text-text-muted">
                {GOAL_TYPE_LABELS[goal.type] || goal.type}
                {goal.category && ` · ${goal.category.name}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <GoalStateBadge state={goal.state} />
            <ChevronRight size={18} className="text-text-muted" />
          </div>
        </div>

        {/* Progresso: Barra e Valores */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-text-muted">
              {isExpense ? 'Gasto no período' : 'Acumulado'}
            </span>
            <span className="font-bold tabular-nums text-text">
              {formatMoney(goal.currentAmount)}
              <span className="font-normal text-text-muted">
                {' '}
                / {isExpense ? 'limite de ' : ''}
                {formatMoney(goal.targetAmount)}
              </span>
            </span>
          </div>

          <ProgressBar
            value={goal.percentage}
            variant={progressVariant}
            aria-label={`Progresso da meta ${goal.name}`}
          />

          <div className="flex items-center justify-between text-xs">
            <span className="text-text-muted truncate max-w-[70%]">{support}</span>
            <span className="font-bold tabular-nums text-text shrink-0">
              {Math.round(goal.percentage)}%
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}

