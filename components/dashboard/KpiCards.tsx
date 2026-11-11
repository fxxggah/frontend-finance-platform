'use client';

import { TrendingUp, TrendingDown, PiggyBank, CreditCard } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { formatMoney } from '@/lib/format/money';
import { Skeleton } from '@/components/ui/skeleton';
import type { DashboardSummary } from '@/types';

interface KpiCardsProps {
  summary: DashboardSummary;
  creditCardDebt: number;
  isLoading?: boolean;
}

function Sparkline({ tone }: { tone: string }) {
  const color =
    tone === 'income'
      ? 'var(--color-income)'
      : tone === 'warning'
      ? 'var(--color-warning)'
      : tone === 'blue'
      ? 'var(--color-accent)'
      : 'var(--color-primary)';

  return (
    <svg aria-hidden="true" className="h-10 w-full" viewBox="0 0 120 36" preserveAspectRatio="none">
      <path
        d="M2 29 C 18 24, 20 31, 34 22 S 52 24, 62 15 S 78 21, 90 11 S 108 14, 118 4"
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function KpiCard({
  label,
  value,
  change,
  icon: Icon,
  tone,
  invertChange = false,
}: {
  label: string;
  value: number;
  change: number | null;
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
  invertChange?: boolean;
}) {
  const bgClass =
    tone === 'income'
      ? 'bg-income-soft text-income'
      : tone === 'warning'
      ? 'bg-warning-soft text-warning'
      : tone === 'blue'
      ? 'bg-[#EAF0FF] text-accent'
      : 'bg-primary-soft text-primary';

  const isPositive = invertChange ? (change ?? 0) <= 0 : (change ?? 0) >= 0;

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start justify-between">
        <div className={`grid size-10 place-items-center rounded-2xl ${bgClass}`}>
          <Icon className="size-5" />
        </div>
        {change === null ? (
          <span className="text-sm text-text-muted">—</span>
        ) : (
          <span
            className={`flex items-center gap-0.5 text-xs font-bold ${
              isPositive ? 'text-income' : 'text-expense'
            }`}
          >
            {change >= 0 ? '+' : '−'}
            {Math.abs(change).toLocaleString('pt-BR')}%
          </span>
        )}
      </div>
      <p className="mt-4 text-xs text-text-muted">{label}</p>
      <p className="mt-1 tabular-nums text-lg font-bold sm:text-xl">{formatMoney(value)}</p>
      <div className="mt-2">
        <Sparkline tone={tone} />
      </div>
    </Card>
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
      />
      <KpiCard
        label="Despesas do período"
        value={summary.totalExpense}
        change={summary.previous.expenseChangePct}
        icon={TrendingDown}
        tone="violet"
        invertChange
      />
      <KpiCard
        label="Saldo do período"
        value={summary.balance}
        change={null}
        icon={PiggyBank}
        tone="blue"
      />
      <KpiCard
        label="Faturas em aberto"
        value={creditCardDebt}
        change={null}
        icon={CreditCard}
        tone="warning"
      />
    </div>
  );
}
