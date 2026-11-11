'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/keys';
import { listAccounts } from '@/lib/api/endpoints/accounts';

export function useAccounts(includeArchived = false) {
  return useQuery({
    queryKey: queryKeys.accounts.list(includeArchived),
    queryFn: () => listAccounts(includeArchived),
    staleTime: 5 * 60 * 1000, // 5 minutos - dado estrutural
  });
}
