'use client';

import { Card } from '@/components/ui/card';
import { usePeriodParams } from '@/hooks/use-period-params';
import { formatDate } from '@/lib/format/date';
import { PERIOD_OPTIONS } from '@/lib/periods';

export function PeriodSelect({ from, to }: { from: string; to: string }) {
  const { period, date, setPeriod } = usePeriodParams();
  return (
    <Card className="space-y-4 p-5">
      <h2 className="text-sm font-semibold text-text">Período</h2>
      <p className="text-sm text-text-muted">{formatDate(from)} a {formatDate(to)}</p>
      <div className="flex flex-wrap gap-2">
        {PERIOD_OPTIONS.map(item => <button key={item.value} type="button" aria-pressed={period === item.value}
          onClick={() => setPeriod({ period: item.value, ...(item.value === 'CUSTOM' ? { from, to } : {}) })}
          className={`min-h-11 rounded-xl px-3 py-2 text-xs font-semibold ${period === item.value ? 'bg-primary text-white' : 'bg-surface-soft text-text-muted'}`}>
          {item.label}
        </button>)}
      </div>
      {period === 'CUSTOM' ? <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs text-text-muted">De
          <input type="date" value={from} max={to} onChange={event => {
            if (event.target.value) setPeriod({ period, from: event.target.value, to });
          }} className="mt-1 min-h-11 w-full rounded-xl border border-border bg-surface px-2 text-text" />
        </label>
        <label className="text-xs text-text-muted">Até
          <input type="date" value={to} min={from} onChange={event => {
            if (event.target.value) setPeriod({ period, from, to: event.target.value });
          }} className="mt-1 min-h-11 w-full rounded-xl border border-border bg-surface px-2 text-text" />
        </label>
      </div> : <label className="block text-xs text-text-muted">Data de referência
        <input type="date" value={date} onChange={event => {
          if (event.target.value) setPeriod({ date: event.target.value });
        }} className="mt-1 min-h-11 w-full rounded-xl border border-border bg-surface px-2 text-text" />
      </label>}
    </Card>
  );
}

