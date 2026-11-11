'use client';

import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CategoryIcon } from '@/components/icons/CategoryIcon';
import { formatMoney } from '@/lib/format/money';
import { cn } from '@/lib/utils';
import type { ExpenseByCategory } from '@/types';

interface CategoryBreakdownProps {
  categories: ExpenseByCategory[];
  total: number;
  isLoading?: boolean;
}

function CustomDonutTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload?: ExpenseByCategory }>;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  if (!item) return null;
  return (
    <div className="rounded-2xl border border-border bg-surface p-3 text-xs shadow-xl">
      <p className="font-bold text-text">{item.name}</p>
      <p className="mt-1 text-text-muted">
        {formatMoney(item.total)} · {item.percentage.toFixed(1)}% ({item.count} {item.count === 1 ? 'transação' : 'transações'})
      </p>
    </div>
  );
}

export function CategoryBreakdown({ categories, total, isLoading }: CategoryBreakdownProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (isLoading) {
    return <Skeleton className="h-[420px] w-full rounded-3xl" />;
  }

  const sorted = [...categories].sort((a, b) => b.total - a.total);

  if (sorted.length === 0) {
    return (
      <Card className="p-6 text-center text-xs text-text-muted">
        Nenhuma despesa categorizada no período selecionado.
      </Card>
    );
  }

  return (
    <Card className="p-5 sm:p-6 space-y-6">
      <div>
        <h2 className="text-lg font-bold tracking-tight text-text">
          Distribuição por Categoria
        </h2>
        <p className="text-xs text-text-muted">
          Detalhamento do consumo de despesas e representatividade percentual
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] items-center gap-6">
        {/* Rosca Grande */}
        <div className="relative mx-auto size-56">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={sorted}
                dataKey="total"
                nameKey="name"
                innerRadius={68}
                outerRadius={98}
                paddingAngle={2.5}
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
                    className="transition-opacity duration-200"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomDonutTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Total Centralizado */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              Total Despesas
            </span>
            <strong className="tabular-nums text-lg font-bold text-text mt-0.5">
              {formatMoney(total)}
            </strong>
          </div>
        </div>

        {/* Legenda Detalhada em Lista com Barra Fina */}
        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
          {sorted.map((item, index) => {
            const isHovered = activeIndex === index;
            return (
              <div
                key={item.name}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                className={cn(
                  'rounded-xl p-2.5 transition-all border border-transparent',
                  isHovered ? 'bg-surface-soft border-border/80' : 'hover:bg-surface-soft/60'
                )}
              >
                <div className="flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="flex size-7 shrink-0 items-center justify-center rounded-lg"
                      style={{
                        backgroundColor: `${item.color}15`,
                        color: item.color,
                      }}
                    >
                      <CategoryIcon name={item.icon} size={15} />
                    </div>
                    <span className="font-semibold text-text truncate">{item.name}</span>
                    <span className="text-[11px] text-text-muted shrink-0">
                      ({item.count} {item.count === 1 ? 'lançamento' : 'lançamentos'})
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-bold tabular-nums text-text">{formatMoney(item.total)}</span>
                    <span className="text-text-muted ml-1.5 tabular-nums font-medium">
                      {item.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Barra Fina de Proporção */}
                <div className="mt-2 h-1.5 w-full rounded-full bg-border/40 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

