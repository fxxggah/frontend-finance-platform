'use client';

import { PageContainer, PageHeader } from '@/components/ui/page';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calculator, AlertTriangle, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { formatMoney, formatMoneyInput, parseMoneyInput } from '@/lib/format/money';
import { useDebtSimulation } from '@/hooks/use-simulations';
import { ApiError } from '@/lib/api/errors';
import type { DebtResult } from '@/types';
import { cn } from '@/lib/utils';

// ─── Schema de validação ───────────────────────────────────────────────────────

const debtSchema = z.object({
  debtAmount: z
    .number({ error: 'Informe um valor válido' })
    .positive('O saldo devedor deve ser maior que zero'),
  monthlyInterestRate: z
    .number({ error: 'Informe um valor válido' })
    .min(0, 'A taxa não pode ser negativa'),
  monthlyPayment: z
    .number({ error: 'Informe um valor válido' })
    .positive('O pagamento mensal deve ser maior que zero'),
});

type DebtForm = z.infer<typeof debtSchema>;

// ─── Componentes auxiliares ────────────────────────────────────────────────────

function DisclaimerBanner() {
  return (
    <div
      role="note"
      className="flex items-start gap-3 rounded-2xl border border-warning/30 bg-warning-soft px-4 py-3"
    >
      <AlertTriangle size={16} className="mt-0.5 shrink-0 text-warning" aria-hidden="true" />
      <p className="text-sm text-text-muted">
        <strong className="font-semibold text-text">Aviso:</strong> Simulação ilustrativa, não é
        recomendação financeira.
      </p>
    </div>
  );
}

function ResultCard({
  label,
  value,
  highlight,
  colorClass,
  isMonths,
}: {
  label: string;
  value: number;
  highlight?: boolean;
  colorClass?: string;
  isMonths?: boolean;
}) {
  const displayValue = isMonths
    ? `${value} ${value === 1 ? 'mês' : 'meses'}`
    : formatMoney(value);

  return (
    <div
      className={cn(
        'flex flex-col gap-1 rounded-2xl border p-4',
        highlight
          ? 'border-primary/30 bg-primary-soft'
          : 'border-border bg-surface',
      )}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-text-muted">{label}</p>
      <p
        className={cn(
          'text-xl font-bold tabular-nums',
          colorClass ?? (highlight ? 'text-primary' : 'text-text'),
        )}
      >
        {displayValue}
      </p>
    </div>
  );
}

