'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/query/keys';
import {
  listCreditCards,
  getCreditCard,
  createCreditCard,
  updateCreditCard,
  deleteCreditCard,
  listInvoices,
  getInvoiceDetail,
  payInvoice,
  deleteInvoicePayment,
} from '@/lib/api/endpoints/credit-cards';
import type { CreditCardRequest, InvoicePaymentRequest } from '@/types';
import { ApiError } from '@/lib/api/errors';

export function useCreditCards(includeArchived = false) {
  return useQuery({
    queryKey: queryKeys.creditCards.list(includeArchived),
    queryFn: () => listCreditCards(includeArchived),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreditCard(id: number) {
  return useQuery({
    queryKey: ['credit-cards', 'detail', id],
    queryFn: () => getCreditCard(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateCreditCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreditCardRequest) => createCreditCard(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.creditCards.all });
      toast.success('Cartão de crédito criado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao cadastrar cartão.');
    },
  });
}

export function useUpdateCreditCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CreditCardRequest }) =>
      updateCreditCard(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.creditCards.all });
      toast.success('Cartão atualizado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao atualizar cartão.');
    },
  });
}

export function useDeleteCreditCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteCreditCard(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.creditCards.all });
      if (res.archived) {
        toast.info('Cartão arquivado. O histórico e as faturas continuam preservados.');
      } else {
        toast.success('Cartão excluído com sucesso.');
      }
    },
    onError: () => {
      toast.error('Erro ao remover cartão.');
    },
  });
}

export function useInvoices(cardId: number) {
  return useQuery({
    queryKey: queryKeys.creditCards.invoices(cardId),
    queryFn: () => listInvoices(cardId),
    enabled: !!cardId,
    staleTime: 60 * 1000,
  });
}

export function useInvoiceDetail(cardId: number, ym: string) {
  return useQuery({
    queryKey: queryKeys.creditCards.invoiceDetail(cardId, ym),
    queryFn: () => getInvoiceDetail(cardId, ym),
    enabled: !!cardId && !!ym,
    staleTime: 30 * 1000,
  });
}

export function usePayInvoice(cardId: number, ym: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InvoicePaymentRequest) => payInvoice(cardId, ym, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.creditCards.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.creditCards.invoiceDetail(cardId, ym),
      });
      toast.success('Pagamento de fatura registrado com sucesso!');
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError && error.detail) {
        toast.error(error.detail);
      } else {
        toast.error('Erro ao registrar pagamento de fatura.');
      }
    },
  });
}

export function useDeleteInvoicePayment(cardId: number, ym: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (paymentId: number) => deleteInvoicePayment(cardId, ym, paymentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.creditCards.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.creditCards.invoiceDetail(cardId, ym),
      });
      toast.success('Pagamento estornado com sucesso.');
    },
    onError: () => {
      toast.error('Erro ao estornar pagamento.');
    },
  });
}
