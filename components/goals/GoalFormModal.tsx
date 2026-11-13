'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PiggyBank, TrendingUp, AlertTriangle, ArrowRight, ArrowLeft } from 'lucide-react';
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { formatMoneyInput, parseMoneyInput } from '@/lib/format/money';
import { Select } from '@/components/ui/select';
import { ColorPicker } from '@/components/ui/color-picker';
import { IconPicker } from '@/components/ui/icon-picker';
import { useCreateGoal, useUpdateGoal } from '@/hooks/use-goals';
import { useCategories } from '@/hooks/use-categories';
import { ApiError } from '@/lib/api/errors';
import { getToday } from '@/lib/format/date';
import { cn } from '@/lib/utils';
import type { Goal, GoalType } from '@/types';

const step2Schema = z
  .object({
    type: z.enum(['SAVINGS', 'INCOME', 'EXPENSE'] as const),
    name: z.string().min(1, 'O nome da meta é obrigatório').max(100, 'Máximo 100 caracteres'),
    targetAmount: z
      .string()
      .min(1, 'Informe o valor')
      .refine((v) => {
        const num = parseMoneyInput(v);
        return !isNaN(num) && num > 0;
      }, 'O valor deve ser maior que zero'),
    categoryId: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    color: z.string().min(1, 'Selecione uma cor'),
    icon: z.string().min(1, 'Selecione um ícone'),
    description: z.string().max(255).optional(),
  })
  .refine(
    (data) => {
      if (data.type === 'INCOME' || data.type === 'EXPENSE') {
        return !!data.startDate && !!data.endDate;
      }
      return true;
    },
    {
      message: 'Datas de início e fim são obrigatórias para metas de período',
      path: ['endDate'],
    }
  );

type FormData = z.infer<typeof step2Schema>;

interface GoalFormModalProps {
  open: boolean;
  onClose: () => void;
  goal?: Goal | null;
}

