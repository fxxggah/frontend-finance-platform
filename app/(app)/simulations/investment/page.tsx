'use client';

import { PageContainer, PageHeader } from '@/components/ui/page';
import { SimulationsNav } from '@/components/simulations/SimulationsNav';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  TrendingUp,
  Calculator,
  Info,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { formatMoney, formatMoneyInput, parseMoneyInput } from '@/lib/format/money';
import { useInvestmentSimulation } from '@/hooks/use-simulations';
import { ApiError } from '@/lib/api/errors';
import type { InvestmentResult } from '@/types';
import { cn } from '@/lib/utils';

// ─── Schema de validação ───────────────────────────────────────────────────────

const investmentSchema = z.object({
  initialAmount: z
    .number({ error: 'Informe um valor válido' })
    .min(0, 'O valor inicial deve ser maior ou igual a zero'),
  monthlyContribution: z
    .number({ error: 'Informe um valor válido' })
    .min(0, 'O aporte mensal deve ser maior ou igual a zero'),
  annualRate: z
    .number({ error: 'Informe um valor válido' })
    .min(0, 'A rentabilidade deve ser maior ou igual a zero')
    .max(100, 'A rentabilidade não pode ultrapassar 100%'),
  years: z
    .number({ error: 'Informe um valor válido' })
    .int('Use um número inteiro de anos')
    .min(1, 'O prazo mínimo é 1 ano')
    .max(50, 'O prazo máximo é 50 anos'),
});

type InvestmentForm = z.infer<typeof investmentSchema>;

// ─── Componentes auxiliares ───────────────────────────────────────────────────

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
}: {
  label: string;
  value: number;
  highlight?: boolean;
  colorClass?: string;
}) {
  return (
    <Card
      variant="metric"
      className={cn('flex flex-col gap-1 p-4', highlight && 'border-primary/30 bg-primary-soft')}
    >
      <p className="text-xs font-medium text-text-muted uppercase tracking-wide">{label}</p>
      <p
        className={cn(
          'text-xl font-bold tabular-nums',
          colorClass ?? (highlight ? 'text-primary' : 'text-text'),
        )}
      >
        {formatMoney(value)}
      </p>
    </Card>
  );
}

// ─── Tabela de breakdown mensal ────────────────────────────────────────────────

function BreakdownTable({
  breakdown,
}: {
  breakdown: InvestmentResult['monthlyBreakdown'];
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? breakdown : breakdown.slice(0, 12);

  return (
    <div className="mt-2">
      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-soft text-left">
              <th className="px-4 py-3 font-medium text-text-muted">Mês</th>
              <th className="px-4 py-3 font-medium text-text-muted">Total Investido</th>
              <th className="px-4 py-3 font-medium text-text-muted text-income">Juros do mês</th>
              <th className="px-4 py-3 font-medium text-text-muted">Saldo</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr
                key={row.month}
                className="border-b border-border/60 last:border-0 hover:bg-surface-soft/50 transition-colors"
              >
                <td className="px-4 py-2.5 text-text-muted tabular-nums">{row.month}</td>
                <td className="px-4 py-2.5 text-text tabular-nums">{formatMoney(row.invested)}</td>
                <td className="px-4 py-2.5 text-income tabular-nums">
                  {formatMoney(row.interest)}
                </td>
                <td className="px-4 py-2.5 font-semibold text-text tabular-nums">
                  {formatMoney(row.balance)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {breakdown.length > 12 && (
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
              <ChevronDown size={16} /> Ver todos os {breakdown.length} meses
            </>
          )}
        </Button>
      )}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function InvestmentSimulatorPage() {
  const mutation = useInvestmentSimulation();
  const result = mutation.data;
  const [calcError, setCalcError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<InvestmentForm>({
    resolver: zodResolver(investmentSchema),
    defaultValues: {
      initialAmount: 1000,
      monthlyContribution: 500,
      annualRate: 12,
      years: 10,
    },
  });

  async function onSubmit(data: InvestmentForm) {
    mutation.reset();
    setCalcError(null);
    try {
      await mutation.mutateAsync(data);
    } catch (error) {
      if (error instanceof ApiError) {
        for (const field of error.errors) {
          if (field.field in data) setError(field.field as keyof InvestmentForm, { message: field.message });
        }
      }
      setCalcError(error instanceof ApiError ? error.detail : 'Não foi possível realizar a simulação.');
    }
  }

  return (
    <PageContainer className="space-y-6">
      {/* Cabeçalho */}
      <PageHeader title="Simulador de Investimentos" description={<>Projete o crescimento do seu Saldo</>} />
      <SimulationsNav />

      <DisclaimerBanner />

      {/* Formulário */}
      <Card variant="panel" className="p-5 sm:p-6">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Controller
              name="initialAmount"
              control={control}
              render={({ field }) => (
                <CurrencyInput
                  {...field}
                  value={formatMoneyInput(field.value)}
                  onValueChange={(value) => field.onChange(parseMoneyInput(value))}
                  label="Valor inicial (R$)"
                  placeholder="1.000,00"
                  error={errors.initialAmount?.message}
                />
              )}
            />
            <Controller
              name="monthlyContribution"
              control={control}
              render={({ field }) => (
                <CurrencyInput
                  {...field}
                  value={formatMoneyInput(field.value)}
                  onValueChange={(value) => field.onChange(parseMoneyInput(value))}
                  label="Aporte mensal (R$)"
                  placeholder="500,00"
                  error={errors.monthlyContribution?.message}
                />
              )}
            />
            <Input
              label="Rentabilidade anual (%)"
              type="number"
              min={0}
              max={100}
              step={0.01}
              placeholder="12,00"
              error={errors.annualRate?.message}
              {...register('annualRate', { valueAsNumber: true })}
            />
            <Input
              label="Prazo (anos)"
              type="number"
              min={1}
              max={50}
              step={1}
              placeholder="10"
              error={errors.years?.message}
              {...register('years', { valueAsNumber: true })}
            />
          </div>

          <Button type="submit" variant="primary" size="md" isLoading={mutation.isPending} className="w-full sm:w-auto">
            <Calculator size={16} />
            Calcular
          </Button>
        </form>
      </Card>

      {calcError && <p role="alert" className="text-sm text-expense">{calcError}</p>}
      {/* Resultados */}
      {result && (
        <section aria-label="Resultado da simulação" className="space-y-4">
          <h2 className="text-base font-semibold tracking-tight text-text flex items-center gap-2">
            <Info size={16} className="text-primary" aria-hidden="true" />
            Resultado da Simulação
          </h2>

          <div className="grid gap-3 sm:grid-cols-3">
            <ResultCard label="Total investido do bolso" value={result.totalInvested} />
            <ResultCard
              label="Juros acumulados"
              value={result.totalInterest}
              colorClass="text-income"
            />
            <ResultCard label="Valor final" value={result.finalAmount} highlight />
          </div>

          <Card variant="solid" className="p-5">
            <CardHeader className="px-0 pt-0 pb-3">
              <CardTitle className="text-sm font-semibold text-text">
                Evolução mês a mês
              </CardTitle>
            </CardHeader>
            <BreakdownTable breakdown={result.monthlyBreakdown} />
          </Card>
        </section>
      )}
    </PageContainer>
  );
}

