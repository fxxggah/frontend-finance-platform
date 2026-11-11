'use client';

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatMoney } from '@/lib/format/money';
import { formatCompactMoney } from '@/lib/format/money';
import { formatShortDate } from '@/lib/format/date';
import type { EvolutionPoint } from '@/types';

interface CashFlowChartProps {
  points: EvolutionPoint[];
  isLoading?: boolean;
  periodLabel?: string;
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ dataKey?: string; value?: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl border border-border bg-surface p-3 text-xs shadow-xl">
      <p className="mb-2 font-bold text-text">{label ? formatShortDate(label) : ''}</p>
      {payload.map((item) => (
        <p key={item.dataKey} className="flex gap-2 text-text-muted">
          <span className="font-semibold text-text">
            {item.dataKey === 'income' ? 'Receitas' : 'Despesas'}:
          </span>
          {formatMoney(item.value ?? 0)}
        </p>
      ))}
    </div>
  );
}

export function CashFlowChart({ points, isLoading, periodLabel }: CashFlowChartProps) {
  const data = useMemo(
    () =>
      points.map((p) => ({
        date: p.from,
        income: p.income,
        expense: p.expense,
      })),
    [points]
  );

  if (isLoading) {
    return <Skeleton className="h-[340px] w-full rounded-3xl" />;
  }

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-text">Fluxo de caixa</h2>
          <p className="mt-1 text-xs text-text-muted">Receitas e despesas no período</p>
        </div>
        {periodLabel && (
          <span className="rounded-xl bg-surface-soft px-3 py-2 text-xs font-semibold text-text-muted">
            {periodLabel}
          </span>
        )}
      </div>

      <div className="mt-5 flex gap-5 text-xs font-semibold">
        <span className="flex items-center gap-2">
          <i className="size-2 rounded-full bg-primary" />
          Receitas
        </span>
        <span className="flex items-center gap-2">
          <i className="size-2 rounded-full bg-expense" />
          Despesas
        </span>
      </div>

      <div className="mt-4 h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="income-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.24} />
                <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="expense-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-expense)" stopOpacity={0.18} />
                <stop offset="100%" stopColor="var(--color-expense)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="4 4"
              stroke="var(--color-border)"
              horizontal
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tickFormatter={(v) => formatShortDate(v)}
              tickLine={false}
              axisLine={false}
              interval={Math.max(0, Math.floor(data.length / 6) - 1)}
              tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
            />
            <YAxis
              tickFormatter={(v) => formatCompactMoney(v)}
              tickLine={false}
              axisLine={false}
              width={62}
              tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
            />
            <Tooltip content={<ChartTooltip />} />
            <Area
              type="monotone"
              dataKey="income"
              stroke="var(--color-primary)"
              strokeWidth={2.5}
              fill="url(#income-fill)"
              isAnimationActive
              animationDuration={400}
            />
            <Area
              type="monotone"
              dataKey="expense"
              stroke="var(--color-expense)"
              strokeWidth={2.5}
              fill="url(#expense-fill)"
              isAnimationActive
              animationDuration={400}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
