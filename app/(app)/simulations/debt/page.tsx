'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calculator, AlertTriangle, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatMoney } from '@/lib/format/money';
import { calculateDebtPayoff, InsufficientPaymentError } from '@/lib/simulations';
import type { DebtResult } from '@/types';
import { cn } from '@/lib/utils';

// ─── Schema de validação ───────────────────────────────────────────────────────

const debtSchema = z.object({
  debtAmount: z
    .number({ invalid_type_error: 'Informe um valor válido' })
    .positive('O saldo devedor deve ser maior que zero'),
  monthlyInterestRate: z
    .number({ invalid_type_error: 'Informe um valor válido' })
    .positive('A taxa de juros deve ser maior que zero')
    .max(100, 'A taxa não pode ultrapassar 100%'),
  monthlyPayment: z
    .number({ invalid_type_error: 'Informe um valor válido' })
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
  const [result, setResult] = useState<DebtResult | null>(null);
  const [calcError, setCalcError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DebtForm>({
    resolver: zodResolver(debtSchema),
    defaultValues: {
      debtAmount: 10000,
      monthlyInterestRate: 2.5,
      monthlyPayment: 600,
    },
  });

  function onSubmit(data: DebtForm) {
    setCalcError(null);
    setResult(null);
    try {
      const res = calculateDebtPayoff(data);
      setResult(res);
    } catch (err) {
      if (err instanceof InsufficientPaymentError) {
        setCalcError(err.message);
      } else {
        setCalcError('Ocorreu um erro inesperado no cálculo. Verifique os valores.');
      }
    }
  }

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-4 pb-24 lg:p-8 lg:pb-8">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-2xl bg-expense-soft">
          <Calculator size={20} className="text-expense" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-xl font-bold text-text">Simulador de Quitação de Dívidas</h1>
          <p className="text-sm text-text-muted">Descubra quando sua dívida será zerada</p>
        </div>
      </div>

      <DisclaimerBanner />

      {/* Formulário */}
      <div className="rounded-2xl border border-border bg-surface p-5">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              label="Saldo devedor (R$)"
              type="number"
              min={0.01}
              step={0.01}
              placeholder="10.000,00"
              error={errors.debtAmount?.message}
              {...register('debtAmount', { valueAsNumber: true })}
            />
            <Input
              label="Taxa de juros mensal (%)"
              type="number"
              min={0.01}
              max={100}
              step={0.01}
              placeholder="2,50"
              error={errors.monthlyInterestRate?.message}
              {...register('monthlyInterestRate', { valueAsNumber: true })}
            />
            <Input
              label="Pagamento mensal (R$)"
              type="number"
              min={0.01}
              step={0.01}
              placeholder="600,00"
              error={errors.monthlyPayment?.message}
              {...register('monthlyPayment', { valueAsNumber: true })}
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

          <Button type="submit" variant="primary" size="md" className="w-full sm:w-auto">
            <Calculator size={16} />
            Calcular
          </Button>
        </form>
      </div>

      {/* Resultados */}
      {result && (
        <section aria-label="Resultado da simulação" className="space-y-4">
          <h2 className="flex items-center gap-2 text-base font-semibold text-text">
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
    </main>
  );
}

