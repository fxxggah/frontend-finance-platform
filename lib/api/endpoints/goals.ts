import { apiFetch } from "@/lib/api/client";
import { simulateNetworkDelay, USE_MOCK } from "@/lib/config";
import { mockGoalContributions, mockGoals } from "@/lib/mock-data";
import { ApiError } from "@/lib/api/errors";
import type { Goal, GoalContribution, GoalContributionRequest, GoalRequest } from "@/types";

let localGoals = [...mockGoals];
let localContributions = { ...mockGoalContributions };

/**
 * Retorna as metas financeiras com status de progresso calculado.
 * GET /api/v1/goals
 */
export async function listGoals(type?: string, status?: string): Promise<Goal[]> {
  if (USE_MOCK) {
    await simulateNetworkDelay(250);
    let filtered = [...localGoals];
    if (type && type !== "ALL") {
      filtered = filtered.filter((g) => g.type === type);
    }
    if (status) {
      filtered = filtered.filter((g) => g.status === status);
    }
    return filtered;
  }

  return apiFetch<Goal[]>("/goals", {
    params: { type: type === "ALL" ? undefined : type, status },
  });
}

/**
 * Retorna uma meta específica por ID.
 * GET /api/v1/goals/{id}
 */
export async function getGoal(id: number): Promise<Goal> {
  if (USE_MOCK) {
    await simulateNetworkDelay(200);
    const goal = localGoals.find((g) => g.id === id);
    if (!goal) {
      throw new ApiError({
        status: 404,
        title: "Not Found",
        detail: "Meta não encontrada",
      });
    }
    return goal;
  }

  return apiFetch<Goal>(`/goals/${id}`);
}

/**
 * Registra uma nova meta financeira.
 * POST /api/v1/goals
 */
