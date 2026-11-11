import { apiFetch } from "@/lib/api/client";
import { simulateNetworkDelay, USE_MOCK } from "@/lib/config";
import { mockCategories } from "@/lib/mock-data";
import { ApiError } from "@/lib/api/errors";
import type { Category, CategoryRequest, CategoryUpdateRequest, TransactionType } from "@/types";

/** Cópia local mutável para simular persistência no modo mock */
let localCategories = [...mockCategories];

/**
 * Retorna as categorias do usuário, opcionalmente filtradas por tipo.
 * GET /categories
 */
export async function listCategories(type?: TransactionType): Promise<Category[]> {
  if (USE_MOCK) {
    await simulateNetworkDelay(300);
    if (!type) return [...localCategories];
    return localCategories.filter((c) => c.type === type);
  }

  return apiFetch<Category[]>("/categories", { params: { type } });
}

/**
 * Cria uma nova categoria.
 * POST /categories
 */
export async function createCategory(data: CategoryRequest): Promise<Category> {
  if (USE_MOCK) {
    await simulateNetworkDelay(350);

    // Duplicidade de nome no mesmo tipo → 409
    const duplicate = localCategories.some(
      (c) =>
        c.type === data.type &&
        c.name.trim().toLowerCase() === data.name.trim().toLowerCase(),
    );
    if (duplicate) {
      throw new ApiError({
        status: 409,
        title: "Conflict",
        detail: "Já existe uma categoria com esse nome",
        errors: [{ field: "name", message: "Já existe uma categoria com esse nome" }],
      });
    }

    const newCategory: Category = {
      id: Math.max(...localCategories.map((c) => c.id), 0) + 1,
      name: data.name.trim(),
      type: data.type,
      color: data.color ?? "#5B3DF5",
      icon: data.icon ?? "tag",
    };
    localCategories.push(newCategory);
    return newCategory;
  }

  return apiFetch<Category>("/categories", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Atualiza uma categoria existente.
 * PUT /categories/{id}
 */
export async function updateCategory(id: number, data: CategoryUpdateRequest): Promise<Category> {
  if (USE_MOCK) {
    await simulateNetworkDelay(350);

    const index = localCategories.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new ApiError({
        status: 404,
        title: "Not Found",
        detail: "Categoria não encontrada",
      });
    }

    // Duplicidade de nome no mesmo tipo
    const duplicate = localCategories.some(
      (c) =>
        c.id !== id &&
        c.type === localCategories[index].type &&
        c.name.trim().toLowerCase() === data.name.trim().toLowerCase(),
    );
    if (duplicate) {
      throw new ApiError({
        status: 409,
        title: "Conflict",
        detail: "Já existe uma categoria com esse nome",
        errors: [{ field: "name", message: "Já existe uma categoria com esse nome" }],
      });
    }

    const updated: Category = { ...localCategories[index], ...data, name: data.name.trim() };
    localCategories[index] = updated;
    return updated;
  }

  return apiFetch<Category>(`/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/**
 * Exclui (ou oculta) uma categoria.
 * DELETE /categories/{id}
 */
export async function deleteCategory(id: number): Promise<void> {
  if (USE_MOCK) {
    await simulateNetworkDelay(300);

    const index = localCategories.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new ApiError({
        status: 404,
        title: "Not Found",
        detail: "Categoria não encontrada",
      });
    }

    // Categorias com id <= 8 têm transações → apenas ocultam (soft delete simulado)
    // Para o mock, simplesmente removemos da lista local
    localCategories = localCategories.filter((c) => c.id !== id);
    return;
  }

  await apiFetch<void>(`/categories/${id}`, { method: "DELETE" });
}
