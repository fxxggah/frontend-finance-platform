'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  Tag,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';

import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/hooks/use-categories';
import { CategoryIcon } from '@/components/icons/CategoryIcon';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ColorPicker } from '@/components/ui/color-picker';
import { IconPicker } from '@/components/ui/icon-picker';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ApiError } from '@/lib/api/errors';
import type { Category, TransactionType } from '@/types';

// ─── Schema de validação ───────────────────────────────────────────────────────

const categorySchema = z.object({
  name: z
    .string()
    .min(1, 'O nome é obrigatório')
    .max(60, 'O nome deve ter no máximo 60 caracteres'),
  type: z.enum(['INCOME', 'EXPENSE'], { required_error: 'Selecione o tipo' }),
  color: z.string().min(1, 'Selecione uma cor'),
  icon: z.string().min(1, 'Selecione um ícone'),
});

type CategoryForm = z.infer<typeof categorySchema>;

// ─── Categorias mockadas com transações (para bloquear edição de tipo) ─────────
// No cenário real, isso viria da API (ex: `hasTransactions: boolean`)
const CATEGORIES_WITH_TRANSACTIONS = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

// ─── Form Dialog ───────────────────────────────────────────────────────────────

interface CategoryFormDialogProps {
  open: boolean;
  onClose: () => void;
  editing: Category | null;
}

