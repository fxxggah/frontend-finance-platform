'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/keys';
import {
  getSummary,
  getExpensesByCategory,
  getEvolution,
  getRecentTransactions,
} from '@/lib/api/endpoints/dashboard';
import type { DashboardFilters, Period } from '@/types';

type Filters = Omit<DashboardFilters, 'period' | 'date'>;
type PeriodQueryOptions = { retainPreviousData?: boolean };

const STALE_TIME = 30 * 1000; // 30 segundos

/**
 * Totalizadores do período: receitas, despesas, saldo e comparação com período anterior.
 */
export function useDashboardSummary(period: Period = 'MONTH', date?: string, filters: Filters = {}, options: PeriodQueryOptions = {}) {
  return useQuery({
    queryKey: queryKeys.dashboard.summary(period, date, filters),
    queryFn: () => getSummary(period, date, filters),
    placeholderData: options.retainPreviousData ? keepPreviousData : undefined,
    staleTime: STALE_TIME,
  });
}

/**
 * Despesas agrupadas por categoria com percentuais.
 */
export function useExpensesByCategory(period: Period = 'MONTH', date?: string, filters: Filters = {}, options: PeriodQueryOptions = {}) {
  return useQuery({
    queryKey: queryKeys.dashboard.expensesByCategory(period, date, filters),
    queryFn: () => getExpensesByCategory(period, date, filters),
    placeholderData: options.retainPreviousData ? keepPreviousData : undefined,
    staleTime: STALE_TIME,
  });
}

/**
 * Série temporal da evolução de receitas e despesas ao longo do período.
 */
export function useEvolution(period: Period = 'MONTH', date?: string, filters: Filters = {}, options: PeriodQueryOptions = {}) {
  return useQuery({
    queryKey: queryKeys.dashboard.evolution(period, date, filters),
    queryFn: () => getEvolution(period, date, filters),
    placeholderData: options.retainPreviousData ? keepPreviousData : undefined,
    staleTime: STALE_TIME,
  });
}

/**
 * Últimas N transações para exibir no dashboard.
 */
export function useRecentTransactions(limit = 5) {
  return useQuery({
    queryKey: queryKeys.dashboard.recent(limit),
    queryFn: () => getRecentTransactions(limit),
    staleTime: STALE_TIME,
  });
}
