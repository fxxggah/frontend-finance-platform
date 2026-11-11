import { apiFetch } from '@/lib/api/client';
import { simulateNetworkDelay, USE_MOCK } from '@/lib/config';
import type { DashboardSummary, EvolutionResponse, ExpenseByCategory, RecentTransaction, DashboardFilters, Period } from '@/types';

type Filters = Omit<DashboardFilters, 'period' | 'date'>;

export async function getSummary(period: Period = 'MONTH', date?: string, filters: Filters = {}): Promise<DashboardSummary> {
  if (USE_MOCK) {
    await simulateNetworkDelay();
    return (await import('@/lib/mock-data')).dashboardSummary;
  }
  return apiFetch<DashboardSummary>('/dashboard/summary', { params: { period, date, ...filters } });
}

export async function getExpensesByCategory(period: Period = 'MONTH', date?: string, filters: Filters = {}): Promise<ExpenseByCategory[]> {
  if (USE_MOCK) {
    await simulateNetworkDelay();
    return (await import('@/lib/mock-data')).expenseCategories;
  }
  return apiFetch<ExpenseByCategory[]>('/dashboard/expenses-by-category', { params: { period, date, ...filters } });
}

export async function getEvolution(period: Period = 'MONTH', date?: string, filters: Filters = {}): Promise<EvolutionResponse> {
  if (USE_MOCK) {
    await simulateNetworkDelay();
    return (await import('@/lib/mock-data')).evolutionResponse;
  }
  return apiFetch<EvolutionResponse>('/dashboard/evolution', { params: { period, date, ...filters } });
}

export async function getRecentTransactions(limit = 5): Promise<RecentTransaction[]> {
  if (USE_MOCK) {
    await simulateNetworkDelay();
    return (await import('@/lib/mock-data')).mockTransactions.slice(0, limit).map(item => ({
      id: item.id, amount: item.amount, date: item.date, type: item.type,
      categoryName: item.category.name,
      accountName: item.account?.name ?? null, creditCardName: item.creditCard?.name ?? null,
    }));
  }
  return apiFetch<RecentTransaction[]>('/dashboard/recent-transactions', { params: { limit } });
}

