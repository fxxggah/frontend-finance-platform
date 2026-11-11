'use client';

import Link from 'next/link';
import { ArrowDownLeft, ArrowUpRight, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { formatMoney } from '@/lib/format/money';
import { formatDate } from '@/lib/format/date';
import type { RecentTransaction } from '@/types';
import { SectionHeader } from '@/components/ui/page';

export function RecentTransactionsList({ transactions }: { transactions: RecentTransaction[] }) {
  return (
    <section className="mt-9">
      <SectionHeader title="Últimas movimentações" description="Os movimentos mais recentes das suas finanças."
        action={<Link href="/transactions" className="inline-flex min-h-11 shrink-0 items-center gap-2 text-xs font-semibold text-primary hover:underline">Ver todas <ArrowRight className="size-3.5" aria-hidden="true" /></Link>} />
      <Card className="divide-y divide-border rounded-3xl px-4 shadow-none sm:px-6">
        {transactions.length === 0
          ? <p className="py-6 text-sm text-text-muted">Nenhuma transação registrada.</p>
          : transactions.map(item => {
            const income = item.type === 'INCOME';
            const Icon = income ? ArrowDownLeft : ArrowUpRight;
            return (
              <div key={item.id} className="flex items-center gap-3 py-5">
                <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${income ? 'bg-income-soft text-income' : 'bg-expense-soft text-expense'}`}>
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-text">{item.categoryName}</p>
                  <p className="mt-1 text-xs leading-relaxed text-text-muted">
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
