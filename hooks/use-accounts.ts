'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/query/keys';
import {
  listAccounts,
  getAccount,
  createAccount,
  updateAccount,
  deleteAccount,
} from '@/lib/api/endpoints/accounts';
import type { AccountRequest } from '@/types';
import { ApiError } from '@/lib/api/errors';

export function useAccounts(includeArchived = false) {
  return useQuery({
    queryKey: queryKeys.accounts.list(includeArchived),
    queryFn: () => listAccounts(includeArchived),
    staleTime: 5 * 60 * 1000, // 5 minutos - dado estrutural
  });
}

export function useAccount(id: number) {
  return useQuery({
    queryKey: queryKeys.accounts.detail(id),
    queryFn: () => getAccount(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AccountRequest) => createAccount(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
      toast.success('Conta criada com sucesso!');
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError && error.status === 409) {
        toast.error('Você já tem uma conta com esse nome.');
      } else {
        toast.error('Erro ao criar conta.');
      }
    },
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: AccountRequest }) =>
      updateAccount(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
      toast.success('Conta atualizada com sucesso!');
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError && error.status === 409) {
        toast.error('Você já tem uma conta com esse nome.');
      } else {
        toast.error('Erro ao atualizar conta.');
      }
    },
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteAccount(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
      if (res.archived) {
        toast.info('Conta arquivada. O histórico e relatórios continuam preservados.');
      } else {
        toast.success('Conta excluída com sucesso.');
      }
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError && error.status === 422) {
        toast.error(error.detail || 'Não é possível excluir a última conta ativa.');
      } else {
        toast.error('Erro ao remover conta.');
      }
    },
  });
}
