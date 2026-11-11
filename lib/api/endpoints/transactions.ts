import { apiFetch } from "@/lib/api/client";
import { simulateNetworkDelay, USE_MOCK } from "@/lib/config";
import { mockCategories, mockTransactions } from "@/lib/mock-data";
import type { Page, Transaction, TransactionFilterParams, TransactionRequest } from "@/types";

let currentTransactions = [...mockTransactions];

/**
 * Retorna lista paginada de lançamentos financeiros com suporte a múltiplos filtros.
 * // GET /transactions
 */
export async function listTransactions(
  filters: TransactionFilterParams = {}
): Promise<Page<Transaction>> {
  if (USE_MOCK) {
    await simulateNetworkDelay(400);

    let filtered = [...currentTransactions];

    if (filters.type) {
      filtered = filtered.filter((t) => t.type === filters.type);
    }
    if (filters.categoryId) {
      filtered = filtered.filter((t) => t.category.id === filters.categoryId);
    }
    if (filters.accountId) {
      filtered = filtered.filter((t) => t.account?.id === filters.accountId);
    }
    if (filters.creditCardId) {
      filtered = filtered.filter((t) => t.creditCard?.id === filters.creditCardId);
    }
    if (filters.q) {
      const q = filters.q.toLowerCase();
      filtered = filtered.filter((t) => t.description.toLowerCase().includes(q));
    }
    if (filters.from) filtered = filtered.filter(t => t.date >= filters.from!);
    if (filters.to) filtered = filtered.filter(t => t.date <= filters.to!);

    const page = filters.page ?? 0;
    const size = filters.size ?? 20;
    const start = page * size;
    const paginated = filtered.slice(start, start + size);

    return {
      content: paginated,
      page,
      size,
      totalElements: filtered.length,
      totalPages: Math.ceil(filtered.length / size),
    };
  }

  return apiFetch<Page<Transaction>>("/transactions", {
    params: filters as Record<string, string | number | boolean | undefined | null>,
  });
}

/**
 * Cria uma nova transação financeira (receita ou despesa).
 * // POST /transactions
 */
export async function createTransaction(data: TransactionRequest): Promise<Transaction> {
  if (USE_MOCK) {
    await simulateNetworkDelay(450);
    const category = mockCategories.find((c) => c.id === data.categoryId) || mockCategories[0];
    const newTx: Transaction = {
      id: Date.now(),
      type: data.type,
      amount: data.amount ?? 0,
      date: data.date,
      description: data.description || "Sem descrição",
      notes: data.notes || null,
      category,
      account: data.accountId ? { id: data.accountId, name: "Conta Principal" } : null,
      creditCard: data.creditCardId ? { id: data.creditCardId, name: "Cartão Violeta" } : null,
      invoiceReference: data.creditCardId ? data.date.slice(0, 7) : null,
      installment:
        data.installments && data.installments > 1
          ? { groupId: `inst-${Date.now()}`, number: 1, total: data.installments }
          : null,
    };
    currentTransactions = [newTx, ...currentTransactions];
    return newTx;
  }

  return apiFetch<Transaction>("/transactions", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Atualiza um lançamento existente.
 * // PUT /transactions/{id}
 */
export async function updateTransaction(
  id: number,
  data: TransactionRequest
): Promise<Transaction> {
  if (USE_MOCK) {
    await simulateNetworkDelay(400);
    const index = currentTransactions.findIndex((t) => t.id === id);
    if (index === -1) {
      throw new Error(`Transação #${id} não encontrada.`);
    }
    const existing = currentTransactions[index];
    const category = data.categoryId
      ? mockCategories.find((c) => c.id === data.categoryId) || existing.category
      : existing.category;

    const updated: Transaction = {
      ...existing,
      type: data.type ?? existing.type,
      amount: data.amount ?? existing.amount,
      date: data.date ?? existing.date,
      description: data.description ?? existing.description,
      notes: data.notes !== undefined ? data.notes : existing.notes,
      category,
    };
    currentTransactions[index] = updated;
    return updated;
  }

  return apiFetch<Transaction>(`/transactions/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/**
 * Exclui um lançamento financeiro.
 * // DELETE /transactions/{id}
 */
export async function deleteTransaction(id: number): Promise<void> {
  if (USE_MOCK) {
    await simulateNetworkDelay(350);
    currentTransactions = currentTransactions.filter((t) => t.id !== id);
    return;
  }

  return apiFetch<void>(`/transactions/${id}`, {
    method: "DELETE",
  });
}

