'use client';

import { useEffect, useMemo, useState } from 'react';
import { useDashboardSummary, useEvolution, useExpensesByCategory } from './use-dashboard';
import type { PeriodParams } from './use-period-params';
import type { DashboardSummary, EvolutionResponse, ExpenseByCategory, Period } from '@/types';

interface DashboardPeriodSnapshot {
  period: Period;
  summary: DashboardSummary;
  evolution: EvolutionResponse;
  categories: ExpenseByCategory[];
}

/** Mantém um conjunto completo do período, sem misturar respostas de seleções diferentes. */
export function useDashboardPeriod({ period, date, from, to }: PeriodParams) {
  const filters = { from, to };
  const options = { retainPreviousData: true };
  const summary = useDashboardSummary(period, date, filters, options);
  const evolution = useEvolution(period, date, filters, options);
  const categories = useExpensesByCategory(period, date, filters, options);
  const queries = [summary, evolution, categories];
  const isFetching = queries.some(query => query.isFetching);
  const isError = queries.some(query => query.isError);
  const isComplete = queries.every(query => query.isSuccess && !query.isPlaceholderData) && !isFetching;
  const [previous, setPrevious] = useState<DashboardPeriodSnapshot | null>(null);

  const current = useMemo<DashboardPeriodSnapshot | null>(() => {
    if (!isComplete || !summary.data || !evolution.data || !categories.data) return null;
    return { period, summary: summary.data, evolution: evolution.data, categories: categories.data };
  }, [isComplete, period, summary.data, evolution.data, categories.data]);

  // Só guarda respostas completas da seleção atual; placeholders nunca são confirmados.
  useEffect(() => {
    if (current) setPrevious(current);
  }, [current]);

  const retry = () => { queries.forEach(query => { void query.refetch(); }); };

  return { data: current ?? previous, isFetching, isError, retry };
}
