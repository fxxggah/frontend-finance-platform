'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getMe, logout } from '@/lib/api/endpoints/auth';
import { queryKeys } from '@/lib/query/keys';

export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: getMe,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return async () => {
    try {
      await logout();
    } finally {
      await queryClient.cancelQueries();
      queryClient.clear();
    }
  };
}
