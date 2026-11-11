'use client';

import Link from 'next/link';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { formatMoney } from '@/lib/format/money';
import { formatDate } from '@/lib/format/date';
import type { RecentTransaction } from '@/types';

export function RecentTransactionsList({ transactions }: { transactions: RecentTransaction[] }) {
  return (
    <section className="mt-9">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-text">Transações recentes</h2>
        <Link href="/transactions" className="inline-flex min-h-11 items-center text-sm font-bold text-primary hover:underline">Ver todas</Link>
      </div>
      <Card className="divide-y divide-border px-4">
        {transactions.length === 0
          ? <p className="py-6 text-sm text-text-muted">Nenhuma transação registrada.</p>
          : transactions.map(item => {
            const income = item.type === 'INCOME';
            const Icon = income ? ArrowDownLeft : ArrowUpRight;
            return (
              <div key={item.id} className="flex items-center gap-3 py-4">
                <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${income ? 'bg-income-soft text-income' : 'bg-expense-soft text-expense'}`}>
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-text">{item.categoryName}</p>
                  <p className="text-xs text-text-muted">
                    {income ? 'Receita' : 'Despesa'} · {formatDate(item.date)}
                    {(item.accountName ?? item.creditCardName) && ` · ${item.accountName ?? item.creditCardName}`}
                  </p>
                </div>
                <p className={`shrink-0 tabular-nums text-sm font-bold ${income ? 'text-income' : 'text-expense'}`}>
                  {income ? '+ ' : '− '}{formatMoney(item.amount)}
                </p>
              </div>
            );
          })}
      </Card>
    </section>
  );
}
