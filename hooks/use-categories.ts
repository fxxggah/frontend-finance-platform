'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/keys';
import { listCategories } from '@/lib/api/endpoints/categories';
import type { TransactionType } from '@/types';

export function useCategories(type?: TransactionType) {
  return useQuery({
    queryKey: queryKeys.categories.list(type),
    queryFn: () => listCategories(type),
    staleTime: 5 * 60 * 1000, // 5 minutos - dado estrutural
  });
}
