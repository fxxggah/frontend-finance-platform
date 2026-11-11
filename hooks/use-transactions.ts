'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/query/keys';
import {
  listTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from '@/lib/api/endpoints/transactions';
import type { TransactionFilterParams, TransactionRequest } from '@/types';
import { ApiError } from '@/lib/api/errors';

const STALE_TIME = 30 * 1000;

/**
 * Lista paginada de transações com suporte a filtros.
 */
export function useTransactions(filters: TransactionFilterParams = {}, enabled = true) {
  return useQuery({
    queryKey: queryKeys.transactions.list(filters as Record<string, unknown>),
    queryFn: () => listTransactions(filters),
    enabled,
    staleTime: STALE_TIME,
  });
}

/**
 * Invalidação cruzada após mutações em transações.
 * Invalida: transactions, dashboard (summary + expenses + recent), accounts, credit-cards, goals.
 */
function useInvalidateAfterTransaction() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.creditCards.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.goals.all });
  };
}

/**
 * Mutation para criar uma nova transação.
 */
export function useCreateTransaction() {
  const invalidate = useInvalidateAfterTransaction();

  return useMutation({
    mutationFn: (data: TransactionRequest) => createTransaction(data),
    onSuccess: () => {
      invalidate();
      toast.success('Transação registrada com sucesso!');
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError && error.status === 422) {
        toast.error(error.detail || 'Não foi possível registrar a transação.');
      } else {
        toast.error('Erro inesperado ao registrar transação.');
      }
    },
  });
}

/**
 * Mutation para atualizar uma transação existente.
 */
export function useUpdateTransaction() {
  const invalidate = useInvalidateAfterTransaction();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: TransactionRequest }) =>
      updateTransaction(id, data),
    onSuccess: () => {
      invalidate();
      toast.success('Transação atualizada com sucesso!');
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError && error.status === 422) {
        toast.error(error.detail || 'Não foi possível atualizar a transação.');
      } else {
        toast.error('Erro inesperado ao atualizar transação.');
      }
    },
  });
}

/**
 * Mutation para excluir uma transação.
 */
export function useDeleteTransaction() {
  const invalidate = useInvalidateAfterTransaction();

  return useMutation({
    mutationFn: (id: number) => deleteTransaction(id),
    onSuccess: () => {
      invalidate();
      toast.success('Transação excluída.');
    },
    onError: () => {
      toast.error('Erro ao excluir a transação.');
    },
  });
}
