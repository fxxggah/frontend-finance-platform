'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Pencil, Trash2 } from 'lucide-react';
import { CategoryIcon } from '@/components/icons/CategoryIcon';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { formatMoney } from '@/lib/format/money';
import { formatDate } from '@/lib/format/date';
import { useDeleteTransaction } from '@/hooks/use-transactions';
import type { Transaction } from '@/types';

type SortKey = 'date' | 'amount';
type SortDir = 'asc' | 'desc';

interface TransactionTableProps {
  transactions: Transaction[];
  isLoading?: boolean;
  onEdit?: (tx: Transaction) => void;
}

export function TransactionTable({ transactions, isLoading, onEdit }: TransactionTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const { mutate: deleteTx, isPending } = useDeleteTransaction();

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const sorted = [...transactions].sort((a, b) => {
    const mult = sortDir === 'asc' ? 1 : -1;
    if (sortKey === 'date') return a.date.localeCompare(b.date) * mult;
    return (a.amount - b.amount) * mult;
  });

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return null;
    return sortDir === 'asc' ? (
      <ChevronUp className="inline size-3" />
    ) : (
      <ChevronDown className="inline size-3" />
    );
  }

  if (isLoading) {
    return (
      <div className="hidden overflow-x-auto rounded-3xl border border-border bg-surface lg:block">
        <div className="grid min-w-[880px] grid-cols-[110px_1.7fr_1fr_1fr_150px_100px] gap-4 border-b border-border px-5 py-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-4" />
          ))}
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="grid min-w-[880px] grid-cols-[110px_1.7fr_1fr_1fr_150px_100px] items-center gap-4 border-b border-border px-5 py-4 last:border-0">
            {Array.from({ length: 6 }).map((_, j) => (
              <Skeleton key={j} className="h-4" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto rounded-3xl border border-border bg-surface lg:block">
        <div className="grid min-w-[880px] grid-cols-[110px_1.7fr_1fr_1fr_150px_100px] gap-4 border-b border-border px-5 py-4 text-xs font-semibold uppercase tracking-wider text-text-muted">
          <button onClick={() => toggleSort('date')} className="flex min-h-11 items-center gap-1 text-left hover:text-text">
            Data <SortIcon col="date" />
          </button>
          <span>Descrição</span>
          <span>Categoria</span>
          <span>Conta / Cartão</span>
          <button onClick={() => toggleSort('amount')} className="flex min-h-11 items-center justify-end gap-1 text-right hover:text-text">
            Valor <SortIcon col="amount" />
          </button>
          <span />
        </div>

        {sorted.map((tx) => {
          const signClass = tx.type === 'INCOME' ? 'text-income' : 'text-expense';
          const signChar = tx.type === 'INCOME' ? '+ ' : '− ';
          return (
            <div
              key={tx.id}
              className="grid min-w-[880px] grid-cols-[110px_1.7fr_1fr_1fr_150px_100px] items-center gap-4 border-b border-border px-5 py-4 last:border-0 hover:bg-surface-soft"
            >
              <span className="text-sm text-text-muted">{formatDate(tx.date)}</span>
              <div className="flex items-center gap-3">
                <span
                  className="grid shrink-0 place-items-center rounded-full"
                  style={{
                    backgroundColor: `${tx.category.color}20`,
                    color: tx.category.color,
                    width: 30,
                    height: 30,
                  }}
                >
                  <CategoryIcon name={tx.category.icon} className="size-3.5" />
                </span>
                <span className="text-sm font-semibold text-text">{tx.description}</span>
                {tx.installment && (
                  <Badge className="bg-surface-soft px-2 py-0.5 text-[10px]">
                    {tx.installment.number}/{tx.installment.total}
                  </Badge>
                )}
              </div>
              <Badge
                style={{
                  backgroundColor: `${tx.category.color}18`,
                  color: tx.category.color,
                }}
                className="w-fit"
              >
                {tx.category.name}
              </Badge>
              <span className="text-sm text-text-muted">
                {tx.account?.name ?? tx.creditCard?.name ?? '—'}
              </span>
              <span className={`text-right tabular-nums text-sm font-bold ${signClass}`}>
                {signChar}{formatMoney(tx.amount, { signDisplay: 'never' })}
              </span>
              <div className="flex min-h-11 items-center justify-end gap-1">
                <button
                  onClick={() => onEdit?.(tx)}
                  aria-label="Editar transação"
                  className="grid size-11 place-items-center rounded-xl text-text-muted transition hover:bg-surface-soft hover:text-primary"
                >
                  <Pencil className="size-3.5" />
                </button>
                <button
                  onClick={() => setConfirmId(tx.id)}
                  aria-label="Excluir transação"
                  className="grid size-11 place-items-center rounded-xl text-text-muted transition hover:bg-expense-soft hover:text-expense"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <ConfirmDialog
        open={confirmId !== null}
        onOpenChange={(open) => !open && setConfirmId(null)}
        title="Excluir transação"
        description="Esta ação não pode ser desfeita. Deseja realmente excluir esta transação?"
        confirmLabel="Excluir"
        onConfirm={() => {
          if (confirmId !== null) {
            deleteTx(confirmId);
            setConfirmId(null);
          }
        }}
        isPending={isPending}
      />
    </>
  );
}

