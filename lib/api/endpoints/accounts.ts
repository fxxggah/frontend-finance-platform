import { apiFetch } from "@/lib/api/client";
import { simulateNetworkDelay, USE_MOCK } from "@/lib/config";
import { mockAccountsResponse } from "@/lib/mock-data";
import type { AccountsResponse } from "@/types";

/**
 * Retorna a lista de contas financeiras com totalizadores consolidados.
 * // GET /accounts
 */
export async function listAccounts(includeArchived = false): Promise<AccountsResponse> {
  if (USE_MOCK) {
    await simulateNetworkDelay(350);
    if (includeArchived) {
      return mockAccountsResponse;
    }
    return {
      ...mockAccountsResponse,
      accounts: mockAccountsResponse.accounts.filter((a) => !a.archived),
    };
  }

  return apiFetch<AccountsResponse>("/accounts", {
    params: { includeArchived },
  });
}