function AmortizationTable({ schedule }: { schedule: DebtResult['schedule'] }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? schedule : schedule.slice(0, 12);

  return (
    <div className="mt-2">
      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-soft text-left">
              <th className="px-4 py-3 font-medium text-text-muted">Mês</th>
              <th className="px-4 py-3 font-medium text-text-muted">Parcela</th>
              <th className="px-4 py-3 font-medium text-expense text-text-muted">Juros</th>
              <th className="px-4 py-3 font-medium text-text-muted">Amortização</th>
              <th className="px-4 py-3 font-medium text-text-muted">Saldo Devedor</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr
                key={row.month}
                className="border-b border-border/60 last:border-0 transition-colors hover:bg-surface-soft/50"
              >
                <td className="px-4 py-2.5 tabular-nums text-text-muted">{row.month}</td>
                <td className="px-4 py-2.5 font-medium tabular-nums text-text">
                  {formatMoney(row.payment)}
                </td>
                <td className="px-4 py-2.5 tabular-nums text-expense">
                  {formatMoney(row.interest)}
                </td>
                <td className="px-4 py-2.5 tabular-nums text-income">
                  {formatMoney(row.principal)}
                </td>
                <td className="px-4 py-2.5 font-semibold tabular-nums text-text">
                  {row.balance === 0 ? (
                    <span className="text-income font-semibold">Quitado ✓</span>
                  ) : (
                    formatMoney(row.balance)
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {schedule.length > 12 && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 w-full"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? (
            <>
              <ChevronUp size={16} /> Recolher tabela
            </>
          ) : (
            <>
              <ChevronDown size={16} /> Ver todos os {schedule.length} meses
            </>
          )}
        </Button>
      )}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function DebtSimulatorPage() {
  const mutation = useDebtSimulation();
  const result = mutation.data;
  const [calcError, setCalcError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<DebtForm>({
    resolver: zodResolver(debtSchema),
    defaultValues: {
      debtAmount: 10000,
      monthlyInterestRate: 2.5,
      monthlyPayment: 600,
    },
  });

  async function onSubmit(data: DebtForm) {
    setCalcError(null);
    mutation.reset();
    try {
      await mutation.mutateAsync({
        debtAmount: data.debtAmount, monthlyRate: data.monthlyInterestRate, monthlyPayment: data.monthlyPayment,
      });
    } catch (error) {
      if (error instanceof ApiError) {
        for (const field of error.errors) {
          const key = field.field === 'monthlyRate' ? 'monthlyInterestRate' : field.field;
          if (key in data) setError(key as keyof DebtForm, { message: field.message });
        }
      }
      setCalcError(error instanceof Error ? error.message : 'Não foi possível realizar a simulação.');
    }
  }

  return (
    <PageContainer className="space-y-6">
      {/* Cabeçalho */}
      <PageHeader title="Simulador de Quitação de Dívidas" description={<>Descubra quando sua dívida será zerada</>} />

      <DisclaimerBanner />

      {/* Formulário */}
      <div className="rounded-2xl border border-border bg-surface p-5">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <Controller
              name="debtAmount"
              control={control}
              render={({ field }) => (
                <CurrencyInput
                  {...field}
                  value={formatMoneyInput(field.value)}
                  onValueChange={(value) => field.onChange(parseMoneyInput(value))}
                  label="Saldo devedor (R$)"
                  placeholder="10.000,00"
                  error={errors.debtAmount?.message}
                />
              )}
            />
            <Input
              label="Taxa de juros mensal (%)"
              type="number"
              min={0}
              step={0.01}
              placeholder="2,50"
              error={errors.monthlyInterestRate?.message}
              {...register('monthlyInterestRate', { valueAsNumber: true })}
            />
            <Controller
              name="monthlyPayment"
              control={control}
              render={({ field }) => (
                <CurrencyInput
                  {...field}
                  value={formatMoneyInput(field.value)}
                  onValueChange={(value) => field.onChange(parseMoneyInput(value))}
                  label="Pagamento mensal (R$)"
                  placeholder="600,00"
                  error={errors.monthlyPayment?.message}
                />
              )}
            />
          </div>

          {/* Erro de cálculo (parcela insuficiente) */}
          {calcError && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-expense/30 bg-expense-soft px-4 py-3"
            >
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-expense" aria-hidden="true" />
              <p className="text-sm text-expense">{calcError}</p>
            </div>
          )}

          <Button type="submit" variant="primary" size="md" isLoading={mutation.isPending} className="w-full sm:w-auto">
            <Calculator size={16} />
            Calcular
          </Button>
        </form>
      </div>

      {/* Resultados */}
      {result && (
        <section aria-label="Resultado da simulação" className="space-y-4">
          <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight text-text">
            <Info size={16} className="text-primary" aria-hidden="true" />
            Resultado da Simulação
          </h2>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <ResultCard
              label="Meses para quitar"
              value={result.months}
              isMonths
              highlight
            />
            <ResultCard label="Total pago" value={result.totalPaid} />
            <ResultCard
              label="Total em juros"
              value={result.totalInterest}
              colorClass="text-expense"
            />
            <ResultCard
              label="Economia inicial"
              value={result.totalPaid - result.totalInterest}
              colorClass="text-income"
            />
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5">
            <CardHeader className="px-0 pt-0 pb-3">
              <CardTitle className="text-sm font-semibold text-text">
                Cronograma de amortização
              </CardTitle>
            </CardHeader>
            <AmortizationTable schedule={result.schedule} />
          </div>
        </section>
      )}
    </PageContainer>
  );
}