export async function createGoal(data: GoalRequest): Promise<Goal> {
  if (USE_MOCK) {
    await simulateNetworkDelay(300);
    const id = Math.max(...localGoals.map((g) => g.id), 0) + 1;
    const newGoal: Goal = {
      id,
      type: data.type,
      name: data.name,
      description: data.description || null,
      icon: data.icon || (data.type === "SAVINGS" ? "shield-check" : "target"),
      color: data.color || (data.type === "SAVINGS" ? "#10B981" : "#5B3DF5"),
      targetAmount: data.targetAmount,
      currentAmount: 0,
      percentage: 0,
      state: "IN_PROGRESS",
      status: "ACTIVE",
      category: data.categoryId ? { id: data.categoryId, name: "Categoria" } : null,
      startDate: data.startDate || "2026-10-01",
      endDate: data.endDate || null,
      monthlyNeeded:
        data.type === "SAVINGS" && data.endDate ? Number((data.targetAmount / 12).toFixed(2)) : null,
      supportText:
        data.type === "SAVINGS"
          ? "Economia planejada"
          : data.type === "EXPENSE"
          ? "Restam 100% do limite"
          : "Meta de ganhos",
    };
    localGoals.push(newGoal);
    return newGoal;
  }

  return apiFetch<Goal>("/goals", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Atualiza uma meta existente.
 * PUT /api/v1/goals/{id}
 */
export async function updateGoal(id: number, data: GoalRequest): Promise<Goal> {
  if (USE_MOCK) {
    await simulateNetworkDelay(300);
    const index = localGoals.findIndex((g) => g.id === id);
    if (index === -1) {
      throw new ApiError({
        status: 404,
        title: "Not Found",
        detail: "Meta não encontrada",
      });
    }

    const current = localGoals[index];
    const percentage = Number(((current.currentAmount / data.targetAmount) * 100).toFixed(1));
    const updated: Goal = {
      ...current,
      name: data.name,
      targetAmount: data.targetAmount,
      description: data.description || null,
      color: data.color || current.color,
      icon: data.icon || current.icon,
      startDate: data.startDate || current.startDate,
      endDate: data.endDate || current.endDate,
      percentage,
      category: data.categoryId ? { id: data.categoryId, name: current.category?.name || "Categoria" } : null,
    };
    localGoals[index] = updated;
    return updated;
  }

  return apiFetch<Goal>(`/goals/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/**
 * Cancela uma meta financeira.
 * PATCH /api/v1/goals/{id}/cancel
 */
export async function cancelGoal(id: number): Promise<void> {
  if (USE_MOCK) {
    await simulateNetworkDelay(250);
    const goal = localGoals.find((g) => g.id === id);
    if (goal) {
      goal.status = "CANCELLED";
    }
    return;
  }

  return apiFetch<void>(`/goals/${id}/cancel`, {
    method: "PATCH",
  });
}

/**
 * Exclui uma meta permanentemente e remove contribuições.
 * DELETE /api/v1/goals/{id}
 */
export async function deleteGoal(id: number): Promise<void> {
  if (USE_MOCK) {
    await simulateNetworkDelay(250);
    localGoals = localGoals.filter((g) => g.id !== id);
    delete localContributions[id];
    return;
  }

  return apiFetch<void>(`/goals/${id}`, {
    method: "DELETE",
  });
}

/**
 * Retorna as contribuições de uma meta de economia.
 * GET /api/v1/goals/{id}/contributions
 */
export async function listGoalContributions(id: number): Promise<GoalContribution[]> {
  if (USE_MOCK) {
    await simulateNetworkDelay(200);
    return localContributions[id] || [];
  }

  return apiFetch<GoalContribution[]>(`/goals/${id}/contributions`);
}

/**
 * Registra um aporte (positivo) ou retirada (negativo) em uma meta de economia.
 * POST /api/v1/goals/{id}/contributions
 */
export async function addGoalContribution(
  id: number,
  data: GoalContributionRequest
): Promise<Goal> {
  if (USE_MOCK) {
    await simulateNetworkDelay(300);
    const goal = localGoals.find((g) => g.id === id);
    if (!goal) {
      throw new ApiError({
        status: 404,
        title: "Not Found",
        detail: "Meta não encontrada",
      });
    }

    if (goal.status === "CANCELLED") {
      throw new ApiError({
        status: 422,
        title: "Unprocessable Content",
        detail: "Não é possível adicionar contribuição em meta cancelada",
      });
    }

    const nextAmount = goal.currentAmount + data.amount;
    if (nextAmount < 0) {
      throw new ApiError({
        status: 422,
        title: "Unprocessable Content",
        detail: "A retirada não pode deixar o saldo da meta negativo",
      });
    }

    goal.currentAmount = nextAmount;
    goal.percentage = Number(((goal.currentAmount / goal.targetAmount) * 100).toFixed(1));
    if (goal.percentage >= 100) {
      goal.state = "ACHIEVED";
    }

    if (!localContributions[id]) {
      localContributions[id] = [];
    }

    localContributions[id].unshift({
      id: Math.floor(Math.random() * 100000) + 10,
      amount: data.amount,
      date: data.date,
      notes: data.notes || null,
    });

    return goal;
  }

  return apiFetch<Goal>(`/goals/${id}/contributions`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Remove uma contribuição de uma meta.
 * DELETE /api/v1/goals/{id}/contributions/{contributionId}
 */
export async function deleteGoalContribution(
  id: number,
  contributionId: number
): Promise<void> {
  if (USE_MOCK) {
    await simulateNetworkDelay(250);
    const list = localContributions[id] || [];
    const item = list.find((c) => c.id === contributionId);
    if (item) {
      const goal = localGoals.find((g) => g.id === id);
      if (goal) {
        goal.currentAmount = Math.max(0, goal.currentAmount - item.amount);
        goal.percentage = Number(((goal.currentAmount / goal.targetAmount) * 100).toFixed(1));
      }
      localContributions[id] = list.filter((c) => c.id !== contributionId);
    }
    return;
  }

  return apiFetch<void>(`/goals/${id}/contributions/${contributionId}`, {
    method: "DELETE",
  });
}
