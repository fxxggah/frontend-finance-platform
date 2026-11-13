'use client';

import { useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Minus, Plus } from 'lucide-react';
import { Sheet } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { formatMoneyInput, parseMoneyInput } from '@/lib/format/money';
import { Select } from '@/components/ui/select';
import { getToday } from '@/lib/format/date';
import { useCategories } from '@/hooks/use-categories';
import { useAccounts } from '@/hooks/use-accounts';
import { useCreditCards } from '@/hooks/use-credit-cards';
import { useCreateTransaction, useUpdateTransaction } from '@/hooks/use-transactions';
import type { Transaction, TransactionRequest, TransactionType } from '@/types';
import { ApiError } from '@/lib/api/errors';

const schema = z
  .object({
    type: z.enum(['INCOME', 'EXPENSE']),
    amount: z
      .string()
      .min(1, 'Informe o valor')
      .refine((v) => {
        const n = parseMoneyInput(v);
        return !isNaN(n) && n > 0;
      }, 'O valor deve ser maior que zero'),
    description: z.string().min(1, 'Informe a descrição').max(255),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
    categoryId: z.string().min(1, 'Selecione uma categoria'),
    notes: z.string().max(500).optional(),
    destinationType: z.enum(['account', 'card']),
    accountId: z.string().optional(),
    creditCardId: z.string().optional(),
    installments: z
      .number({ error: 'Informe um número inteiro de parcelas entre 1 e 24' })
      .int('Informe um número inteiro de parcelas')
      .min(1, 'Informe pelo menos 1 parcela')
      .max(24, 'O limite é de 24 parcelas'),
  })
  .superRefine((data, ctx) => {
    if (data.destinationType === 'account' && !data.accountId) {
      ctx.addIssue({ code: 'custom', message: 'Selecione uma conta', path: ['accountId'] });
    }
    if (data.destinationType === 'card') {
      if (!data.creditCardId) {
        ctx.addIssue({ code: 'custom', message: 'Selecione um cartão', path: ['creditCardId'] });
      }
      if (data.type !== 'EXPENSE') {
        ctx.addIssue({
          code: 'custom',
          message: 'Cartão de crédito aceita apenas despesas',
          path: ['type'],
        });
      }
    }
  });

type FormData = z.infer<typeof schema>;

interface TransactionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: TransactionType;
  editing?: Transaction | null;
}

