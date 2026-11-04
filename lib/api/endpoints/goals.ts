import { apiFetch } from "@/lib/api/client";
import { simulateNetworkDelay, USE_MOCK } from "@/lib/config";
import { mockGoals } from "@/lib/mock-data";
import type { Goal } from "@/types";

/**
 * Retorna as metas financeiras com status de progresso calculado.
 * // GET /goals
 */
export async function listGoals(type?: string, status?: string): Promise<Goal[]> {
  if (USE_MOCK) {
    await simulateNetworkDelay(350);
    let filtered = [...mockGoals];
    if (type) {
      filtered = filtered.filter((g) => g.type === type);
    }
    if (status) {
      filtered = filtered.filter((g) => g.status === status);
    }
    return filtered;
  }

  return apiFetch<Goal[]>("/goals", {
    params: { type, status },
  });
}

