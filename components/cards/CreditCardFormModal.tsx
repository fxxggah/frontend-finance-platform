'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Info } from 'lucide-react';
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ColorPicker } from '@/components/ui/color-picker';
import { IconPicker } from '@/components/ui/icon-picker';
import { useCreateCreditCard, useUpdateCreditCard } from '@/hooks/use-credit-cards';
import type { CreditCard } from '@/types';

const schema = z.object({
  name: z.string().min(1, 'O nome é obrigatório').max(60, 'Máximo 60 caracteres'),
  creditLimit: z
    .string()
    .min(1, 'Informe o limite')
    .refine((v) => {
      const clean = v.replace(/\./g, '').replace(',', '.');
      const num = parseFloat(clean);
      return !isNaN(num) && num > 0;
    }, 'O limite deve ser maior que zero'),
  closingDay: z
    .number()
    .int('Dia inteiro')
    .min(1, 'Dia entre 1 e 28')
    .max(28, 'Dia entre 1 e 28'),
  dueDay: z
    .number()
    .int('Dia inteiro')
    .min(1, 'Dia entre 1 e 28')
    .max(28, 'Dia entre 1 e 28'),
  color: z.string().min(1, 'Selecione uma cor'),
  icon: z.string().min(1, 'Selecione um ícone'),
});

type FormData = z.infer<typeof schema>;

interface CreditCardFormModalProps {
  open: boolean;
  onClose: () => void;
  card?: CreditCard | null;
}

export function CreditCardFormModal({ open, onClose, card }: CreditCardFormModalProps) {
  const isEditing = !!card;
  const createMutation = useCreateCreditCard();
  const updateMutation = useUpdateCreditCard();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      creditLimit: '1.000,00',
      closingDay: 25,
      dueDay: 2,
      color: '#5B3DF5',
      icon: 'credit-card',
    },
  });

  const selectedColor = watch('color');
  const selectedIcon = watch('icon');

  useEffect(() => {
    if (!open) {
      reset({
        name: '',
        creditLimit: '1.000,00',
        closingDay: 25,
        dueDay: 2,
        color: '#5B3DF5',
        icon: 'credit-card',
      });
      return;
    }

    if (card) {
      reset({
        name: card.name,
        creditLimit: card.creditLimit.toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
        closingDay: card.closingDay,
        dueDay: card.dueDay,
        color: card.color,
        icon: card.icon,
      });
    } else {
      reset({
        name: '',
        creditLimit: '1.000,00',
        closingDay: 25,
        dueDay: 2,
        color: '#5B3DF5',
        icon: 'credit-card',
      });
    }
  }, [open, card, reset]);

  async function onSubmit(data: FormData) {
    const limit = parseFloat(data.creditLimit.replace(/\./g, '').replace(',', '.'));

    if (isEditing && card) {
      await updateMutation.mutateAsync({
        id: card.id,
        data: {
          name: data.name,
          creditLimit: limit,
          closingDay: data.closingDay,
          dueDay: data.dueDay,
          color: data.color,
          icon: data.icon,
        },
      });
    } else {
      await createMutation.mutateAsync({
        name: data.name,
        creditLimit: limit,
        closingDay: data.closingDay,
        dueDay: data.dueDay,
        color: data.color,
        icon: data.icon,
      });
    }
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="max-w-lg">
      <DialogHeader>
        <DialogTitle>{isEditing ? 'Editar Cartão de Crédito' : 'Novo Cartão de Crédito'}</DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <DialogBody className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {/* Nome */}
          <div>
            <label htmlFor="card-name" className="mb-1 block text-xs font-semibold text-text-muted">
              Nome do cartão *
            </label>
            <Input
              id="card-name"
              placeholder="Ex: Nubank Ultravioleta, Itaú Click"
              {...register('name')}
              error={errors.name?.message}
            />
          </div>

          {/* Limite Total */}
          <div>
            <label htmlFor="card-limit" className="mb-1 block text-xs font-semibold text-text-muted">
              Limite total de crédito (R$) *
            </label>
            <Input
              id="card-limit"
              placeholder="0,00"
              className="tabular-nums"
              {...register('creditLimit')}
              error={errors.creditLimit?.message}
            />
          </div>

          {/* Dias de Fechamento e Vencimento */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="closing-day" className="mb-1 block text-xs font-semibold text-text-muted">
                Dia de fechamento *
              </label>
              <Input
                id="closing-day"
                type="number"
                min={1}
                max={28}
                {...register('closingDay', { valueAsNumber: true })}
                error={errors.closingDay?.message}
              />
            </div>

            <div>
              <label htmlFor="due-day" className="mb-1 block text-xs font-semibold text-text-muted">
                Dia de vencimento *
              </label>
              <Input
                id="due-day"
                type="number"
                min={1}
                max={28}
                {...register('dueDay', { valueAsNumber: true })}
                error={errors.dueDay?.message}
              />
            </div>
          </div>

          {/* Dica explicativa */}
          <div className="flex items-start gap-2 rounded-xl bg-surface-soft p-3 text-xs text-text-muted border border-border">
            <Info size={16} className="text-primary shrink-0 mt-0.5" />
            <span>Mudar fechamento ou vencimento vale só para compras futuras.</span>
          </div>

          {/* Seletor de Cor */}
          <div>
            <label className="mb-2 block text-xs font-semibold text-text-muted">
              Cor do cartão
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
              : 'Criar Cartão'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}

