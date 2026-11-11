'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Share2, AlertCircle, Calendar, Filter, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { EvolutionBarChart } from '@/components/reports/EvolutionBarChart';
import { SummaryKpis } from '@/components/reports/SummaryKpis';
import { CategoryBreakdown } from '@/components/reports/CategoryBreakdown';
import { CumulativeBalanceChart } from '@/components/reports/CumulativeBalanceChart';
import { InsightsSection } from '@/components/reports/InsightsSection';
import { useDashboardSummary, useExpensesByCategory, useEvolution } from '@/hooks/use-dashboard';
import { useAccounts } from '@/hooks/use-accounts';
import { useCreditCards } from '@/hooks/use-credit-cards';
import { usePeriodParams } from '@/hooks/use-period-params';
import { useDevState } from '@/hooks/use-dev-state';
import { generateInsights } from '@/lib/insights';
import type { Period } from '@/types';

const PERIOD_BUTTONS: { key: Period; label: string }[] = [
  { key: 'DAY', label: 'Dia' },
  { key: 'WEEK', label: 'Semana' },
  { key: 'MONTH', label: 'Mês' },
  { key: 'YEAR', label: 'Ano' },
];

export default function ReportsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const devState = useDevState();

  const { period, date, from, to, setPeriod } = usePeriodParams();

  // Filtro opcional agrupado por Conta ou Cartão
  const [selectedEntity, setSelectedEntity] = useState<string>(''); // formato: "account:1" ou "card:2"

  const { data: accountsData } = useAccounts(false);
  const { data: cardsData } = useCreditCards(false);

  const {
    data: summary,
    isLoading: summaryLoading,
    isError: summaryError,
    refetch: refetchSummary,
  } = useDashboardSummary(period, date);

  const {
    data: categoriesData,
    isLoading: catLoading,
    isError: catError,
    refetch: refetchCat,
  } = useExpensesByCategory(period, date);

  const {
    data: evolution,
    isLoading: evoLoading,
    isError: evoError,
    refetch: refetchEvo,
  } = useEvolution(period, date);

  const showLoading =
    devState === 'loading' ||
    ((summaryLoading || catLoading || evoLoading) && devState !== 'empty' && devState !== 'error');
  const showError = devState === 'error' || ((summaryError || catError || evoError) && devState !== 'loading');

  const categories = categoriesData ?? [];
  const points = evolution?.points ?? [];

  const isEmptyPeriod =
    !showLoading &&
    !showError &&
    (summary?.totalIncome === 0 && summary?.totalExpense === 0 && categories.length === 0);

  const showEmpty = devState === 'empty' || isEmptyPeriod;

  // 3 Insights gerados por lógica pura
  const insights = useMemo(() => {
    return generateInsights(summary, categories, evolution);
  }, [summary, categories, evolution]);

  // Compartilhamento
  function handleShare() {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link do relatório copiado para a área de transferência!');
    } else {
      toast.info('Compartilhamento de relatório acionado.');
    }
  }

  // Verificação de intervalo customizado superior a 24 meses
  const isOver24Months = useMemo(() => {
    if (from && to) {
      const start = new Date(from);
      const end = new Date(to);
      const diffMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
      return diffMonths > 24;
    }
    return false;
  }, [from, to]);

  const topCategory = categories.length > 0 ? categories[0] : null;

  if (showError) {
    return (
      <div className="container mx-auto max-w-6xl p-4 lg:p-8 space-y-6">
        <EmptyState
          icon={AlertCircle}
          title="Erro ao carregar relatórios"
          description="Não foi possível obter os dados analíticos do período. Verifique sua conexão."
          actionLabel="Tentar novamente"
          onAction={() => {
            refetchSummary();
            refetchCat();
            refetchEvo();
          }}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl p-4 lg:p-8 space-y-8">
      {/* Topo: Título, Filtro de Período, Filtro de Entidade e Compartilhamento */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">Relatórios Financeiros</h1>
          <p className="text-sm text-text-muted">
            Análises profundas de fluxo de caixa, evolução patrimonial e categorização
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Seletor de Período Rápido */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-surface border border-border">
            {PERIOD_BUTTONS.map((p) => {
              const isActive = period === p.key;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setPeriod({ period: p.key })}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-text-muted hover:text-text'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Filtro Opcional de Conta / Cartão Agrupado */}
          <div className="w-48">
            <Select
              value={selectedEntity}
              onChange={(e) => setSelectedEntity(e.target.value)}
              className="text-xs py-1.5 h-9"
            >
              <option value="">Todas as contas e cartões</option>
              {accountsData?.accounts && accountsData.accounts.length > 0 && (
                <optgroup label="Contas Bancárias">
                  {accountsData.accounts.map((a) => (
                    <option key={`account:${a.id}`} value={`account:${a.id}`}>
                      {a.name}
                    </option>
                  ))}
                </optgroup>
              )}
              {cardsData && cardsData.length > 0 && (
                <optgroup label="Cartões de Crédito">
                  {cardsData.map((c) => (
                    <option key={`card:${c.id}`} value={`card:${c.id}`}>
                      {c.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </Select>
          </div>

          {/* Botão de Compartilhar */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="gap-2 text-xs h-9"
            title="Compartilhar relatório"
          >
            <Share2 size={15} />
            <span className="hidden sm:inline">Compartilhar</span>
          </Button>
        </div>
      </div>

      {/* Aviso de intervalo superior a 24 meses */}
      {isOver24Months && (
        <div className="flex items-start gap-3 rounded-2xl bg-warning-soft border border-warning/30 p-4 text-xs text-warning leading-relaxed">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-text">Intervalo superior a 24 meses</p>
            <p className="mt-0.5 text-text-muted">
              Para garantir máxima precisão e velocidade nos gráficos, recomendamos selecionar intervalos de até 2 anos.
            </p>
          </div>
        </div>
      )}

      {/* Estado Vazio de Período */}
      {showEmpty ? (
        <EmptyState
          icon={Calendar}
          title="Nenhuma movimentação neste período"
          description="Não encontramos receitas ou despesas registradas para este filtro temporal. Experimente selecionar outro período no topo da página."
          actionLabel="Ver mês atual"
          onAction={() => setPeriod({ period: 'MONTH', date: '2026-10-31' })}
        />
      ) : (
        <>
          {/* Layout Principal Desktop: 2/3 Gráfico de Evolução + 1/3 Cards de Resumo */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2">
              <EvolutionBarChart
                points={points}
                granularity={evolution?.granularity || 'DAY'}
                isLoading={showLoading}
              />
            </div>

            <div className="lg:col-span-1">
              <SummaryKpis
                summary={summary}
                topCategory={topCategory}
                periodQuery={`?period=${period}&date=${date}`}
              />
            </div>
          </div>

          {/* Cards de Insights Inteligentes baseados em lib/insights.ts */}
          <InsightsSection insights={insights} isLoading={showLoading} />

          {/* Análise por Categoria e Evolução Acumulada do Saldo */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <CategoryBreakdown
              categories={categories}
              total={summary?.totalExpense ?? 0}
              isLoading={showLoading}
            />

            <CumulativeBalanceChart
              points={points}
              isLoading={showLoading}
            />
          </div>
        </>
      )}
    </div>
  );
}

