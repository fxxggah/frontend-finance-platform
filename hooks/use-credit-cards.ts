'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/keys';
import { listCreditCards } from '@/lib/api/endpoints/credit-cards';

export function useCreditCards(includeArchived = false) {
  return useQuery({
    queryKey: queryKeys.creditCards.list(includeArchived),
    queryFn: () => listCreditCards(includeArchived),
    staleTime: 5 * 60 * 1000, // 5 minutos - dado estrutural
  });
}

