'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/keys';
import { listGoals } from '@/lib/api/endpoints/goals';

export function useGoals(type?: string, status?: string) {
  return useQuery({
    queryKey: queryKeys.goals.list(type, status),
    queryFn: () => listGoals(type, status),
    staleTime: 5 * 60 * 1000,
  });
}