export function TransactionForm({
  open,
  onOpenChange,
  defaultType = 'EXPENSE',
  editing,
}: TransactionFormProps) {
  const { data: categoriesData } = useCategories();
  const { data: accountsData } = useAccounts();
  const { data: cardsData } = useCreditCards();
  const createMutation = useCreateTransaction();
  const updateMutation = useUpdateTransaction();

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: defaultType,
      amount: '',
      description: '',
      date: getToday(),
      categoryId: '',
      notes: '',
      destinationType: 'account',
      accountId: '',
      creditCardId: '',
      installments: 1,
    },
  });

  const type = watch('type');
  const destinationType = watch('destinationType');
  const installments = watch('installments');

  // Preenche formulário ao abrir para edição ou reset para novo
  useEffect(() => {
    if (editing) {
      reset({
        type: editing.type,
        amount: formatMoneyInput(editing.amount),
        description: editing.description,
        date: editing.date,
        categoryId: String(editing.category.id),
        notes: editing.notes ?? '',
        destinationType: editing.creditCard ? 'card' : 'account',
        accountId: editing.account ? String(editing.account.id) : '',
        creditCardId: editing.creditCard ? String(editing.creditCard.id) : '',
        installments: editing.installment?.total ?? 1,
      });
    } else {
      reset({
        type: defaultType,
        amount: '',
        description: '',
        date: getToday(),
        categoryId: '',
        notes: '',
        destinationType: 'account',
        accountId: '',
        creditCardId: '',
        installments: 1,
      });
    }
  }, [editing, defaultType, open, reset]);

  // Se trocar para cartão, força despesa
  useEffect(() => {
    if (destinationType === 'card') {
      setValue('type', 'EXPENSE');
    }
  }, [destinationType, setValue]);

  const filteredCategories = useMemo(
    () => (categoriesData ?? []).filter((c) => c.type === type),
    [categoriesData, type]
  );

  function changeInstallments(delta: number) {
    const current = Number.isFinite(installments) ? Math.trunc(installments) : 1;
    setValue('installments', Math.min(24, Math.max(1, current + delta)), {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  async function onSubmit(data: FormData) {
    const payload: TransactionRequest = {
      type: data.type,
      amount: parseMoneyInput(data.amount),
      categoryId: parseInt(data.categoryId),
      date: data.date,
      description: data.description,
      notes: data.notes || null,
      accountId: data.destinationType === 'account' && data.accountId ? parseInt(data.accountId) : undefined,
      creditCardId: data.destinationType === 'card' && data.creditCardId ? parseInt(data.creditCardId) : undefined,
      installments: data.destinationType === 'card' ? data.installments : undefined,
    };

    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onOpenChange(false);
    } catch (error) {
      if (error instanceof ApiError && error.status === 400) {
        let shouldFocus = true;
        for (const fieldErr of error.errors) {
          const field = schema.keyof().safeParse(fieldErr.field);
          if (field.success) {
            setError(field.data, { type: 'server', message: fieldErr.message }, { shouldFocus });
            shouldFocus = false;
          }
        }
      }
      setError('root.submit', {
        type: 'server',
        message: error instanceof ApiError
          ? error.detail || 'Não foi possível salvar a transação. Revise os dados e tente novamente.'
          : 'Não foi possível salvar a transação. Tente novamente.',
      });
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Sheet
      desktopDialog
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? 'Editar transação' : 'Nova transação'}
    >
      <form
        onSubmit={handleSubmit(onSubmit, () => {
          setError('root.submit', { type: 'validation', message: 'Revise os campos indicados para registrar a transação.' });
        })}
        className="space-y-4"
        noValidate
      >
        {/* Tipo: Despesa / Receita */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-text-muted">Tipo</label>
          <div className="grid grid-cols-2 gap-2">
            {(['EXPENSE', 'INCOME'] as const).map((t) => (
              <button
                key={t}
                type="button"
                disabled={destinationType === 'card' && t === 'INCOME'}
                onClick={() => {
                  setValue('type', t);
                  setValue('categoryId', '');
                }}
                className={`rounded-2xl py-3 text-sm font-bold transition ${
                  type === t
                    ? t === 'INCOME'
                      ? 'bg-income text-white'
                      : 'bg-expense text-white'
                    : 'bg-surface-soft text-text-muted hover:bg-surface-soft/70'
                } disabled:opacity-40`}
              >
                {t === 'INCOME' ? '+ Receita' : '− Despesa'}
              </button>
            ))}
          </div>
          {errors.type && <p className="mt-1 text-xs text-expense">{errors.type.message}</p>}
        </div>

        {/* Valor */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-text-muted" htmlFor="amount">
            Valor (R$)
          </label>
          <Controller
            name="amount"
            control={control}
            render={({ field }) => (
              <CurrencyInput
                {...field}
                value={field.value ?? ''}
                onValueChange={field.onChange}
                id="amount"
                placeholder="0,00"
                className="tabular-nums text-lg font-bold"
                aria-invalid={!!errors.amount}
              />
            )}
          />
          {errors.amount && <p className="mt-1 text-xs text-expense">{errors.amount.message}</p>}
        </div>

        {/* Descrição */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-text-muted" htmlFor="description">
            Descrição
          </label>
          <Input
            id="description"
            placeholder="Ex: Supermercado, Salário..."
            {...register('description')}
            aria-invalid={!!errors.description}
          />
          {errors.description && (
            <p className="mt-1 text-xs text-expense">{errors.description.message}</p>
          )}
        </div>

        {/* Data */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-text-muted" htmlFor="date">
            Data
          </label>
          <Input id="date" type="date" {...register('date')} aria-invalid={!!errors.date} />
          {errors.date && <p className="mt-1 text-xs text-expense">{errors.date.message}</p>}
        </div>

        {/* Categoria */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-text-muted" htmlFor="categoryId">
            Categoria
          </label>
          <Select id="categoryId" {...register('categoryId')} aria-invalid={!!errors.categoryId}>
            <option value="">Selecione uma categoria</option>
            {filteredCategories.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.name}
              </option>
            ))}
          </Select>
          {errors.categoryId && (
            <p className="mt-1 text-xs text-expense">{errors.categoryId.message}</p>
          )}
        </div>

        {/* Pagar com: Conta ou Cartão */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-text-muted">Pagar com</label>
          <div className="mb-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setValue('destinationType', 'account');
                setValue('installments', 1, { shouldValidate: true });
              }}
              className={`rounded-2xl py-2.5 text-sm font-semibold transition ${
                destinationType === 'account'
                  ? 'bg-primary text-white'
                  : 'bg-surface-soft text-text-muted hover:bg-surface-soft/70'
              }`}
            >
              Conta bancária
            </button>
            <button
              type="button"
              onClick={() => setValue('destinationType', 'card')}
              className={`rounded-2xl py-2.5 text-sm font-semibold transition ${
                destinationType === 'card'
                  ? 'bg-primary text-white'
                  : 'bg-surface-soft text-text-muted hover:bg-surface-soft/70'
              }`}
            >
              Cartão de crédito
            </button>
          </div>

          {destinationType === 'account' ? (
            <Select id="accountId" {...register('accountId')} aria-invalid={!!errors.accountId}>
              <option value="">Selecione uma conta</option>
              {(accountsData?.accounts ?? []).map((a) => (
                <option key={a.id} value={String(a.id)}>
                  {a.name}
                </option>
              ))}
            </Select>
          ) : (
            <div className="space-y-3">
              <Select id="creditCardId" {...register('creditCardId')} aria-invalid={!!errors.creditCardId}>
                <option value="">Selecione um cartão</option>
                {(cardsData ?? []).map((card) => (
                  <option key={card.id} value={String(card.id)}>
                    {card.name} (Fecha dia {card.closingDay})
                  </option>
                ))}
              </Select>


            </div>
          )}

          {errors.accountId && (
            <p className="mt-1 text-xs text-expense">{errors.accountId.message}</p>
          )}
          {errors.creditCardId && (
            <p className="mt-1 text-xs text-expense">{errors.creditCardId.message}</p>
          )}
        </div>

        {/* Parcelas (apenas para cartão) */}
        {destinationType === 'card' && (
          <div>
            <label htmlFor="installments" className="mb-1.5 block text-xs font-semibold text-text-muted">Parcelas</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => changeInstallments(-1)}
                disabled={installments <= 1}
                aria-label="Diminuir parcelas"
                className="grid size-11 place-items-center rounded-xl bg-surface-soft text-text-muted transition hover:bg-border disabled:opacity-40"
              >
                <Minus className="size-4" />
              </button>
              <Controller
                name="installments"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    id="installments"
                    value={Number.isFinite(field.value) ? field.value : ''}
                    type="number"
                    step={1}
                    min={1}
                    max={24}
                    className="min-h-11 w-16 rounded-xl border border-border bg-surface py-2 text-center text-sm font-bold text-text tabular-nums"
                    aria-label="Número de parcelas"
                    aria-invalid={!!errors.installments}
                    aria-describedby={errors.installments ? 'installments-error' : undefined}
                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                  />
                )}
              />
              <button
                type="button"
                onClick={() => changeInstallments(1)}
                disabled={installments >= 24}
                aria-label="Aumentar parcelas"
                className="grid size-11 place-items-center rounded-xl bg-surface-soft text-text-muted transition hover:bg-border disabled:opacity-40"
              >
                <Plus className="size-4" />
              </button>
              <span className="text-sm font-semibold text-text">
                {installments === 1 ? 'À vista' : Number.isFinite(installments) ? `${installments}x` : 'Informe as parcelas'}
              </span>
            </div>
            {errors.installments && (
              <p id="installments-error" role="alert" className="mt-1 text-xs text-expense">
                {errors.installments.message}
              </p>
            )}

            <p className="mt-3 text-xs text-text-muted">A competência e os valores das parcelas serão confirmados após o cadastro.</p>
          </div>
        )}

        {/* Observações */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-text-muted" htmlFor="notes">
            Observações (opcional)
          </label>
          <textarea
            id="notes"
            {...register('notes')}
            rows={2}
            placeholder="Notas adicionais..."
            className="w-full rounded-2xl border border-border bg-surface px-3 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
          />
          {errors.notes && <p className="mt-1 text-xs text-expense">{errors.notes.message}</p>}
        </div>

        {/* Botões */}
        {errors.root?.submit && (
          <p role="alert" className="text-sm text-expense">{errors.root.submit.message}</p>
        )}
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="brand"
            className="flex-1"
            disabled={isPending || isSubmitting}
          >
            {isPending || isSubmitting ? 'Salvando...' : editing ? 'Salvar alterações' : 'Registrar'}
          </Button>
        </div>
      </form>
    </Sheet>
  );
}

