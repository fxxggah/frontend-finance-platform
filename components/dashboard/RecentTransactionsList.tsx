'use client';

import Link from 'next/link';
import { CategoryIcon } from '@/components/icons/CategoryIcon';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatMoney } from '@/lib/format/money';
import { formatDate } from '@/lib/format/date';
import type { Transaction } from '@/types';

interface RecentTransactionsListProps {
  transactions: Transaction[];
  isLoading?: boolean;
}

function TransactionRow({ item }: { item: Transaction }) {
  const target = item.account?.name ?? item.creditCard?.name ?? '—';
  const signClass = item.type === 'INCOME' ? 'text-income' : 'text-expense';
  const signChar = item.type === 'INCOME' ? '+ ' : '− ';

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3 sm:p-4">
      <span
        className="grid shrink-0 place-items-center rounded-full"
        style={{
          backgroundColor: `${item.category.color}20`,
          color: item.category.color,
          width: 36,
          height: 36,
        }}
      >
        <CategoryIcon name={item.category.icon} className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-text">{item.description}</p>
          {item.installment && (
            <Badge className="bg-surface-soft px-2 py-0.5 text-[10px] text-text-muted">
              {item.installment.number}/{item.installment.total}
            </Badge>
          )}
        </div>
        <p className="mt-0.5 text-xs text-text-muted">
          {formatDate(item.date)} · {target}
        </p>
      </div>
      <p className={`shrink-0 tabular-nums text-sm font-bold ${signClass}`}>
        {signChar}
        {formatMoney(item.amount, { signDisplay: 'never' })}
      </p>
    </div>
  );
}

export function RecentTransactionsList({ transactions, isLoading }: RecentTransactionsListProps) {
  return (
    <section className="mt-9">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-text">Transações recentes</h2>
        <Link
          href="/transactions"
          className="text-sm font-bold text-primary hover:underline"
          aria-label="Ver todas as transações"
        >
          Ver todas
        </Link>
      </div>

      {/* Mobile: lista de cards */}
      <div className="grid gap-2 lg:hidden">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)
          : transactions.map((item) => <TransactionRow key={item.id} item={item} />)}
      </div>

      {/* Desktop: tabela */}
      <div className="hidden overflow-hidden rounded-3xl border border-border bg-surface lg:block">
        <div className="grid grid-cols-[110px_1.7fr_1fr_1fr_150px] gap-4 border-b border-border px-5 py-4 text-xs font-bold uppercase tracking-wider text-text-muted">
          <span>Data</span>
          <span>Descrição</span>
          <span>Categoria</span>
          <span>Conta ou cartão</span>
          <span className="text-right">Valor</span>
        </div>
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="grid grid-cols-[110px_1.7fr_1fr_1fr_150px] items-center gap-4 border-b border-border px-5 py-4 last:border-0">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="ml-auto h-4 w-20" />
              </div>
            ))
          : transactions.map((item) => {
              const signClass = item.type === 'INCOME' ? 'text-income' : 'text-expense';
              const signChar = item.type === 'INCOME' ? '+ ' : '− ';
              return (
                <div
                  key={item.id}
                  className="grid grid-cols-[110px_1.7fr_1fr_1fr_150px] items-center gap-4 border-b border-border px-5 py-4 last:border-0"
                >
                  <span className="text-sm text-text-muted">{formatDate(item.date)}</span>
                  <div className="flex items-center gap-3">
                    <span
                      className="grid shrink-0 place-items-center rounded-full"
                      style={{
                        backgroundColor: `${item.category.color}20`,
                        color: item.category.color,
                        width: 30,
                        height: 30,
                      }}
                    >
                      <CategoryIcon name={item.category.icon} className="size-3.5" />
                    </span>
                    <span className="text-sm font-semibold text-text">{item.description}</span>
                    {item.installment && (
                      <Badge className="bg-surface-soft px-2 py-0.5 text-[10px]">
                        {item.installment.number}/{item.installment.total}
                      </Badge>
                    )}
                  </div>
                  <Badge
                    style={{
                      backgroundColor: `${item.category.color}18`,
                      color: item.category.color,
                    }}
                    className="w-fit"
                  >
                    {item.category.name}
                  </Badge>
                  <span className="text-sm text-text-muted">
                    {item.account?.name ?? item.creditCard?.name ?? '—'}
                  </span>
                  <span className={`text-right tabular-nums text-sm font-bold ${signClass}`}>
                    {signChar}
                    {formatMoney(item.amount, { signDisplay: 'never' })}
                  </span>
                </div>
              );
            })}
      </div>
    </section>
  );
}
