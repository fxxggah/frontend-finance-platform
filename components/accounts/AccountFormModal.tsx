'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { formatMoneyInput, parseMoneyInput } from '@/lib/format/money';
import { Select } from '@/components/ui/select';
import { ColorPicker } from '@/components/ui/color-picker';
import { IconPicker } from '@/components/ui/icon-picker';
import { useCreateAccount, useUpdateAccount } from '@/hooks/use-accounts';
import { ApiError } from '@/lib/api/errors';
import type { Account, AccountType } from '@/types';

const schema = z.object({
  name: z
    .string()
    .min(1, 'O nome é obrigatório')
    .max(60, 'O nome deve ter no máximo 60 caracteres'),
  type: z.enum(['BANK', 'CASH', 'DIGITAL_WALLET', 'OTHER'] as const),
  initialBalance: z
    .string()
    .optional()
    .refine((v) => {
      if (!v) return true;
      return Number.isFinite(parseMoneyInput(v));
    }, 'Valor inválido'),
  color: z.string().min(1, 'Selecione uma cor'),
  icon: z.string().min(1, 'Selecione um ícone'),
});

type FormData = z.infer<typeof schema>;

interface AccountFormModalProps {
  open: boolean;
  onClose: () => void;
  account?: Account | null;
}

export function AccountFormModal({ open, onClose, account }: AccountFormModalProps) {
  const isEditing = !!account;
  const createMutation = useCreateAccount();
  const updateMutation = useUpdateAccount();

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
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      type: 'BANK',
      initialBalance: '0,00',
      color: '#5B3DF5',
      icon: 'landmark',
    },
  });

  const selectedColor = watch('color');
  const selectedIcon = watch('icon');

  useEffect(() => {
    if (!open) {
      reset({
        name: '',
        type: 'BANK',
        initialBalance: '0,00',
        color: '#5B3DF5',
        icon: 'landmark',
      });
      return;
    }

    if (account) {
      reset({
        name: account.name,
        type: account.type,
        initialBalance: formatMoneyInput(account.balance),
        color: account.color,
        icon: account.icon,
      });
    } else {
      reset({
        name: '',
        type: 'BANK',
        initialBalance: '0,00',
        color: '#5B3DF5',
        icon: 'landmark',
      });
    }
  }, [open, account, reset]);

  async function onSubmit(data: FormData) {
    const cleanBalance = data.initialBalance
      ? parseMoneyInput(data.initialBalance)
      : 0;

    try {
      if (isEditing && account) {
        await updateMutation.mutateAsync({
          id: account.id,
          data: {
            name: data.name,
            type: data.type as AccountType,
            initialBalance: cleanBalance,
            color: data.color,
            icon: data.icon,
          },
        });
      } else {
        await createMutation.mutateAsync({
          name: data.name,
          type: data.type as AccountType,
          initialBalance: cleanBalance,
          color: data.color,
          icon: data.icon,
        });
      }
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setError('name', {
            type: 'manual',
            message: 'Você já tem uma conta com esse nome',
          });
          return;
        }
        if (err.errors && err.errors.length > 0) {
          for (const fieldErr of err.errors) {
            setError(fieldErr.field as keyof FormData, {
              type: 'server',
              message: fieldErr.message,
            });
          }
        }
      }
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="max-w-lg">
      <DialogHeader>
        <DialogTitle>{isEditing ? 'Editar Conta' : 'Nova Conta'}</DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <DialogBody className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {/* Nome */}
          <div>
            <label htmlFor="account-name" className="mb-1 block text-xs font-semibold text-text-muted">
              Nome da conta *
            </label>
            <Input
              id="account-name"
              placeholder="Ex: Nubank, Carteira, Safra"
              {...register('name')}
              error={errors.name?.message}
            />
          </div>

          {/* Tipo e Saldo Inicial */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="account-type" className="mb-1 block text-xs font-semibold text-text-muted">
                Tipo de conta *
              </label>
              <Select id="account-type" {...register('type')}>
                <option value="BANK">Banco</option>
                <option value="CASH">Dinheiro</option>
                <option value="DIGITAL_WALLET">Carteira digital</option>
                <option value="OTHER">Outro</option>
              </Select>
            </div>

            <div>
              <label htmlFor="account-balance" className="mb-1 block text-xs font-semibold text-text-muted">
                {isEditing ? 'Saldo atual (R$)' : 'Saldo inicial (R$)'}
              </label>
              <Controller
                name="initialBalance"
                control={control}
                render={({ field }) => (
                  <CurrencyInput
                    {...field}
                    value={field.value ?? ''}
                    onValueChange={field.onChange}
                    allowNegative
                    id="account-balance"
                    placeholder="0,00"
                    className="tabular-nums"
                    error={errors.initialBalance?.message}
                  />
                )}
              />
            </div>
          </div>

          {/* Seletor de Cor */}
          <div>
            <label className="mb-2 block text-xs font-semibold text-text-muted">
              Cor de identificação
            </label>
            <ColorPicker
              value={selectedColor}
              onChange={(c) => setValue('color', c, { shouldValidate: true })}
            />
          </div>

          {/* Seletor de Ícone */}
          <div>
            <label className="mb-2 block text-xs font-semibold text-text-muted">
              Ícone
            </label>
            <IconPicker
              value={selectedIcon}
              color={selectedColor}
              onChange={(ico) => setValue('icon', ico, { shouldValidate: true })}
            />
          </div>
        </DialogBody>

        <DialogFooter>
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
              : 'Criar Conta'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}