export function GoalFormModal({ open, onClose, goal }: GoalFormModalProps) {
  const isEditing = !!goal;
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedType, setSelectedType] = useState<GoalType>('SAVINGS');

  const createMutation = useCreateGoal();
  const updateMutation = useUpdateGoal();
  const { data: categories } = useCategories();

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      type: 'SAVINGS',
      name: '',
      targetAmount: '',
      categoryId: '',
      startDate: getToday(),
      endDate: '',
      color: '#10B981',
      icon: 'shield',
      description: '',
    },
  });

  const currentColor = watch('color');
  const currentIcon = watch('icon');

  useEffect(() => {
    if (!open) {
      setStep(1);
      reset();
      return;
    }

    if (goal) {
      setStep(2);
      setSelectedType(goal.type);
      reset({
        type: goal.type,
        name: goal.name,
        targetAmount: formatMoneyInput(goal.targetAmount),
        categoryId: goal.category ? String(goal.category.id) : '',
        startDate: goal.startDate || '',
        endDate: goal.endDate || '',
        color: goal.color || '#5B3DF5',
        icon: goal.icon || 'target',
        description: goal.description || '',
      });
    } else {
      setStep(1);
      setSelectedType('SAVINGS');
      reset({
        type: 'SAVINGS',
        name: '',
        targetAmount: '',
        categoryId: '',
        startDate: getToday(),
        endDate: '',
        color: '#10B981',
        icon: 'shield',
        description: '',
      });
    }
  }, [open, goal, reset]);

  function handleSelectType(type: GoalType) {
    setSelectedType(type);
    setValue('type', type);
    if (type === 'SAVINGS') {
      setValue('color', '#10B981');
      setValue('icon', 'piggy-bank');
      setValue('endDate', '');
    } else if (type === 'EXPENSE') {
      setValue('color', '#E11D48');
      setValue('icon', 'alert-triangle');
      setValue('startDate', getToday());
      setValue('endDate', '');
    } else {
      setValue('color', '#4F7BFF');
      setValue('icon', 'trending-up');
      setValue('startDate', getToday());
      setValue('endDate', '');
    }
    setStep(2);
  }

  async function onSubmit(data: FormData) {
    const target = parseMoneyInput(data.targetAmount);
    const catId = data.categoryId ? parseInt(data.categoryId, 10) : null;

    try {
    if (isEditing && goal) {
      await updateMutation.mutateAsync({
        id: goal.id,
        data: {
          type: goal.type,
          name: data.name,
          targetAmount: target,
          categoryId: catId,
          description: data.description || null,
          color: data.color,
          icon: data.icon,
          startDate: data.startDate || null,
          endDate: data.endDate || null,
        },
      });
    } else {
      await createMutation.mutateAsync({
        type: selectedType,
        name: data.name,
        targetAmount: target,
        categoryId: catId,
        description: data.description || null,
        color: data.color,
        icon: data.icon,
        startDate: data.startDate || null,
        endDate: data.endDate || null,
      });
    }
    onClose();
    } catch (error) {
      if (error instanceof ApiError) {
        for (const field of error.errors) {
          if (field.field in data) setError(field.field as keyof FormData, { message: field.message });
        }
      }
    }
  }

  const filteredCategories =
    categories?.filter((c) => {
      if (selectedType === 'EXPENSE') return c.type === 'EXPENSE';
      if (selectedType === 'INCOME') return c.type === 'INCOME';
      return true;
    }) ?? [];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="max-w-lg">
      <DialogHeader>
        <DialogTitle>
          {isEditing
            ? 'Editar Meta'
            : step === 1
            ? 'Nova Meta · Passo 1 de 2'
            : `Nova Meta · ${selectedType === 'SAVINGS' ? 'Economia' : selectedType === 'EXPENSE' ? 'Teto de Gasto' : 'Ganho'}`}
        </DialogTitle>
      </DialogHeader>

      {step === 1 && !isEditing ? (
        <div className="space-y-4">
          <DialogBody className="space-y-3">
            <p className="text-xs text-text-muted">
              Selecione o objetivo da sua meta financeira para configurarmos os cálculos adequados:
            </p>

            {/* Opção 1: SAVINGS */}
            <button
              type="button"
              onClick={() => handleSelectType('SAVINGS')}
              className="w-full text-left p-4 rounded-2xl border border-border bg-surface hover:border-income transition-all hover:shadow-md flex items-start gap-4 group"
            >
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-income-soft text-income group-hover:scale-105 transition-transform">
                <PiggyBank size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-text text-sm group-hover:text-income transition-colors">
                  Economia (Poupar / Reserva)
                </h3>
                <p className="mt-1 text-xs text-text-muted leading-relaxed">
                  Juntar dinheiro para sonhos, viagens ou reserva de emergência. Aceita aportes e retiradas manuais.
                </p>
              </div>
            </button>

            {/* Opção 2: EXPENSE */}
            <button
              type="button"
              onClick={() => handleSelectType('EXPENSE')}
              className="w-full text-left p-4 rounded-2xl border border-border bg-surface hover:border-expense transition-all hover:shadow-md flex items-start gap-4 group"
            >
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-expense-soft text-expense group-hover:scale-105 transition-transform">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-text text-sm group-hover:text-expense transition-colors">
                  Teto de Gasto (Orçamento)
                </h3>
                <p className="mt-1 text-xs text-text-muted leading-relaxed">
                  Definir um limite de gastos para categorias específicas. O sistema monitora o consumo automaticamente.
                </p>
              </div>
            </button>

            {/* Opção 3: INCOME */}
            <button
              type="button"
              onClick={() => handleSelectType('INCOME')}
              className="w-full text-left p-4 rounded-2xl border border-border bg-surface hover:border-primary transition-all hover:shadow-md flex items-start gap-4 group"
            >
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary group-hover:scale-105 transition-transform">
                <TrendingUp size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-text text-sm group-hover:text-primary transition-colors">
                  Meta de Ganho (Receita)
                </h3>
                <p className="mt-1 text-xs text-text-muted leading-relaxed">
                  Acompanhar metas de faturamento, freelances e receitas extras no período selecionado.
                </p>
              </div>
            </button>
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
          </DialogFooter>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <DialogBody className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            {/* Nome */}
            <div>
              <label htmlFor="goal-name" className="mb-1 block text-xs font-semibold text-text-muted">
                Nome da meta *
              </label>
              <Input
                id="goal-name"
                placeholder={
                  selectedType === 'SAVINGS'
                    ? 'Ex: Reserva de Emergência, Viagem para Disney'
                    : selectedType === 'EXPENSE'
                    ? 'Ex: Limite Restaurantes, Teto de Compras'
                    : 'Ex: Faturamento Freelances Outubro'
                }
                {...register('name')}
                error={errors.name?.message}
              />
            </div>

            {/* Valor Alvo ou Limite */}
            <div>
              <label htmlFor="goal-target" className="mb-1 block text-xs font-semibold text-text-muted">
                {selectedType === 'EXPENSE' ? 'Limite de gasto no período (R$) *' : 'Valor alvo (R$) *'}
              </label>
              <Controller
                name="targetAmount"
                control={control}
                render={({ field }) => (
                  <CurrencyInput
                    {...field}
                    value={field.value ?? ''}
                    onValueChange={field.onChange}
                    id="goal-target"
                    placeholder="0,00"
                    className="tabular-nums"
                    error={errors.targetAmount?.message}
                  />
                )}
              />
            </div>

            {/* Categoria vinculada (para EXPENSE ou INCOME) */}
            {selectedType !== 'SAVINGS' && (
              <div>
                <label htmlFor="goal-cat" className="mb-1 block text-xs font-semibold text-text-muted">
                  Categoria monitorada
                </label>
                <Select id="goal-cat" {...register('categoryId')} error={errors.categoryId?.message}>
                  <option value="">Todas as categorias</option>
                  {filteredCategories.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            {/* Datas de Período */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {selectedType !== 'SAVINGS' ? (
                <>
                  <div>
                    <label htmlFor="goal-start" className="mb-1 block text-xs font-semibold text-text-muted">
                      Data de início *
                    </label>
                    <Input id="goal-start" type="date" {...register('startDate')} error={errors.startDate?.message} />
                  </div>
                  <div>
                    <label htmlFor="goal-end" className="mb-1 block text-xs font-semibold text-text-muted">
                      Data de término *
                    </label>
                    <Input id="goal-end" type="date" {...register('endDate')} error={errors.endDate?.message} />
                  </div>
                </>
              ) : (
                <div className="sm:col-span-2">
                  <label htmlFor="goal-deadline" className="mb-1 block text-xs font-semibold text-text-muted">
                    Prazo final estimado (opcional)
                  </label>
                  <Input id="goal-deadline" type="date" {...register('endDate')} error={errors.endDate?.message} />
                  <p className="mt-1 text-[11px] text-text-muted">
                    Se preenchido, calcularemos a sugestão mensal de economia necessária.
                  </p>
                </div>
              )}
            </div>

            {/* Descrição */}
            <div>
              <label htmlFor="goal-desc" className="mb-1 block text-xs font-semibold text-text-muted">
                Observações / Descrição (opcional)
              </label>
              <Input id="goal-desc" placeholder="Ex: 6 meses de contas fixas guardados em CDB" {...register('description')} />
            </div>

            {/* Seletor de Cor */}
            <div>
              <label className="mb-2 block text-xs font-semibold text-text-muted">
                Cor de identificação
              </label>
              <ColorPicker value={currentColor} onChange={(c) => setValue('color', c, { shouldValidate: true })} />
            </div>

            {/* Seletor de Ícone */}
            <div>
              <label className="mb-2 block text-xs font-semibold text-text-muted">
                Ícone representativo
              </label>
              <IconPicker value={currentIcon} color={currentColor} onChange={(i) => setValue('icon', i, { shouldValidate: true })} />
            </div>
          </DialogBody>

          <DialogFooter>
            {!isEditing && (
              <Button type="button" variant="ghost" onClick={() => setStep(1)} className="gap-1 mr-auto">
                <ArrowLeft size={16} />
                <span>Voltar</span>
              </Button>
            )}
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="brand"
              disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
            >
              {isSubmitting || createMutation.isPending || updateMutation.isPending
                ? 'Salvando...'
                : isEditing
                ? 'Salvar Alterações'
                : 'Criar Meta'}
            </Button>
          </DialogFooter>
        </form>
      )}
    </Dialog>
  );
}

