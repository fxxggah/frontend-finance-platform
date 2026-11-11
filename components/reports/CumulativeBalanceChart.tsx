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
  Dot,
} from 'recharts';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatMoney } from '@/lib/format/money';
import type { EvolutionPoint } from '@/types';

interface CumulativeBalanceChartProps {
  points: EvolutionPoint[];
  isLoading?: boolean;
}

interface CumulativeItem {
  label: string;
  cumulative: number;
  isNegative: boolean;
  income: number;
  expense: number;
}

function CumulativeTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ payload?: CumulativeItem }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  if (!item) return null;

  return (
    <div className="rounded-2xl border border-border bg-surface p-3 text-xs shadow-xl space-y-1">
      <p className="font-bold text-text">{label}</p>
      <p className="text-text-muted flex items-center justify-between gap-4">
        <span>Saldo Acumulado:</span>
        <strong
          className={`tabular-nums font-bold ${
            item.isNegative ? 'text-expense' : 'text-income'
          }`}
        >
          {formatMoney(item.cumulative)}
        </strong>
      </p>
      {item.isNegative && (
        <p className="text-[11px] font-semibold text-expense">
          ⚠️ Saldo negativo nesta data
        </p>
      )}
    </div>
  );
}

export function CumulativeBalanceChart({ points, isLoading }: CumulativeBalanceChartProps) {
  const data: CumulativeItem[] = useMemo(() => {
    let running = 0;
    return points.map((p) => {
      running += p.balance;
      return {
        label: p.label,
        cumulative: Number(running.toFixed(2)),
        isNegative: running < 0,
        income: p.income,
        expense: p.expense,
      };
    });
  }, [points]);

  const hasNegativePoints = data.some((d) => d.isNegative);

  if (isLoading) {
    return <Skeleton className="h-[360px] w-full rounded-3xl" />;
  }

  return (
    <Card className="p-5 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-text">
            Evolução do Saldo Acumulado
          </h2>
          <p className="text-xs text-text-muted">
            Tendência líquida acumulada ao longo do período selecionado
          </p>
        </div>

        {hasNegativePoints && (
          <span className="rounded-full bg-expense-soft text-expense px-3 py-1 text-xs font-semibold">
            Saldo negativo detectado em pontos do período
          </span>
        )}
      </div>

      <div className="h-64 sm:h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="balance-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis
              dataKey="label"
              stroke="var(--color-text-muted)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="var(--color-text-muted)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => (Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
            />
            <Tooltip content={<CumulativeTooltip />} />
            <Area
              type="monotone"
              dataKey="cumulative"
              stroke="var(--color-primary)"
              strokeWidth={2.5}
              fill="url(#balance-gradient)"
              dot={(props: { cx?: number; cy?: number; payload?: CumulativeItem }) => {
                if (!props.cx || !props.cy || !props.payload) return <></>;
                if (props.payload.isNegative) {
                  return (
                    <circle
                      key={`${props.cx}-${props.cy}`}
                      cx={props.cx}
                      cy={props.cy}
                      r={4.5}
                      fill="var(--color-expense)"
                      stroke="#FFFFFF"
                      strokeWidth={1.5}
                    />
                  );
                }
                return <></>;
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

