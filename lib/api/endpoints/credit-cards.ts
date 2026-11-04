import { apiFetch } from "@/lib/api/client";
import { simulateNetworkDelay, USE_MOCK } from "@/lib/config";
import { mockCreditCards } from "@/lib/mock-data";
import type { CreditCard } from "@/types";

/**
 * Retorna os cartões de crédito cadastrados com limites e dados da fatura atual.
 * // GET /credit-cards
 */
export async function listCreditCards(includeArchived = false): Promise<CreditCard[]> {
  if (USE_MOCK) {
    await simulateNetworkDelay(350);
    if (includeArchived) {
      return mockCreditCards;
    }
    return mockCreditCards.filter((card) => !card.archived);
  }

  return apiFetch<CreditCard[]>("/credit-cards", {
    params: { includeArchived },
  });
}

