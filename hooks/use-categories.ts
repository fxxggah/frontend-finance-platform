'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/keys';
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '@/lib/api/endpoints/categories';
import type { CategoryRequest, CategoryUpdateRequest, TransactionType } from '@/types';

/** Hook para listar categorias, opcionalmente filtradas por tipo. */
export function useCategories(type?: TransactionType) {
  return useQuery({
    queryKey: queryKeys.categories.list(type),
    queryFn: () => listCategories(type),
    staleTime: 5 * 60 * 1000,
  });
}

/** Hook para criar uma nova categoria. */
export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CategoryRequest) => createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  });
}

/** Hook para atualizar uma categoria existente. */
export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CategoryUpdateRequest }) => updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  });
}

/** Hook para excluir (ou ocultar) uma categoria. */
export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  });
}
