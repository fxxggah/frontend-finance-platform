'use client';

import { useState } from 'react';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { CategoryIcon } from '@/components/icons/CategoryIcon';
import { Badge } from '@/components/ui/badge';
import { Sheet } from '@/components/ui/sheet';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { formatMoney } from '@/lib/format/money';
import { formatDate, formatLongDate } from '@/lib/format/date';
import { useDeleteTransaction } from '@/hooks/use-transactions';
import type { Transaction } from '@/types';

interface TransactionListProps {
  transactions: Transaction[];
  isLoading?: boolean;
  onEdit?: (tx: Transaction) => void;
}

function groupByDate(transactions: Transaction[]): [string, Transaction[]][] {
  const groups = new Map<string, Transaction[]>();
  for (const tx of transactions) {
    const key = tx.date;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(tx);
  }
  return Array.from(groups.entries()).sort(([a], [b]) => b.localeCompare(a));
}

function TransactionItem({
  tx,
  onEdit,
}: {
  tx: Transaction;
  onEdit?: (tx: Transaction) => void;
}) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { mutate: deleteTx, isPending } = useDeleteTransaction();

  const target = tx.account?.name ?? tx.creditCard?.name ?? '—';
  const signClass = tx.type === 'INCOME' ? 'text-income' : 'text-expense';
  const signChar = tx.type === 'INCOME' ? '+ ' : '− ';

  return (
    <>
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3">
        <span
          className="grid shrink-0 place-items-center rounded-full"
          style={{
            backgroundColor: `${tx.category.color}20`,
            color: tx.category.color,
            width: 36,
            height: 36,
          }}
        >
          <CategoryIcon name={tx.category.icon} className="size-4" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-text">{tx.description}</p>
            {tx.installment && (
              <Badge className="bg-surface-soft px-2 py-0.5 text-[10px] text-text-muted">
                {tx.installment.number}/{tx.installment.total}
              </Badge>
            )}
          </div>
          <p className="mt-0.5 text-xs text-text-muted">
            {tx.category.name} · {target}
          </p>
        </div>

        <p className={`shrink-0 tabular-nums text-sm font-bold ${signClass}`}>
          {signChar}
          {formatMoney(tx.amount, { signDisplay: 'never' })}
        </p>

        <button
          onClick={() => setSheetOpen(true)}
          aria-label="Opções da transação"
          className="grid size-9 shrink-0 place-items-center rounded-xl text-text-muted transition hover:bg-surface-soft"
        >
          <MoreHorizontal className="size-4" />
        </button>
      </div>

      {/* Sheet de detalhes */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen} title={tx.description}>
        <div className="space-y-4">
          <div className="rounded-2xl bg-surface-soft p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-muted">Valor</span>
              <span className={`tabular-nums font-bold ${signClass}`}>
                {signChar}{formatMoney(tx.amount, { signDisplay: 'never' })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Data</span>
              <span className="font-semibold text-text">{formatDate(tx.date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Categoria</span>
              <span className="font-semibold text-text">{tx.category.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Destino</span>
              <span className="font-semibold text-text">{target}</span>
            </div>
            {tx.installment && (
              <div className="flex justify-between">
                <span className="text-text-muted">Parcela</span>
                <span className="font-semibold text-text">
                  {tx.installment.number}/{tx.installment.total}
                </span>
              </div>
            )}
            {tx.notes && (
              <div>
                <span className="text-text-muted">Observações</span>
                <p className="mt-1 font-semibold text-text">{tx.notes}</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                setSheetOpen(false);
                onEdit?.(tx);
              }}
              className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-surface py-3 text-sm font-semibold text-text transition hover:bg-surface-soft"
            >
              <Pencil className="size-4" />
              Editar
            </button>
            <button
              onClick={() => setConfirmOpen(true)}
              className="flex items-center justify-center gap-2 rounded-2xl bg-expense-soft py-3 text-sm font-semibold text-expense transition hover:opacity-90"
            >
              <Trash2 className="size-4" />
              Excluir
            </button>
          </div>
        </div>
      </Sheet>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Excluir transação"
        description="Esta ação não pode ser desfeita. Deseja realmente excluir esta transação?"
        confirmLabel="Excluir"
        onConfirm={() => {
          deleteTx(tx.id);
          setConfirmOpen(false);
          setSheetOpen(false);
        }}
        isPending={isPending}
      />
    </>
  );
}

export function TransactionList({ transactions, isLoading, onEdit }: TransactionListProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i}>
            <Skeleton className="mb-3 h-5 w-32 rounded-xl" />
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, j) => (
                <Skeleton key={j} className="h-16 rounded-2xl" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-8 text-center">
        <p className="font-semibold text-text">Nenhuma transação encontrada</p>
        <p className="mt-1 text-sm text-text-muted">
          Tente ajustar os filtros ou registre uma nova transação.
        </p>
      </div>
    );
  }

  const groups = groupByDate(transactions);

  return (
    <div className="space-y-6 lg:hidden">
      {groups.map(([date, txs]) => {
        const dayTotal = txs.reduce(
          (sum, t) => sum + (t.type === 'INCOME' ? t.amount : -t.amount),
          0
        );
        return (
          <div key={date}>
            <div className="mb-2 flex items-center justify-between px-1">
              <h3 className="text-sm font-bold text-text-muted capitalize">
                {formatLongDate(date)}
              </h3>
              <span
                className={`tabular-nums text-xs font-bold ${
                  dayTotal >= 0 ? 'text-income' : 'text-expense'
                }`}
              >
                {formatMoney(dayTotal, { showSign: true })}
              </span>
            </div>
            <div className="space-y-2">
              {txs.map((tx) => (
                <TransactionItem key={tx.id} tx={tx} onEdit={onEdit} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

