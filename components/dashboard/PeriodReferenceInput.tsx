'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { formatWeekInput, weekInputToDate } from '@/lib/format/week';
import type { Period } from '@/types';

interface PeriodReferenceInputProps {
  period: Exclude<Period, 'CUSTOM'>;
  date: string;
  onDateChange: (date: string) => void;
}

export function PeriodReferenceInput({ period, date, onDateChange }: PeriodReferenceInputProps) {
  const [year, setYear] = useState(date.slice(0, 4));
  const [yearError, setYearError] = useState<string>();

  const commitYear = () => {
    if (!/^\d{4}$/.test(year) || Number(year) < 1) {
      setYearError('Informe um ano válido com quatro dígitos.');
      return;
    }
    setYearError(undefined);
    if (year !== date.slice(0, 4)) onDateChange(`${year}-01-01`);
  };

  if (period === 'YEAR') return (
    <Input label="Ano de referência" type="number" min={1} max={9999} step={1}
      value={year} error={yearError} className="tabular-nums"
      onChange={event => { setYear(event.target.value); setYearError(undefined); }}
      onBlur={commitYear} onKeyDown={event => {
        if (event.key === 'Enter') { event.preventDefault(); event.currentTarget.blur(); }
      }} />
  );

  if (period === 'MONTH') return (
    <Input label="Mês de referência" type="month" value={date.slice(0, 7)}
      min="0001-01" max="9999-12" className="tabular-nums"
      onChange={event => {
        if (event.target.validity.valid && event.target.value) onDateChange(`${event.target.value}-01`);
      }} />
  );

  if (period === 'WEEK') return (
    <Input label="Semana de referência" type="week" value={formatWeekInput(date)}
      hint="Semana de segunda a domingo." className="tabular-nums"
      onChange={event => {
        const reference = weekInputToDate(event.target.value);
        if (event.target.validity.valid && reference) onDateChange(reference);
      }} />
  );

  return (
    <Input label="Dia de referência" type="date" value={date}
      min="0001-01-01" max="9999-12-31" className="tabular-nums"
      onChange={event => {
        if (event.target.validity.valid && event.target.value) onDateChange(event.target.value);
      }} />
  );
}
