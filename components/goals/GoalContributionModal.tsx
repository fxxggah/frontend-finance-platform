'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PlusCircle, MinusCircle } from 'lucide-react';
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { useAddGoalContribution } from '@/hooks/use-goals';
import { formatMoney, parseMoneyInput } from '@/lib/format/money';
import { cn } from '@/lib/utils';
import type { Goal } from '@/types';

interface GoalContributionModalProps {
  open: boolean;
  onClose: () => void;
  goal: Goal;
}

export function GoalContributionModal({ open, onClose, goal }: GoalContributionModalProps) {
  const [operationType, setOperationType] = useState<'DEPOSIT' | 'WITHDRAWAL'>('DEPOSIT');
  const addMutation = useAddGoalContribution(goal.id);

  const schema = z
    .object({
      amount: z
        .string()
        .min(1, 'Informe o valor')
        .refine((v) => {
          const num = parseMoneyInput(v);
          return !isNaN(num) && num > 0;
        }, 'O valor deve ser maior que zero'),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
      notes: z.string().max(255).optional(),
    })
    .refine(
      (data) => {
        if (operationType === 'WITHDRAWAL') {
          const num = parseMoneyInput(data.amount);
          return goal.currentAmount - num >= 0;
        }
        return true;
      },
      {
        message: `O valor do resgate não pode exceder o saldo atual acumulado (${formatMoney(goal.currentAmount)})`,
        path: ['amount'],
      }
    );

type FormData = z.infer<typeof schema>;

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: '',
      date: new Date().toISOString().slice(0, 10),
      notes: '',
    },
  });

  useEffect(() => {
    if (open) {
      setOperationType('DEPOSIT');
      reset({
        amount: '',
        date: new Date().toISOString().slice(0, 10),
        notes: '',
      });
    }
  }, [open, reset]);

  async function onSubmit(data: FormData) {
    const rawVal = parseMoneyInput(data.amount);
    const finalAmount = operationType === 'WITHDRAWAL' ? -Math.abs(rawVal) : Math.abs(rawVal);

    await addMutation.mutateAsync({
      amount: finalAmount,
      date: data.date,
      notes: data.notes || undefined,
    });
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="max-w-md">
      <DialogHeader>
        <DialogTitle>Movimentar Meta de Economia</DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <DialogBody className="space-y-4">
          {/* Seletor Aporte vs Resgate */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-surface-soft border border-border">
            <button
              type="button"
              onClick={() => setOperationType('DEPOSIT')}
              className={cn(
                'flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all',
                operationType === 'DEPOSIT'
                  ? 'bg-income text-white shadow-sm'
                  : 'text-text-muted hover:text-text'
              )}
            >
              <PlusCircle size={16} />
              <span>Depósito / Aporte</span>
            </button>

            <button
              type="button"
              onClick={() => setOperationType('WITHDRAWAL')}
              className={cn(
                'flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all',
                operationType === 'WITHDRAWAL'
                  ? 'bg-expense text-white shadow-sm'
                  : 'text-text-muted hover:text-text'
              )}
            >
              <MinusCircle size={16} />
              <span>Resgate / Retirada</span>
            </button>
          </div>

          {/* Saldo Atual da Meta */}
          <div className="rounded-2xl border border-border bg-surface-soft p-3.5 flex items-center justify-between text-xs">
            <span className="text-text-muted">Saldo acumulado nesta meta</span>
            <span className="font-bold tabular-nums text-text text-sm">
              {formatMoney(goal.currentAmount)}
            </span>
          </div>

          {/* Valor */}
          <div>
            <label htmlFor="contrib-amount" className="mb-1 block text-xs font-semibold text-text-muted">
              Valor da movimentação (R$) *
            </label>
            <Controller
              name="amount"
              control={control}
              render={({ field }) => (
                <CurrencyInput
                  {...field}
                  value={field.value ?? ''}
                  onValueChange={field.onChange}
                  id="contrib-amount"
                  placeholder="0,00"
                  className="tabular-nums"
                  error={errors.amount?.message}
                />
              )}
            />
          </div>

          {/* Data */}
          <div>
            <label htmlFor="contrib-date" className="mb-1 block text-xs font-semibold text-text-muted">
              Data *
            </label>
            <Input id="contrib-date" type="date" {...register('date')} error={errors.date?.message} />
          </div>

          {/* Observações */}
          <div>
            <label htmlFor="contrib-notes" className="mb-1 block text-xs font-semibold text-text-muted">
              Descrição / Motivo (opcional)
            </label>
            <Input
              id="contrib-notes"
              placeholder="Ex: Sobra salarial, PIX de freelance, emergência"
              {...register('notes')}
              error={errors.notes?.message}
            />
          </div>
        </DialogBody>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant={operationType === 'DEPOSIT' ? 'brand' : 'primary'}
            className={operationType === 'WITHDRAWAL' ? 'bg-expense hover:bg-expense/90 text-white' : undefined}
            disabled={isSubmitting || addMutation.isPending}
          >
            {isSubmitting || addMutation.isPending
              ? 'Registrando...'
              : operationType === 'DEPOSIT'
              ? 'Confirmar Depósito'
              : 'Confirmar Resgate'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}

