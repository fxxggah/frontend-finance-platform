'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback } from 'react';
import type { Period } from '@/types';

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

  const period = (searchParams.get('period') as Period) || 'MONTH';
  const date = searchParams.get('date') || '2026-10-31';
  const from = searchParams.get('from') ?? undefined;
  const to = searchParams.get('to') ?? undefined;

  const setPeriod = useCallback(
    (params: Partial<PeriodParams>) => {
      const next = new URLSearchParams(searchParams.toString());
      if (params.period !== undefined) next.set('period', params.period);
      if (params.date !== undefined) next.set('date', params.date);
      if (params.from !== undefined) next.set('from', params.from);
      else next.delete('from');
      if (params.to !== undefined) next.set('to', params.to);
      else next.delete('to');
      router.push(`${pathname}?${next.toString()}`);
    },
    [searchParams, router, pathname]
  );

  return { period, date, from, to, setPeriod };
}