function CategoryFormDialog({ open, onClose, editing }: CategoryFormDialogProps) {
  const isEditing = editing !== null;
  const hasTransactions = isEditing && CATEGORIES_WITH_TRANSACTIONS.has(editing.id);

  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    reset,
    formState: { errors },
  } = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: editing?.name ?? '',
      type: editing?.type ?? 'EXPENSE',
      color: editing?.color ?? '#5B3DF5',
      icon: editing?.icon ?? 'tag',
    },
  });

  // Reseta o form quando o dialog abre/fecha ou o item de edição muda
  const watchedColor = watch('color');
  const watchedIcon = watch('icon');
  const watchedType = watch('type');

  function handleClose() {
    reset();
    onClose();
  }

  async function onSubmit(data: CategoryForm) {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: editing.id, data });
        toast.success('Categoria atualizada com sucesso!');
      } else {
        await createMutation.mutateAsync(data);
        toast.success('Categoria criada com sucesso!');
      }
      handleClose();
    } catch (err) {
      if (err instanceof ApiError) {
        // Erro 409 → nome duplicado → reflete no campo
        const fieldError = err.getFieldError('name');
        if (fieldError) {
          setError('name', { message: fieldError });
          return;
        }
        toast.error(err.detail || 'Ocorreu um erro. Tente novamente.');
      } else {
        toast.error('Ocorreu um erro inesperado.');
      }
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="max-w-lg">
      <DialogHeader>
        <DialogTitle>{isEditing ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogBody className="space-y-5">
          {/* Preview visual */}
          <div className="flex items-center gap-3 rounded-2xl bg-surface-soft p-3">
            <span
              className="flex size-10 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${watchedColor}22`, color: watchedColor }}
              aria-hidden="true"
            >
              <CategoryIcon name={watchedIcon} size={20} />
            </span>
            <div>
              <p className="text-sm font-semibold text-text">
                {watch('name') || 'Nome da categoria'}
              </p>
              <p className="text-xs text-text-muted">
                {watchedType === 'INCOME' ? 'Receita' : 'Despesa'}
              </p>
            </div>
          </div>

          {/* Nome */}
          <Input
            label="Nome"
            placeholder="Ex: Alimentação"
            maxLength={60}
            error={errors.name?.message}
            {...register('name')}
          />

          {/* Tipo */}
          <div className="flex flex-col gap-1.5">
            <Select
              label="Tipo"
              disabled={hasTransactions}
              error={errors.type?.message}
              {...register('type')}
            >
              <option value="EXPENSE">Despesa</option>
              <option value="INCOME">Receita</option>
            </Select>
            {hasTransactions && (
              <p className="flex items-center gap-1.5 text-xs text-text-muted">
                <Info size={12} aria-hidden="true" />
                O tipo não pode mudar porque já existem transações nessa categoria
              </p>
            )}
          </div>

          {/* Cor */}
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-text">Cor</p>
            <ColorPicker
              value={watchedColor}
              onChange={(c) => setValue('color', c, { shouldValidate: true })}
            />
            {errors.color && (
              <p role="alert" className="text-xs font-medium text-expense">
                {errors.color.message}
              </p>
            )}
          </div>

          {/* Ícone */}
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-text">Ícone</p>
            <IconPicker
              value={watchedIcon}
              color={watchedColor}
              onChange={(icon) => setValue('icon', icon, { shouldValidate: true })}
            />
            {errors.icon && (
              <p role="alert" className="text-xs font-medium text-expense">
                {errors.icon.message}
              </p>
            )}
          </div>
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" size="md" type="button" onClick={handleClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button variant="primary" size="md" type="submit" isLoading={isPending}>
            {isEditing ? 'Salvar alterações' : 'Criar categoria'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}

// ─── Item de categoria ─────────────────────────────────────────────────────────

interface CategoryItemProps {
  category: Category;
  onEdit: (cat: Category) => void;
  onDelete: (cat: Category) => void;
}

function CategoryItem({ category, onEdit, onDelete }: CategoryItemProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 transition-colors hover:bg-surface-soft/50">
      {/* Ícone */}
      <span
        className="flex size-10 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${category.color}22`, color: category.color }}
        aria-hidden="true"
      >
        <CategoryIcon name={category.icon} size={18} />
      </span>

      {/* Nome */}
      <span className="flex-1 text-sm font-medium text-text">{category.name}</span>

      {/* Menu de ações */}
      <div className="relative">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Ações para ${category.name}`}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <MoreVertical size={16} />
        </Button>

        {menuOpen && (
          <>
            {/* Overlay para fechar o menu */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setMenuOpen(false)}
              aria-hidden="true"
            />
            <div className="absolute right-0 top-full z-20 mt-1 min-w-[150px] rounded-2xl border border-border bg-surface py-1 shadow-[0_8px_30px_-12px_rgba(20,23,46,0.18)]">
              <button
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-text hover:bg-surface-soft transition-colors"
                onClick={() => { setMenuOpen(false); onEdit(category); }}
              >
                <Pencil size={14} aria-hidden="true" /> Editar
              </button>
              <button
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-expense hover:bg-expense-soft transition-colors"
                onClick={() => { setMenuOpen(false); onDelete(category); }}
              >
                <Trash2 size={14} aria-hidden="true" /> Excluir
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Lista de categorias ───────────────────────────────────────────────────────

interface CategoryListProps {
  type: TransactionType;
  onEdit: (cat: Category) => void;
  onDelete: (cat: Category) => void;
}

function CategoryList({ type, onEdit, onDelete }: CategoryListProps) {
  const { data: categories, isLoading, isError } = useCategories(type);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        icon={Tag}
        title="Erro ao carregar categorias"
        description="Não foi possível buscar as categorias. Tente novamente."
      />
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <EmptyState
        icon={Tag}
        title="Nenhuma categoria encontrada"
        description={`Crie sua primeira categoria de ${type === 'INCOME' ? 'receita' : 'despesa'}.`}
      />
    );
  }

  return (
    <div className="space-y-2">
      {categories.map((cat) => (
        <CategoryItem key={cat.id} category={cat} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function CategoriesPage() {
  const [activeTab, setActiveTab] = useState<TransactionType>('EXPENSE');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  const deleteMutation = useDeleteCategory();

  function handleOpenCreate() {
    setEditingCategory(null);
    setDialogOpen(true);
  }

  function handleOpenEdit(cat: Category) {
    setEditingCategory(cat);
    setDialogOpen(true);
  }

  function handleOpenDelete(cat: Category) {
    setDeletingCategory(cat);
  }

  async function handleConfirmDelete() {
    if (!deletingCategory) return;
    try {
      await deleteMutation.mutateAsync(deletingCategory.id);
      toast.success('Categoria excluída. O histórico de transações foi preservado.');
      setDeletingCategory(null);
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.detail || 'Não foi possível excluir a categoria.');
      } else {
        toast.error('Ocorreu um erro inesperado.');
      }
    }
  }

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-4 pb-24 lg:p-8 lg:pb-8">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-primary-soft">
            <Tag size={20} className="text-primary" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-text">Categorias</h1>
            <p className="text-sm text-text-muted">Organize suas receitas e despesas</p>
          </div>
        </div>

        <Button variant="primary" size="md" onClick={handleOpenCreate}>
          <Plus size={16} />
          Nova categoria
        </Button>
      </div>

      {/* Abas */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TransactionType)}>
        <TabsList variant="pill">
          <TabsTrigger value="EXPENSE">Despesas</TabsTrigger>
          <TabsTrigger value="INCOME">Receitas</TabsTrigger>
        </TabsList>

        <TabsContent value="EXPENSE" className="pt-4">
          <CategoryList type="EXPENSE" onEdit={handleOpenEdit} onDelete={handleOpenDelete} />
        </TabsContent>

        <TabsContent value="INCOME" className="pt-4">
          <CategoryList type="INCOME" onEdit={handleOpenEdit} onDelete={handleOpenDelete} />
        </TabsContent>
      </Tabs>

      {/* Dialog de criação/edição */}
      <CategoryFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        editing={editingCategory}
      />

      {/* Dialog de confirmação de exclusão */}
      <ConfirmDialog
        open={deletingCategory !== null}
        onOpenChange={(open) => { if (!open) setDeletingCategory(null); }}
        onConfirm={handleConfirmDelete}
        title="Excluir categoria"
        description='Categorias com transações ficam ocultas para novos lançamentos, mas o histórico continua mostrando o nome. Deseja continuar?'
        confirmLabel="Excluir"
        isPending={deleteMutation.isPending}
      />
    </main>
  );
}
