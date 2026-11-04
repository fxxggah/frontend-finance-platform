import { apiFetch } from "@/lib/api/client";
import { simulateNetworkDelay, USE_MOCK } from "@/lib/config";
import {
  dashboardSummary,
  evolutionResponse,
  expenseCategories,
  mockTransactions,
} from "@/lib/mock-data";
import type { DashboardSummary, EvolutionResponse, ExpenseByCategory, Transaction } from "@/types";

/**
 * Retorna os totalizadores do período selecionado (receitas, despesas, saldo e comparação anterior).
 * // GET /dashboard/summary
 */
export async function getSummary(period = "MONTH", date?: string): Promise<DashboardSummary> {
  if (USE_MOCK) {
    await simulateNetworkDelay(350);
    return dashboardSummary;
  }

  return apiFetch<DashboardSummary>("/dashboard/summary", {
    params: { period, date },
  });
}

/**
 * Retorna os totais e percentuais de despesas agrupados por categoria.
 * // GET /dashboard/expenses-by-category
 */
export async function getExpensesByCategory(
  period = "MONTH",
  date?: string
): Promise<ExpenseByCategory[]> {
  if (USE_MOCK) {
    await simulateNetworkDelay(300);
    return expenseCategories;
  }

  return apiFetch<ExpenseByCategory[]>("/dashboard/expenses-by-category", {
    params: { period, date },
  });
}

/**
 * Retorna a série temporal da evolução financeira de receitas e despesas.
 * // GET /dashboard/evolution
 */
export async function getEvolution(period = "MONTH", date?: string): Promise<EvolutionResponse> {
  if (USE_MOCK) {
    await simulateNetworkDelay(400);
    return evolutionResponse;
  }

  return apiFetch<EvolutionResponse>("/dashboard/evolution", {
    params: { period, date },
  });
}

/**
 * Retorna os lançamentos recentes mais relevantes para o Início.
 * // GET /dashboard/recent
 */
export async function getRecentTransactions(limit = 5): Promise<Transaction[]> {
  if (USE_MOCK) {
    await simulateNetworkDelay(300);
    return mockTransactions.slice(0, limit);
  }

  return apiFetch<Transaction[]>("/dashboard/recent", {
    params: { limit },
  });
}

