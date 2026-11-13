'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Info } from 'lucide-react';
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Select } from '@/components/ui/select';
import { useAccounts } from '@/hooks/use-accounts';
import { usePayInvoice } from '@/hooks/use-credit-cards';
import { formatMoney, formatMoneyInput, parseMoneyInput } from '@/lib/format/money';
import { getToday } from '@/lib/format/date';
import { ApiError } from '@/lib/api/errors';
import type { InvoiceDetail, InvoiceSummary } from '@/types';

interface InvoicePayModalProps {
  open: boolean;
  onClose: () => void;
  cardId: number;
  invoice: InvoiceSummary | InvoiceDetail;
}

export function InvoicePayModal({ open, onClose, cardId, invoice }: InvoicePayModalProps) {
  const { data: accountsData } = useAccounts();
  const payMutation = usePayInvoice(cardId, invoice.reference);

  const remaining = Math.max(0, invoice.total - invoice.paid);

  const schema = z.object({
    accountId: z.string().min(1, 'Selecione a conta de origem'),
    amount: z
      .string()
      .min(1, 'Informe o valor')
      .refine((v) => {
        const num = parseMoneyInput(v);
        return !isNaN(num) && num > 0;
      }, 'O valor deve ser maior que zero')
      .refine((v) => {
        const num = parseMoneyInput(v);
        return Math.round(num * 100) <= Math.round(remaining * 100);
      }, `O valor não pode ser superior ao restante (${formatMoney(remaining)})`),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  });

  type FormData = z.infer<typeof schema>;

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      accountId: '',
      amount: formatMoneyInput(remaining),
      date: getToday(),
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        accountId: '',
        amount: formatMoneyInput(remaining),
        date: getToday(),
      });
    }
  }, [open, remaining, reset]);

  async function onSubmit(data: FormData) {
    clearErrors('root');
    const value = parseMoneyInput(data.amount);
    try {
    await payMutation.mutateAsync({
      accountId: parseInt(data.accountId, 10),
      amount: value,
      date: data.date,
    });
    onClose();
    } catch (error) {
      setError('root.server', {
        message: error instanceof ApiError ? error.detail : 'Não foi possível registrar o pagamento. Tente novamente.',
      });
      if (error instanceof ApiError) {
        for (const field of error.errors) {
          if (field.field in data) setError(field.field as keyof FormData, { message: field.message });
        }
      }
    }
  }

  const accounts = accountsData?.accounts?.filter((a) => !a.archived) ?? [];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="max-w-md">
      <DialogHeader>
        <DialogTitle>Pagar Fatura ({invoice.reference})</DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <DialogBody className="space-y-4">
          {errors.root?.server?.message && (
            <p role="alert" className="rounded-xl border border-expense bg-expense-soft p-3 text-sm text-expense">
              {errors.root.server.message}
            </p>
          )}
          {/* Resumo do Saldo Devedor */}
          <div className="rounded-2xl bg-surface-soft p-4 border border-border flex items-center justify-between">
            <div>
              <p className="text-xs text-text-muted">Restante a pagar</p>
              <p className="text-xl font-bold tabular-nums text-text">{formatMoney(remaining)}</p>
            </div>
            <div className="text-right text-xs text-text-muted">
              <p>Total: {formatMoney(invoice.total)}</p>
              <p>Pago: {formatMoney(invoice.paid)}</p>
            </div>
          </div>

          {/* Conta de Débito */}
          <div>
            <label htmlFor="pay-account" className="mb-1 block text-xs font-semibold text-text-muted">
              Conta de débito *
            </label>
            <Select id="pay-account" {...register('accountId')} error={errors.accountId?.message}>
              <option value="">Selecione a conta</option>
              {accounts.map((a) => (
                <option key={a.id} value={String(a.id)}>
                  {a.name} ({formatMoney(a.balance)})
                </option>
              ))}
            </Select>
          </div>

          {/* Valor a Pagar */}
          <div>
            <label htmlFor="pay-amount" className="mb-1 block text-xs font-semibold text-text-muted">
              Valor do pagamento (R$) *
            </label>
            <Controller
              name="amount"
              control={control}
              render={({ field }) => (
                <CurrencyInput
                  {...field}
                  value={field.value ?? ''}
                  onValueChange={field.onChange}
                  id="pay-amount"
                  placeholder="0,00"
                  className="tabular-nums"
                  error={errors.amount?.message}
                />
              )}
            />
            <p className="mt-1 text-[11px] text-text-muted">
              Pagamentos parciais são permitidos até o limite restante.
            </p>
          </div>

          {/* Data do Pagamento */}
          <div>
            <label htmlFor="pay-date" className="mb-1 block text-xs font-semibold text-text-muted">
              Data do pagamento *
            </label>
            <Input
              id="pay-date"
              type="date"
              {...register('date')}
              error={errors.date?.message}
            />
          </div>

          {/* Nota Conceitual Obrigatória */}
          <div className="flex items-start gap-2.5 rounded-xl bg-primary-soft/50 p-3 text-xs text-primary leading-relaxed border border-primary/20">
            <Info size={16} className="shrink-0 mt-0.5" />
            <span>
              <strong>Lembrete:</strong> Pagar fatura não é despesa; a despesa já foi contada na compra. O pagamento apenas transfere recursos da conta para cobrir o cartão.
            </span>
          </div>
        </DialogBody>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="brand"
            disabled={isSubmitting || payMutation.isPending || remaining <= 0}
          >
            {isSubmitting || payMutation.isPending ? 'Confirmando...' : 'Confirmar Pagamento'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}

