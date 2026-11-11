'use client';

import { TrendingUp, TrendingDown, PiggyBank, CreditCard } from 'lucide-react';
import { MetricCard } from '@/components/ui/metric-card';
import type { LucideIcon } from 'lucide-react';
import { formatMoney } from '@/lib/format/money';
import { Skeleton } from '@/components/ui/skeleton';
import type { DashboardSummary } from '@/types';

interface KpiCardsProps {
  summary: DashboardSummary;
  creditCardDebt: number;
  isLoading?: boolean;
}

function KpiCard({
  label,
  value,
  change,
  icon: Icon,
  tone,
  invertChange = false,
  description,
}: {
  label: string;
  value: number;
  change: number | null;
  icon: LucideIcon;
  tone: 'income' | 'expense' | 'warning' | 'blue';
  invertChange?: boolean;
  description: string;
}) {
  const isPositive = invertChange ? (change ?? 0) <= 0 : (change ?? 0) >= 0;

  return (
    <MetricCard label={label} icon={Icon} tone={tone === 'blue' ? 'accent' : tone}
      value={formatMoney(value, { showSign: tone === 'income' || tone === 'expense' })}
      description={description} comparison={change === null ? (
          <span className="text-xs text-text-muted" aria-label="Sem comparação">—</span>
        ) : (
          <span
            aria-label={`${change >= 0 ? 'Aumento' : 'Redução'} de ${Math.abs(change).toLocaleString('pt-BR')}% em relação ao período anterior`}
            className={`flex items-center gap-0.5 tabular-nums text-xs font-semibold ${
              isPositive ? 'text-income' : 'text-expense'
            }`}
          >
            {change >= 0 ? '+' : '−'}
            {Math.abs(change).toLocaleString('pt-BR')}%
          </span>
        )} />
  );
}

export function KpiCards({ summary, creditCardDebt, isLoading }: KpiCardsProps) {
  if (isLoading) {
    return (
      <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:mt-9 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:mt-9 lg:grid-cols-4">
      <KpiCard
        label="Receitas do período"
        value={summary.totalIncome}
        change={summary.previous.incomeChangePct}
        icon={TrendingUp}
        tone="income"
        description="Entradas nas suas contas"
      />
      <KpiCard
        label="Despesas do período"
        value={-Math.abs(summary.totalExpense)}
        change={summary.previous.expenseChangePct}
        icon={TrendingDown}
        tone="expense"
        description="Saídas nas suas contas"
        invertChange
      />
      <KpiCard
        label="Saldo do período"
        value={summary.balance}
        change={null}
        icon={PiggyBank}
        tone="blue"
        description="Resultado desta janela de análise"
      />
      <KpiCard
        label="Faturas em aberto"
        value={creditCardDebt}
        change={null}
        icon={CreditCard}
        tone="warning"
        description="Comprometido nos cartões"
      />
    </div>
  );
}
