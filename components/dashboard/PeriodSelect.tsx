'use client';

import { Card } from '@/components/ui/card';
import { usePeriodParams } from '@/hooks/use-period-params';
import { formatDate } from '@/lib/format/date';
import { PERIOD_OPTIONS } from '@/lib/periods';
import { CalendarDays } from 'lucide-react';
import styles from '@/components/ui/surfaces.module.css';
import { PeriodReferenceInput } from './PeriodReferenceInput';
import { Button } from '@/components/ui/button';

interface PeriodSelectProps {
  from: string;
  to: string;
  isUpdating: boolean;
  hasUpdateError: boolean;
  onRetry: () => void;
}

export function PeriodSelect({ from, to, isUpdating, hasUpdateError, onRetry }: PeriodSelectProps) {
  const { period, date, from: selectedFrom, to: selectedTo, setPeriod } = usePeriodParams();
  return (
    <Card variant="panel" className="flex h-auto min-w-0 flex-col gap-5 p-6 sm:p-7 xl:h-full">
      <div className="flex items-center justify-between gap-3">
        <h2 className={`${styles.eyebrow} text-text-muted`}>Janela de análise</h2>
        <CalendarDays className="size-4 text-primary" aria-hidden="true" />
      </div>
      <div>
        <p className="text-lg font-semibold tracking-tight text-text">Período dos dados exibidos</p>
        <p className="mt-2 tabular-nums text-sm text-text-muted">{formatDate(from)} a {formatDate(to)}</p>
      </div>
      <div className="flex flex-wrap gap-1 rounded-2xl bg-surface-soft p-1">
        {PERIOD_OPTIONS.map(item => <button key={item.value} type="button" aria-pressed={period === item.value}
          onClick={() => setPeriod({ period: item.value, ...(item.value === 'CUSTOM' ? { from, to } : {}) })}
          className={`min-h-11 flex-1 rounded-xl px-2 py-2 text-xs font-semibold transition-colors ${period === item.value ? 'bg-primary text-white shadow-sm' : 'text-text-muted hover:text-text'}`}>
          {item.label}
        </button>)}
      </div>
      {period === 'CUSTOM' ? <div className="grid gap-3 sm:grid-cols-2 xl:mt-auto">
        <label className="text-xs text-text-muted">De
          <input type="date" value={selectedFrom} max={selectedTo} onChange={event => {
            if (event.target.value) setPeriod({ from: event.target.value });
          }} className="mt-1 min-h-11 w-full rounded-xl border border-border bg-surface px-2 text-text" />
        </label>
        <label className="text-xs text-text-muted">Até
          <input type="date" value={selectedTo} min={selectedFrom} onChange={event => {
            if (event.target.value) setPeriod({ to: event.target.value });
          }} className="mt-1 min-h-11 w-full rounded-xl border border-border bg-surface px-2 text-text" />
        </label>
      </div> : <div className="min-w-0 xl:mt-auto">
        <PeriodReferenceInput key={`${period}-${date}`} period={period} date={date}
          onDateChange={reference => setPeriod({ date: reference })} />
      </div>}
      <div className={isUpdating || hasUpdateError ? undefined : 'sr-only'}>
        <p role="status" aria-live="polite" aria-atomic="true" className="text-sm text-text-muted">
          {isUpdating ? 'Atualizando período… Mantendo os dados exibidos até concluir.'
            : hasUpdateError ? 'Falha ao atualizar. Dados anteriores mantidos.' : ''}
        </p>
        {hasUpdateError && <Button type="button" variant="outline" className="mt-2" disabled={isUpdating} onClick={onRetry}>
          Tentar novamente
        </Button>}
      </div>
    </Card>
  );
}

