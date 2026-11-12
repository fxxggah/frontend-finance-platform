'use client';

import { Card } from '@/components/ui/card';
import { usePeriodParams } from '@/hooks/use-period-params';
import { formatDate } from '@/lib/format/date';
import { PERIOD_OPTIONS } from '@/lib/periods';
import { CalendarDays } from 'lucide-react';
import styles from '@/components/ui/surfaces.module.css';
import { PeriodReferenceInput } from './PeriodReferenceInput';

export function PeriodSelect({ from, to }: { from: string; to: string }) {
  const { period, date, setPeriod } = usePeriodParams();
  return (
    <Card variant="panel" className="flex h-full min-w-0 flex-col gap-5 p-6 sm:p-7">
      <div className="flex items-center justify-between gap-3">
        <h2 className={`${styles.eyebrow} text-text-muted`}>Janela de análise</h2>
        <CalendarDays className="size-4 text-primary" aria-hidden="true" />
      </div>
      <div>
        <p className="text-lg font-semibold tracking-tight text-text">Resumo do período</p>
        <p className="mt-2 tabular-nums text-sm text-text-muted">{formatDate(from)} a {formatDate(to)}</p>
      </div>
      <div className="flex flex-wrap gap-1 rounded-2xl bg-surface-soft p-1">
        {PERIOD_OPTIONS.map(item => <button key={item.value} type="button" aria-pressed={period === item.value}
          onClick={() => setPeriod({ period: item.value, ...(item.value === 'CUSTOM' ? { from, to } : {}) })}
          className={`min-h-11 flex-1 rounded-xl px-2 py-2 text-xs font-semibold transition-colors ${period === item.value ? 'bg-primary text-white shadow-sm' : 'text-text-muted hover:text-text'}`}>
          {item.label}
        </button>)}
      </div>
      {period === 'CUSTOM' ? <div className="mt-auto grid gap-3 sm:grid-cols-2">
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
      </div> : <div className="mt-auto min-w-0">
        <PeriodReferenceInput key={`${period}-${date}`} period={period} date={date}
          onDateChange={reference => setPeriod({ date: reference })} />
      </div>}
    </Card>
  );
}

