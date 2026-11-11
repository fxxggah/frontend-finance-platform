'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/keys';
import {
  getSummary,
  getExpensesByCategory,
  getEvolution,
  getRecentTransactions,
} from '@/lib/api/endpoints/dashboard';

const STALE_TIME = 30 * 1000; // 30 segundos

/**
 * Totalizadores do período: receitas, despesas, saldo e comparação com período anterior.
 */
export function useDashboardSummary(period = 'MONTH', date?: string) {
  return useQuery({
    queryKey: queryKeys.dashboard.summary(period, date),
    queryFn: () => getSummary(period, date),
    staleTime: STALE_TIME,
  });
}

/**
 * Despesas agrupadas por categoria com percentuais.
 */
export function useExpensesByCategory(period = 'MONTH', date?: string) {
  return useQuery({
    queryKey: queryKeys.dashboard.expensesByCategory(period, date),
    queryFn: () => getExpensesByCategory(period, date),
    staleTime: STALE_TIME,
  });
}

/**
 * Série temporal da evolução de receitas e despesas ao longo do período.
 */
export function useEvolution(period = 'MONTH', date?: string) {
  return useQuery({
    queryKey: queryKeys.dashboard.evolution(period, date),
    queryFn: () => getEvolution(period, date),
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
