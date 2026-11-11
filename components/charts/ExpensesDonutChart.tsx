'use client';

import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CategoryIcon } from '@/components/icons/CategoryIcon';
import { formatMoney } from '@/lib/format/money';
import type { ExpenseByCategory } from '@/types';

interface ExpensesDonutChartProps {
  categories: ExpenseByCategory[];
  total: number;
  isLoading?: boolean;
}

function DonutTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; payload?: ExpenseByCategory }>;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  if (!item) return null;
  return (
    <div className="rounded-2xl border border-border bg-surface p-3 text-xs shadow-xl">
      <p className="font-bold text-text">{item.name}</p>
      <p className="mt-1 text-text-muted">
        {formatMoney(item.total)} · {item.percentage.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%
      </p>
    </div>
  );
}

export function ExpensesDonutChart({ categories, total, isLoading }: ExpensesDonutChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (isLoading) {
    return <Skeleton className="h-[340px] w-full rounded-3xl" />;
  }

  // Ordena do maior para o menor
  const sorted = [...categories].sort((a, b) => b.total - a.total);

  return (
    <Card variant="chart" className="">
      <h2 className="text-base font-semibold tracking-tight text-text">Despesas por categoria</h2>

      <div className="mt-4 grid items-center gap-6 sm:grid-cols-[180px_1fr]">
        {/* Rosca */}
        <div className="relative mx-auto size-44 sm:mx-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                isAnimationActive={false}
                data={sorted}
                dataKey="total"
                nameKey="name"
                innerRadius={57}
                outerRadius={80}
                paddingAngle={3}
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                {sorted.map((item, index) => (
                  <Cell
                    key={item.name}
                    fill={item.color}
                    opacity={activeIndex === null || activeIndex === index ? 1 : 0.35}
                    stroke="var(--color-surface)"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip content={<DonutTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* Total no centro */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <strong className="tabular-nums text-base font-semibold tracking-tight text-text">
              {formatMoney(total)}
            </strong>
            <span className="text-xs text-text-muted">Total</span>
          </div>
        </div>

        {/* Legenda interativa */}
        <div className="grid gap-1.5">
          {sorted.map((item, index) => (
            <div
              key={item.name}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              className={`flex items-center gap-2 rounded-xl px-2 py-1.5 transition ${
                activeIndex === index ? 'bg-surface-soft' : ''
              }`}
            >
              <span
                className="grid shrink-0 place-items-center rounded-full"
                style={{
                  backgroundColor: `${item.color}20`,
                  color: item.color,
                  width: 28,
                  height: 28,
                }}
              >
                <CategoryIcon name={item.icon} className="size-3.5" />
              </span>
              <span className="min-w-0 flex-1 truncate text-xs font-semibold text-text">
                {item.name}
              </span>
              <span className="shrink-0 tabular-nums text-xs font-bold text-text">
                {formatMoney(item.total)}
              </span>
              <span className="shrink-0 text-xs text-text-muted">
                {item.percentage.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {sorted.length > 0 && (
        <p className="mt-5 rounded-2xl bg-surface-soft px-4 py-3 text-sm font-semibold text-text">
          Maior categoria:{' '}
          <strong>
            {sorted[0].name} ({sorted[0].percentage.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%)
          </strong>
        </p>
      )}
    </Card>
  );
}

