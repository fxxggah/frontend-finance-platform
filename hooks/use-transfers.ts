'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/query/keys';
import {
  listTransfers,
  createTransfer,
  deleteTransfer,
} from '@/lib/api/endpoints/transfers';
import type { TransferFilterParams, TransferRequest } from '@/types';
import { ApiError } from '@/lib/api/errors';

const STALE_TIME = 30 * 1000;

export function useTransfers(filters: TransferFilterParams = {}) {
  return useQuery({
    queryKey: queryKeys.transfers.list(filters as Record<string, unknown>),
    queryFn: () => listTransfers(filters),
    staleTime: STALE_TIME,
  });
}

export function useCreateTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TransferRequest) => createTransfer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transfers.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
      toast.success('Transferência realizada com sucesso!');
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError && error.status === 422) {
        toast.error(error.detail || 'Não foi possível realizar a transferência.');
      } else {
        toast.error('Erro ao realizar transferência.');
      }
    },
  });
}

export function useDeleteTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteTransfer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transfers.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
      toast.success('Transferência excluída.');
    },
    onError: () => {
      toast.error('Erro ao excluir a transferência.');
    },
  });
}
