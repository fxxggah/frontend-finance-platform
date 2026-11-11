'use client';

import { useState } from 'react';
import { ArrowRight, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { formatMoney } from '@/lib/format/money';
import { formatDate } from '@/lib/format/date';
import { useDeleteTransfer } from '@/hooks/use-transfers';
import type { Transfer } from '@/types';

interface TransferListProps {
  transfers: Transfer[];
  isLoading?: boolean;
}

export function TransferList({ transfers, isLoading }: TransferListProps) {
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const { mutate: deleteTransfer, isPending } = useDeleteTransfer();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (transfers.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="font-semibold text-text">Nenhuma transferência encontrada</p>
        <p className="mt-1 text-sm text-text-muted">
          Registre uma transferência entre suas contas.
        </p>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {transfers.map((t) => (
          <Card key={t.id} className="flex items-center gap-4 p-4">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-text">{t.fromAccount.name}</p>
              </div>
              <ArrowRight className="size-4 shrink-0 text-text-muted" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-text">{t.toAccount.name}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="tabular-nums text-sm font-bold text-primary">
                {formatMoney(t.amount)}
              </p>
              <p className="text-xs text-text-muted">{formatDate(t.date)}</p>
            </div>
            <button
              onClick={() => setConfirmId(t.id)}
              aria-label="Excluir transferência"
              className="grid size-9 shrink-0 place-items-center rounded-xl text-text-muted transition hover:bg-expense-soft hover:text-expense"
            >
              <Trash2 className="size-4" />
            </button>
          </Card>
        ))}
      </div>

      <ConfirmDialog
        open={confirmId !== null}
        onOpenChange={(open) => !open && setConfirmId(null)}
        title="Excluir transferência"
        description="Esta ação não pode ser desfeita. Deseja realmente excluir esta transferência?"
        confirmLabel="Excluir"
        onConfirm={() => {
          if (confirmId !== null) {
            deleteTransfer(confirmId);
            setConfirmId(null);
          }
        }}
        isPending={isPending}
      />
    </>
  );
}

