'use client';

import { useId, useMemo } from 'react';
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
          <span className="tabular-nums">{formatMoney(item.value ?? 0)}</span>
        </p>
      ))}
    </div>
  );
}

export function CashFlowChart({ points, isLoading, periodLabel }: CashFlowChartProps) {
  const gradientId = useId();
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
    return <Skeleton className="h-[380px] sm:h-[412px] w-full rounded-3xl" />;
  }

  return (
    <Card variant="brand" padding="lg">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-white">Fluxo de caixa</h2>
          <p className="mt-1 text-xs text-white/80">Receitas e despesas no período</p>
        </div>
        {periodLabel && (
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white/95">
            {periodLabel}
          </span>
        )}
      </div>

      <div className="mt-5 flex gap-6 text-xs text-white/90">
        <span className="flex items-center gap-2">
          <i className="size-3 rounded-full bg-white shadow-sm" />
          Receitas
        </span>
        <span className="flex items-center gap-2">
          <i className="size-3 rounded-full bg-rose-300 shadow-sm" />
          Despesas
        </span>
      </div>

      <div className="mt-4 h-64 sm:h-72 w-full pt-2 tabular-nums">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`${gradientId}-income`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-white)" stopOpacity={0.24} />
                <stop offset="100%" stopColor="var(--color-white)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id={`${gradientId}-expense`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-rose-300)" stopOpacity={0.18} />
                <stop offset="100%" stopColor="var(--color-rose-300)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.12)"
              horizontal
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tickFormatter={(v) => formatShortDate(v)}
              tickLine={false}
              axisLine={false}
              interval={Math.max(0, Math.floor(data.length / 6) - 1)}
              tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.7)' }}
            />
            <YAxis
              tickFormatter={(v) => formatCompactMoney(v)}
              tickLine={false}
              axisLine={false}
              width={62}
              tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.7)' }}
            />
            <Tooltip content={<ChartTooltip />} />
            <Area
              type="monotone"
              dataKey="income"
              stroke="var(--color-white)"
              strokeWidth={2.5}
              fill={`url(#${gradientId}-income)`}
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="expense"
              stroke="var(--color-rose-300)"
              strokeWidth={2.5}
              fill={`url(#${gradientId}-expense)`}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
