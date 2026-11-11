'use client';

import { ChevronDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { usePeriodParams } from '@/hooks/use-period-params';
import type { Period } from '@/types';

interface PeriodSelectProps {
  resolvedInterval?: string; // ex: "1 a 31 de out. de 2026"
}

const PERIODS: { key: Period; label: string }[] = [
  { key: 'DAY', label: 'Dia' },
  { key: 'WEEK', label: 'Semana' },
  { key: 'MONTH', label: 'Mês' },
  { key: 'YEAR', label: 'Ano' },
];

export function PeriodSelect({ resolvedInterval = '1 a 31 de out. de 2026' }: PeriodSelectProps) {
  const { period, setPeriod } = usePeriodParams();

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Período</p>
          <p className="mt-1 font-bold text-text">Outubro de 2026</p>
        </div>
        <div className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary">
          <ChevronDown className="size-4" />
        </div>
      </div>

      <p className="mt-4 text-sm text-text-muted">{resolvedInterval}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {PERIODS.map((p) => {
          const isActive = period === p.key;
          return (
            <button
              key={p.key}
              onClick={() => setPeriod({ period: p.key })}
              className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                isActive
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-surface-soft text-text-muted hover:bg-border'
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>
    </Card>
  );
}

