import { apiFetch } from "@/lib/api/client";
import { simulateNetworkDelay, USE_MOCK } from "@/lib/config";
import { mockAccounts, mockAccountsResponse } from "@/lib/mock-data";
import { ApiError } from "@/lib/api/errors";
import type { Account, AccountDeleteResponse, AccountRequest, AccountsResponse } from "@/types";

let localAccounts = [...mockAccounts];

/**
 * Retorna a lista de contas financeiras com totalizadores consolidados.
 * GET /api/v1/accounts
 */
export async function listAccounts(includeArchived = false): Promise<AccountsResponse> {
  if (USE_MOCK) {
    await simulateNetworkDelay(250);
    const active = localAccounts.filter((a) => !a.archived);
    const totalBalance = active.reduce((sum, a) => sum + a.balance, 0);
    return {
      accounts: includeArchived ? localAccounts : active,
      totalBalance,
      creditCardDebt: mockAccountsResponse.creditCardDebt,
    };
  }

  return apiFetch<AccountsResponse>("/accounts", {
    params: { includeArchived },
  });
}

/**
 * Retorna uma conta por ID.
 * GET /api/v1/accounts/{id}
 */
export async function getAccount(id: number): Promise<Account> {
  if (USE_MOCK) {
    await simulateNetworkDelay(200);
    const acc = localAccounts.find((a) => a.id === id);
    if (!acc) {
      throw new ApiError({
        status: 404,
        title: "Not Found",
        detail: "Conta não encontrada",
      });
    }
    return acc;
  }

  return apiFetch<Account>(`/accounts/${id}`);
}

/**
 * Cria uma nova conta bancária ou carteira.
 * POST /api/v1/accounts
 */
export async function createAccount(data: AccountRequest): Promise<Account> {
  if (USE_MOCK) {
    await simulateNetworkDelay(300);
    // Verifica duplicidade de nome
    const exists = localAccounts.some(
      (a) => a.name.trim().toLowerCase() === data.name.trim().toLowerCase()
    );
    if (exists) {
      throw new ApiError({
        status: 409,
        title: "Conflict",
        detail: "Já existe uma conta com o nome informado",
      });
    }

    const newAccount: Account = {
      id: Math.max(...localAccounts.map((a) => a.id), 0) + 1,
      name: data.name,
      type: data.type,
      balance: data.initialBalance ?? 0,
      color: data.color || "#5B3DF5",
      icon: data.icon || "landmark",
      archived: false,
    };
    localAccounts.push(newAccount);
    return newAccount;
  }

  return apiFetch<Account>("/accounts", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Atualiza propriedades de uma conta existente.
 * PUT /api/v1/accounts/{id}
 */
export async function updateAccount(id: number, data: AccountRequest): Promise<Account> {
  if (USE_MOCK) {
    await simulateNetworkDelay(300);
    const index = localAccounts.findIndex((a) => a.id === id);
    if (index === -1) {
      throw new ApiError({
        status: 404,
        title: "Not Found",
        detail: "Conta não encontrada",
      });
    }

    const duplicate = localAccounts.some(
      (a) => a.id !== id && a.name.trim().toLowerCase() === data.name.trim().toLowerCase()
    );
    if (duplicate) {
      throw new ApiError({
        status: 409,
        title: "Conflict",
        detail: "Já existe uma conta com o nome informado",
      });
    }

    const current = localAccounts[index];
    const updated: Account = {
      ...current,
      name: data.name,
      type: data.type,
      balance: data.initialBalance !== undefined ? data.initialBalance : current.balance,
      color: data.color || current.color,
      icon: data.icon || current.icon,
    };
    localAccounts[index] = updated;
    return updated;
  }

  return apiFetch<Account>(`/accounts/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/**
 * Exclui ou arquiva uma conta.
 * DELETE /api/v1/accounts/{id}
 */
export async function deleteAccount(id: number): Promise<AccountDeleteResponse> {
  if (USE_MOCK) {
    await simulateNetworkDelay(300);
    const activeCount = localAccounts.filter((a) => !a.archived).length;
    const target = localAccounts.find((a) => a.id === id);
    if (!target) {
      throw new ApiError({
        status: 404,
        title: "Not Found",
        detail: "Conta não encontrada",
      });
    }

    if (!target.archived && activeCount <= 1) {
      throw new ApiError({
        status: 422,
        title: "Unprocessable Content",
        detail: "Não é possível excluir a última conta ativa do usuário",
      });
    }

    // Contas com histórico (id 1, 2, 3) arquivam, outras deletam
    const hasMovements = target.id <= 3;
    if (hasMovements) {
      target.archived = true;
      return { archived: true };
    } else {
      localAccounts = localAccounts.filter((a) => a.id !== id);
      return { archived: false };
    }
  }

  return apiFetch<AccountDeleteResponse>(`/accounts/${id}`, {
    method: "DELETE",
  });
}
