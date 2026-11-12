'use client';

import { useId, useMemo } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatMoney } from '@/lib/format/money';
import type { EvolutionPoint, Granularity, Period } from '@/types';

interface EvolutionAreaChartProps {
  points: EvolutionPoint[];
  granularity: Granularity;
  period: Period;
  isLoading?: boolean;
}

const GRANULARITY_LABELS: Record<Granularity, string> = {
  DAY: 'Por dia',
  WEEK: 'Por semana',
  MONTH: 'Por mês',
};

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ dataKey?: string; value?: number; payload?: EvolutionPoint }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl border border-border bg-surface p-3 text-xs text-text shadow-default">
      <p className="mb-2 font-bold text-text">{label}</p>
      {payload.map((item) => (
        <p key={item.dataKey} className="flex items-center justify-between gap-4 text-text-muted">
          <span>{item.dataKey === 'income' ? 'Receitas:' : 'Despesas:'}</span>
          <strong className="tabular-nums text-text">{formatMoney(item.value ?? 0)}</strong>
        </p>
      ))}
    </div>
  );
}

export function EvolutionAreaChart({ points, granularity, period, isLoading }: EvolutionAreaChartProps) {
  const gradientId = useId();
  const isDayPeriod = period === 'DAY';
  const Chart = isDayPeriod ? BarChart : AreaChart;
  const chartData = useMemo(
    () =>
      points.map((p) => ({
        label: p.label,
        income: p.income,
        expense: p.expense,
        balance: p.balance,
      })),
    [points]
  );

  if (isLoading) {
    return <Skeleton className="h-[380px] w-full rounded-3xl" />;
  }

  return (
    <Card variant="brand" padding="lg" className="flex flex-col justify-between space-y-4">
      {/* Topo do Card de Evolução */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-white">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-white/80">
            Evolução Comparativa
          </span>
          <h2 className="text-lg font-semibold tracking-tight text-white mt-0.5">
            Receitas vs. Despesas
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white/95">
            {GRANULARITY_LABELS[granularity] || granularity}
          </span>
        </div>
      </div>

      {/* Legenda de Cores */}
      <div className="flex items-center gap-6 text-xs text-white/90">
        <span className="flex items-center gap-2">
          <span className="size-3 rounded-full bg-white shadow-sm" />
          <span>Receitas</span>
        </span>
        <span className="flex items-center gap-2">
          <span className="size-3 rounded-full bg-rose-300 shadow-sm" />
          <span>Despesas</span>
        </span>
      </div>

      {/* Barras no período Dia; áreas suaves nos demais períodos. */}
      <div className="h-64 sm:h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <Chart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
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
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.12)" vertical={false} />
            <XAxis
              dataKey="label"
              stroke="rgba(255,255,255,0.7)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="rgba(255,255,255,0.7)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
            />
            <Tooltip content={<ChartTooltip />} cursor={isDayPeriod ? false : undefined} />
            {isDayPeriod ? (
              <>
                <Bar
                  dataKey="income"
                  name="Receita"
                  fill="var(--color-white)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={32}
                  isAnimationActive={false}
                />
                <Bar
                  dataKey="expense"
                  name="Despesa"
                  fill="var(--color-rose-300)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={32}
                  isAnimationActive={false}
                />
              </>
            ) : (
              <>
                <Area
                  type="monotone"
                  dataKey="income"
                  name="Receita"
                  stroke="var(--color-white)"
                  strokeWidth={2.5}
                  fill={`url(#${gradientId}-income)`}
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  name="Despesa"
                  stroke="var(--color-rose-300)"
                  strokeWidth={2.5}
                  fill={`url(#${gradientId}-expense)`}
                  isAnimationActive={false}
                />
              </>
            )}
          </Chart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

