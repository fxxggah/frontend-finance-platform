'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/query/keys';
import {
  listGoals,
  getGoal,
  createGoal,
  updateGoal,
  cancelGoal,
  deleteGoal,
  listGoalContributions,
  addGoalContribution,
  deleteGoalContribution,
} from '@/lib/api/endpoints/goals';
import type { GoalContributionRequest, GoalRequest } from '@/types';
import { ApiError } from '@/lib/api/errors';

export function useGoals(type?: string, status?: string) {
  return useQuery({
    queryKey: queryKeys.goals.list(type, status),
    queryFn: () => listGoals(type, status),
    staleTime: 5 * 60 * 1000,
  });
}

export function useGoal(id: number) {
  return useQuery({
    queryKey: queryKeys.goals.detail(id),
    queryFn: () => getGoal(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: GoalRequest) => createGoal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.all });
      toast.success('Meta criada com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao cadastrar meta.');
    },
  });
}

export function useUpdateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: GoalRequest }) =>
      updateGoal(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.detail(variables.id) });
      toast.success('Meta atualizada com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao atualizar meta.');
    },
  });
}

export function useCancelGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => cancelGoal(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.detail(id) });
      toast.info('Meta cancelada.');
    },
    onError: () => {
      toast.error('Erro ao cancelar meta.');
    },
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteGoal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.all });
      toast.success('Meta excluída com sucesso.');
    },
    onError: () => {
      toast.error('Erro ao excluir meta.');
    },
  });
}

export function useGoalContributions(id: number) {
  return useQuery({
    queryKey: queryKeys.goals.contributions(id),
    queryFn: () => listGoalContributions(id),
    enabled: !!id,
    staleTime: 60 * 1000,
  });
}

export function useAddGoalContribution(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: GoalContributionRequest) => addGoalContribution(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.contributions(id) });
      toast.success('Contribuição adicionada com sucesso!');
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError && error.detail) {
        toast.error(error.detail);
      } else {
        toast.error('Erro ao registrar contribuição.');
      }
    },
  });
}

export function useDeleteGoalContribution(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (contributionId: number) => deleteGoalContribution(id, contributionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.contributions(id) });
      toast.success('Contribuição removida com sucesso.');
    },
    onError: () => {
      toast.error('Erro ao remover contribuição.');
    },
  });
}
