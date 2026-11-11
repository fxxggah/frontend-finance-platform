'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback, useEffect } from 'react';
import type { Period } from '@/types';
import { getToday } from '@/lib/format/date';
import { isPeriod, resolvePeriod } from '@/lib/periods';

export interface PeriodParams {
  period: Period;
  date: string;
  from?: string;
  to?: string;
}

/**
 * Hook que lê e escreve os parâmetros de período na URL (?period=MONTH&date=2026-10-31).
 */
export function usePeriodParams(): PeriodParams & { setPeriod: (p: Partial<PeriodParams>) => void } {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const rawPeriod = searchParams.get('period');
  const period = resolvePeriod(rawPeriod);
  const date = searchParams.get('date') || getToday();
  const from = period === 'CUSTOM' ? searchParams.get('from') || date : undefined;
  const to = period === 'CUSTOM' ? searchParams.get('to') || date : undefined;

  useEffect(() => {
    if (rawPeriod === null || isPeriod(rawPeriod)) return;
    const next = new URLSearchParams(searchParams.toString());
    next.set('period', 'MONTH');
    next.delete('from');
    next.delete('to');
    next.delete('page');
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }, [rawPeriod, searchParams, router, pathname]);

  const setPeriod = useCallback(
    (params: Partial<PeriodParams>) => {
      const next = new URLSearchParams(searchParams.toString());
      const nextPeriod = params.period ?? period;
      next.set('period', nextPeriod);
      if (params.date !== undefined) next.set('date', params.date);
      if (nextPeriod === 'CUSTOM') {
        next.set('from', params.from ?? from ?? params.date ?? date);
        next.set('to', params.to ?? to ?? params.date ?? date);
      } else {
        next.delete('from');
        next.delete('to');
      }
      next.delete('page');
      router.push(`${pathname}?${next.toString()}`);
    },
    [searchParams, router, pathname, period, date, from, to]
  );

  return { period, date, from, to, setPeriod };
}
