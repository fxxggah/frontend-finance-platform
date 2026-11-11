'use client';

import { PageContainer, PageHeader } from '@/components/ui/page';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, ArrowLeftRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { FilterBar } from '@/components/transactions/FilterBar';
import { FilterSummary } from '@/components/transactions/FilterSummary';
import { TransactionList } from '@/components/transactions/TransactionList';
import { TransactionTable } from '@/components/transactions/TransactionTable';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { TransferList } from '@/components/transactions/TransferList';
import { TransferForm } from '@/components/transactions/TransferForm';
import { useTransactions } from '@/hooks/use-transactions';
import { useTransfers } from '@/hooks/use-transfers';
import { useDashboardSummary } from '@/hooks/use-dashboard';
import { usePeriodParams } from '@/hooks/use-period-params';
import { useDevState } from '@/hooks/use-dev-state';
import { formatDate } from '@/lib/format/date';
import type { Transaction } from '@/types';

function TransactionsContent() {
  const params = useSearchParams();
  const router = useRouter();
  const devState = useDevState();
  const { period, date, from, to } = usePeriodParams();
  const summary = useDashboardSummary(period, date, { from, to });
  const [editing, setEditing] = useState<Transaction | null>(null);
  const page = Math.max(0, Number(params.get('page')) || 0);
  const type = params.get('type');
  const numberParam = (key: string) => Number(params.get(key)) || undefined;
  const query = useTransactions({
    from: summary.data?.from, to: summary.data?.to,
    type: type === 'INCOME' || type === 'EXPENSE' ? type : undefined,
    categoryId: numberParam('categoryId'), accountId: numberParam('accountId'),
    creditCardId: numberParam('creditCardId'), q: params.get('q') || undefined,
    page, size: 20, sort: 'date,desc',
  }, !!summary.data);
  const loading = devState === 'loading' || (!devState && (summary.isPending || query.isPending));
  const error = devState === 'error' || (!devState && (summary.isError || query.isError));
  const empty = devState === 'empty' || (!loading && !error && query.data?.content.length === 0);
  function setPage(nextPage: number) {
    const next = new URLSearchParams(params.toString());
    next.set('page', String(nextPage));
    router.push(`/transactions?${next.toString()}`);
  }
  return <div className="space-y-5">
    <FilterBar />
    {summary.data && !loading && <p className="text-sm text-text-muted">{formatDate(summary.data.from)} a {formatDate(summary.data.to)}</p>}
    {error ? <EmptyState icon={AlertCircle} title="Erro ao carregar transações"
      description="Não foi possível consultar seus lançamentos." actionLabel="Tentar novamente"
      onAction={() => { void summary.refetch(); void query.refetch(); }} />
      : loading ? <Skeleton className="h-80 rounded-2xl" />
      : empty ? <EmptyState icon={ArrowLeftRight} title="Nenhuma transação encontrada"
        description="Ajuste os filtros ou registre uma nova movimentação." />
      : query.data && <>
        <FilterSummary data={query.data} />
        <div className="lg:hidden"><TransactionList transactions={query.data.content} onEdit={setEditing} /></div>
        <div className="hidden lg:block"><TransactionTable transactions={query.data.content} onEdit={setEditing} /></div>
        <div className="flex items-center justify-between gap-3">
          <Button variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>Anterior</Button>
          <span className="tabular-nums text-sm text-text-muted">Página {page + 1} de {query.data.totalPages}</span>
          <Button variant="outline" disabled={page + 1 >= query.data.totalPages} onClick={() => setPage(page + 1)}>Próxima</Button>
        </div>
      </>}
    <TransactionForm open={editing !== null} editing={editing} onOpenChange={open => { if (!open) setEditing(null); }} />
  </div>;
}

function TransfersContent() {
  const state = useDevState();
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(0);
  const query = useTransfers({ page, size: 20 });
  return <div className="space-y-5">
    <Button variant="brand" onClick={() => setOpen(true)}>Nova transferência</Button>
    {state === 'error' || (!state && query.isError)
      ? <EmptyState icon={AlertCircle} title="Erro ao carregar transferências" actionLabel="Tentar novamente" onAction={() => void query.refetch()} />
      : <TransferList transfers={state === 'empty' ? [] : query.data?.content ?? []} isLoading={state === 'loading' || (!state && query.isPending)} />}
    {query.data && query.data.totalPages > 1 && <div className="flex justify-between gap-3">
      <Button variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>Anterior</Button>
      <Button variant="outline" disabled={page + 1 >= query.data.totalPages} onClick={() => setPage(page + 1)}>Próxima</Button>
    </div>}
    <TransferForm open={open} onOpenChange={setOpen} />
  </div>;
}

export default function TransactionsPage() {
  const params = useSearchParams();
  const transfers = params.get('tab') === 'transfers';
  return <PageContainer className="space-y-6">
    <PageHeader title="Transações" action={<><Link href="/transactions/new" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white"><Plus className="size-4" aria-hidden="true" />Nova transação</Link></>} />
    <nav aria-label="Tipo de movimentação" className="flex w-fit max-w-full flex-wrap gap-1 rounded-2xl bg-surface-soft p-1">
      <Link href="/transactions" aria-current={!transfers ? 'page' : undefined} className={`inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold ${!transfers ? 'bg-primary text-white' : 'text-text-muted hover:text-text'}`}>Transações</Link>
      <Link href="/transactions?tab=transfers" aria-current={transfers ? 'page' : undefined} className="inline-flex min-h-11 items-center text-sm font-semibold text-primary">Transferências</Link>
    </nav>
    {transfers ? <TransfersContent /> : <TransactionsContent />}
  </PageContainer>;
}
