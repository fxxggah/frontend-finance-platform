'use client';

import { useMemo } from 'react';
import {
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
import type { EvolutionPoint, Granularity } from '@/types';

interface EvolutionBarChartProps {
  points: EvolutionPoint[];
  granularity: Granularity;
  isLoading?: boolean;
}

const GRANULARITY_LABELS: Record<Granularity, string> = {
  DAY: 'Por dia',
  WEEK: 'Por semana',
  MONTH: 'Por mês',
};

function BarTooltip({
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
    <div className="rounded-2xl border border-white/20 bg-slate-900/95 p-3 text-xs text-white shadow-2xl backdrop-blur-md">
      <p className="mb-2 font-bold text-white/90">{label}</p>
      {payload.map((item) => (
        <p key={item.dataKey} className="flex items-center justify-between gap-4 text-white/80">
          <span>{item.dataKey === 'income' ? 'Receitas:' : 'Despesas:'}</span>
          <strong className="tabular-nums text-white">{formatMoney(item.value ?? 0)}</strong>
        </p>
      ))}
    </div>
  );
}

export function EvolutionBarChart({ points, granularity, isLoading }: EvolutionBarChartProps) {
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
          <h2 className="text-xl font-bold tracking-tight text-white mt-0.5">
            Receitas vs. Despesas
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-sm text-white/95">
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
          <span className="size-3 rounded-full bg-[#FDA4AF] shadow-sm" />
          <span>Despesas</span>
        </span>
      </div>

      {/* Gráfico de Barras Agrupadas */}
      <div className="h-64 sm:h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
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
            <Tooltip content={<BarTooltip />} />
            <Bar dataKey="income" name="Receita" fill="#FFFFFF" radius={[6, 6, 0, 0]} maxBarSize={32} />
            <Bar dataKey="expense" name="Despesa" fill="#FDA4AF" radius={[6, 6, 0, 0]} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

