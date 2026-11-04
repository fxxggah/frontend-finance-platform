import { apiFetch } from "@/lib/api/client";
import { simulateNetworkDelay, USE_MOCK } from "@/lib/config";
import { mockCategories } from "@/lib/mock-data";
import type { Category, TransactionType } from "@/types";

/**
 * Retorna as categorias do usuário, opcionalmente filtradas por tipo (INCOME ou EXPENSE).
 * // GET /categories
 */
export async function listCategories(type?: TransactionType): Promise<Category[]> {
  if (USE_MOCK) {
    await simulateNetworkDelay(300);
    if (!type) {
      return mockCategories;
    }
    return mockCategories.filter((c) => c.type === type);
  }

  return apiFetch<Category[]>("/categories", {
    params: { type },
  });
}

