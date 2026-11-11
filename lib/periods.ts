import type { Period } from '@/types';

export const PERIOD_OPTIONS = [
  { value: 'DAY', label: 'Dia' },
  { value: 'WEEK', label: 'Semana' },
  { value: 'MONTH', label: 'Mês' },
  { value: 'YEAR', label: 'Ano' },
  { value: 'CUSTOM', label: 'Personalizado' },
] as const satisfies readonly { value: Period; label: string }[];

export function isPeriod(value: string | null): value is Period {
  return PERIOD_OPTIONS.some(option => option.value === value);
}

export function resolvePeriod(value: string | null): Period {
  return isPeriod(value) ? value : 'MONTH';
}
