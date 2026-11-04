import { apiFetch } from "@/lib/api/client";
import { simulateNetworkDelay, USE_MOCK } from "@/lib/config";
import { mockAccounts, mockTransfers } from "@/lib/mock-data";
import type { Page, Transfer, TransferFilterParams, TransferRequest } from "@/types";

let currentTransfers = [...mockTransfers];

/**
 * Lista transferências paginadas entre contas bancárias.
 * // GET /transfers
 */
export async function listTransfers(filters: TransferFilterParams = {}): Promise<Page<Transfer>> {
  if (USE_MOCK) {
    await simulateNetworkDelay(350);

    let filtered = [...currentTransfers];
    if (filters.accountId) {
      filtered = filtered.filter(
        (t) => t.fromAccount.id === filters.accountId || t.toAccount.id === filters.accountId
      );
    }
    if (filters.from) {
      filtered = filtered.filter((t) => t.date >= filters.from!);
    }
    if (filters.to) {
      filtered = filtered.filter((t) => t.date <= filters.to!);
    }

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

  return apiFetch<Page<Transfer>>("/transfers", {
    params: filters as Record<string, string | number | boolean | undefined | null>,
  });
}

/**
 * Cria uma nova transferência entre duas contas.
 * // POST /transfers
 */
export async function createTransfer(data: TransferRequest): Promise<Transfer> {
  if (USE_MOCK) {
    await simulateNetworkDelay(450);
    const from = mockAccounts.find((a) => a.id === data.fromAccountId) || mockAccounts[0];
    const to = mockAccounts.find((a) => a.id === data.toAccountId) || mockAccounts[1];

    const newTransfer: Transfer = {
      id: Date.now(),
      fromAccount: { id: from.id, name: from.name },
      toAccount: { id: to.id, name: to.name },
      amount: data.amount,
      date: data.date,
      description: data.description || null,
    };

    currentTransfers = [newTransfer, ...currentTransfers];
    return newTransfer;
  }

  return apiFetch<Transfer>("/transfers", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Atualiza os dados de uma transferência existente.
 * // PUT /transfers/{id}
 */
export async function updateTransfer(
  id: number,
  data: Partial<TransferRequest>
): Promise<Transfer> {
  if (USE_MOCK) {
    await simulateNetworkDelay(400);
    const index = currentTransfers.findIndex((t) => t.id === id);
    if (index === -1) {
      throw new Error(`Transferência #${id} não encontrada.`);
    }

    const existing = currentTransfers[index];
    const updated: Transfer = {
      ...existing,
      amount: data.amount ?? existing.amount,
      date: data.date ?? existing.date,
      description: data.description !== undefined ? data.description : existing.description,
    };

    currentTransfers[index] = updated;
    return updated;
  }

  return apiFetch<Transfer>(`/transfers/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/**
 * Exclui uma transferência financeira.
 * // DELETE /transfers/{id}
 */
export async function deleteTransfer(id: number): Promise<void> {
  if (USE_MOCK) {
    await simulateNetworkDelay(300);
    currentTransfers = currentTransfers.filter((t) => t.id !== id);
    return;
  }

  return apiFetch<void>(`/transfers/${id}`, {
    method: "DELETE",
  });
}

