'use client';

import { AlertCircle, Wallet } from 'lucide-react';
import styles from '@/components/ui/surfaces.module.css';
import { PageContainer, PageHeader } from '@/components/ui/page';
import { useRouter } from 'next/navigation';
import { HeroBalanceCard } from './HeroBalanceCard';
import { QuickActions } from './QuickActions';
import { KpiCards } from './KpiCards';
import { PeriodSelect } from './PeriodSelect';
import { FinancialSections } from './financial-sections';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { useDashboardSummary, useEvolution, useExpensesByCategory, useRecentTransactions } from '@/hooks/use-dashboard';
import { useAccounts } from '@/hooks/use-accounts';
import { useGoals } from '@/hooks/use-goals';
import { usePeriodParams } from '@/hooks/use-period-params';
import { useDevState } from '@/hooks/use-dev-state';

export function Dashboard() {
  const router = useRouter();
  const state = useDevState();
  const { period, date, from, to } = usePeriodParams();
  const filters = { from, to };
  const summary = useDashboardSummary(period, date, filters);
  const accounts = useAccounts();
  const evolution = useEvolution(period, date, filters);
  const categories = useExpensesByCategory(period, date, filters);
  const recent = useRecentTransactions();
  const goals = useGoals(undefined, 'ACTIVE');
  const queries = [summary, accounts, evolution, categories, recent, goals];
  const loading = state === 'loading' || (!state && queries.some(query => query.isPending));
  const error = state === 'error' || (!state && queries.some(query => query.isError));
  const retry = () => { queries.forEach(query => { void query.refetch(); }); };

  if (loading) return (
    <PageContainer className="space-y-6" role="status" aria-label="Carregando início">
      <Skeleton className="h-20 w-64 rounded-2xl" />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,1fr)]">
        <Skeleton className="h-[340px] rounded-3xl" /><Skeleton className="h-[340px] rounded-3xl" />
      </div>
      <Skeleton className="h-24 rounded-3xl" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-80 rounded-3xl" /><Skeleton className="h-80 rounded-3xl" />
      </div>
    </PageContainer>
  );

  if (state === 'empty') return <div className={styles.state}><EmptyState icon={Wallet} title="Seu próximo passo começa aqui"
    description="Registre uma transação para acompanhar suas finanças." actionLabel="Nova transação"
    onAction={() => router.push('/transactions/new')} /></div>;

  if (error || !summary.data || !accounts.data || !evolution.data || !categories.data || !recent.data || !goals.data) return (
    <div className={styles.state}><EmptyState icon={AlertCircle} title="Não foi possível carregar seus dados"
      description="Verifique sua conexão e tente novamente." actionLabel="Tentar novamente" onAction={retry} /></div>
  );

  const empty = (
    summary.data.totalIncome === 0 && summary.data.totalExpense === 0 &&
    categories.data.length === 0
  );

  return (
    <PageContainer>
      <PageHeader className="mb-7" title="Início" eyebrow="Visão geral" />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,1fr)]">
        <section aria-label="Patrimônio e resumo financeiro" className="min-w-0">
          <HeroBalanceCard summary={summary.data} totalBalance={accounts.data.totalBalance} creditCardDebt={accounts.data.creditCardDebt} />
        </section>
        <PeriodSelect from={summary.data.from} to={summary.data.to} />
      </div>
      <div className="mt-4"><QuickActions /></div>
      <KpiCards summary={summary.data} creditCardDebt={accounts.data.creditCardDebt} />
      {empty && <div className="mt-9"><EmptyState icon={Wallet} title="Nenhuma movimentação neste período"
        description="Registre uma transação para acompanhar suas finanças."
        actionLabel="Nova transação" onAction={() => router.push('/transactions/new')} /></div>}
      <FinancialSections points={empty ? [] : evolution.data.points} period={period} categories={empty ? [] : categories.data}
        totalExpense={summary.data.totalExpense} goals={goals.data}
        transactions={recent.data} showCharts={!empty} />
    </PageContainer>
  );
}
