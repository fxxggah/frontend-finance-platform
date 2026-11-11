'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Sheet } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useAccounts } from '@/hooks/use-accounts';
import { useCreateTransfer } from '@/hooks/use-transfers';
import { ApiError } from '@/lib/api/errors';

const schema = z
  .object({
    fromAccountId: z.string().min(1, 'Selecione a conta de origem'),
    toAccountId: z.string().min(1, 'Selecione a conta de destino'),
    amount: z
      .string()
      .min(1, 'Informe o valor')
      .refine((v) => {
        const clean = v.replace(/\./g, '').replace(',', '.');
        const n = parseFloat(clean);
        return !isNaN(n) && n > 0;
      }, 'O valor deve ser maior que zero'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
    description: z.string().max(255).optional(),
  })
  .refine((data) => data.fromAccountId !== data.toAccountId, {
    message: 'A conta de origem e destino devem ser diferentes',
    path: ['toAccountId'],
  });

type FormData = z.infer<typeof schema>;

interface TransferFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TransferForm({ open, onOpenChange }: TransferFormProps) {
  const { data: accountsData } = useAccounts();
  const createMutation = useCreateTransfer();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      fromAccountId: '',
      toAccountId: '',
      amount: '',
      date: new Date().toISOString().slice(0, 10),
      description: '',
    },
  });

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  async function onSubmit(data: FormData) {
    try {
      await createMutation.mutateAsync({
        fromAccountId: parseInt(data.fromAccountId),
        toAccountId: parseInt(data.toAccountId),
        amount: parseFloat(data.amount.replace(/\./g, '').replace(',', '.')),
        date: data.date,
        description: data.description || null,
      });
      onOpenChange(false);
    } catch (error) {
      if (error instanceof ApiError && error.status === 400) {
        for (const fieldErr of error.errors) {
          setError(fieldErr.field as keyof FormData, { message: fieldErr.message });
        }
      }
    }
  }

  const accounts = accountsData?.accounts ?? [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Nova transferência">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-text-muted" htmlFor="fromAccountId">
            Conta de origem
          </label>
          <Select id="fromAccountId" {...register('fromAccountId')} aria-invalid={!!errors.fromAccountId}>
            <option value="">Selecione a conta de origem</option>
            {accounts.map((a) => (
              <option key={a.id} value={String(a.id)}>
                {a.name}
              </option>
            ))}
          </Select>
          {errors.fromAccountId && (
            <p className="mt-1 text-xs text-expense">{errors.fromAccountId.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-text-muted" htmlFor="toAccountId">
            Conta de destino
          </label>
          <Select id="toAccountId" {...register('toAccountId')} aria-invalid={!!errors.toAccountId}>
            <option value="">Selecione a conta de destino</option>
            {accounts.map((a) => (
              <option key={a.id} value={String(a.id)}>
                {a.name}
              </option>
            ))}
          </Select>
          {errors.toAccountId && (
            <p className="mt-1 text-xs text-expense">{errors.toAccountId.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-text-muted" htmlFor="transfer-amount">
            Valor (R$)
          </label>
          <Input
            id="transfer-amount"
            inputMode="decimal"
            placeholder="0,00"
            {...register('amount')}
            className="tabular-nums text-lg font-bold"
            aria-invalid={!!errors.amount}
          />
          {errors.amount && <p className="mt-1 text-xs text-expense">{errors.amount.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-text-muted" htmlFor="transfer-date">
            Data
          </label>
          <Input id="transfer-date" type="date" {...register('date')} aria-invalid={!!errors.date} />
          {errors.date && <p className="mt-1 text-xs text-expense">{errors.date.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-text-muted" htmlFor="transfer-description">
            Descrição (opcional)
          </label>
          <Input
            id="transfer-description"
            placeholder="Ex: Aporte na reserva de emergência..."
            {...register('description')}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" variant="brand" className="flex-1" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Transferindo...' : 'Transferir'}
          </Button>
        </div>
      </form>
    </Sheet>
  );
}

