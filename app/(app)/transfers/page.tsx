'use client';

import { useState } from 'react';
import { Plus, ArrowLeftRight, ArrowRight, Trash2, Info, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { TransferForm } from '@/components/transactions/TransferForm';
import { useTransfers, useDeleteTransfer } from '@/hooks/use-transfers';
import { useDevState } from '@/hooks/use-dev-state';
import { formatMoney } from '@/lib/format/money';
import { formatDate } from '@/lib/format/date';

export default function TransfersPage() {
  const devState = useDevState();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [transferToDelete, setTransferToDelete] = useState<number | null>(null);

  const { data: pageData, isLoading, isError, refetch } = useTransfers({
    page: 0,
    size: 50,
  });
  const deleteMutation = useDeleteTransfer();

  const showLoading = devState === 'loading' || (isLoading && devState !== 'empty' && devState !== 'error');
  const showError = devState === 'error' || (isError && devState !== 'loading');

  const transfers = pageData?.content ?? [];
  const showEmpty = devState === 'empty' || (!showLoading && !showError && transfers.length === 0);

  function handleConfirmDelete() {
    if (transferToDelete === null) return;
    deleteMutation.mutate(transferToDelete, {
      onSettled: () => setTransferToDelete(null),
    });
  }

  if (showError) {
    return (
      <div className="container mx-auto max-w-4xl p-4 lg:p-8 space-y-6">
        <EmptyState
          icon={AlertCircle}
          title="Erro ao carregar transferências"
          description="Não foi possível obter o histórico de transferências. Verifique sua conexão."
          actionLabel="Tentar novamente"
          onAction={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl p-4 lg:p-8 space-y-8">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">Transferências</h1>
          <p className="text-sm text-text-muted">
            Histórico e movimentações financeiras entre suas contas
          </p>
        </div>
        <Button variant="brand" onClick={() => setIsFormOpen(true)} className="self-start sm:self-auto gap-2">
          <Plus size={18} />
          <span>Nova transferência</span>
        </Button>
      </div>

      {/* Nota Conceitual Obrigatória */}
      <div className="flex items-start gap-3 rounded-2xl border border-border bg-surface-soft p-4 text-xs text-text-muted leading-relaxed">
        <Info size={18} className="text-primary shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-text">Transferências não contam como receita nem despesa</p>
          <p className="mt-0.5 text-text-muted">
            Ao transferir dinheiro de uma conta para outra, o patrimônio total permanece inalterado. Somente os saldos individuais das contas de origem e destino são recalculados.
          </p>
        </div>
      </div>

      {/* Lista de Transferências */}
      <section className="space-y-4">
        {showLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))}
          </div>
        ) : showEmpty ? (
          <EmptyState
            icon={ArrowLeftRight}
            title="Nenhuma transferência registrada"
            description="Realize sua primeira transferência entre contas quando movimentar recursos."
            actionLabel="Nova transferência"
            onAction={() => setIsFormOpen(true)}
          />
        ) : (
          <div className="space-y-3">
            {transfers.map((t) => (
              <Card
                key={t.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-primary/30 transition-colors"
              >
                {/* Contas Origem -> Destino */}
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2.5 text-sm font-semibold text-text">
                    <span className="truncate">{t.fromAccount.name}</span>
                    <ArrowRight size={15} className="shrink-0 text-text-muted" />
                    <span className="truncate">{t.toAccount.name}</span>
                  </div>

                  {t.description && (
                    <p className="text-xs text-text-muted truncate">{t.description}</p>
                  )}

                  <p className="text-[11px] text-text-muted">{formatDate(t.date)}</p>
                </div>

                {/* Valor Neutro e Ações */}
                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <div className="text-right">
                    <span className="text-base font-bold tabular-nums text-text">
                      {formatMoney(t.amount)}
                    </span>
                    <span className="block text-[10px] uppercase font-semibold text-text-muted">
                      Movimentação
                    </span>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setTransferToDelete(t.id)}
                    aria-label="Excluir transferência"
                    className="size-9 p-0 text-text-muted hover:bg-expense-soft hover:text-expense rounded-xl"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Modal de Nova Transferência */}
      <TransferForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
      />

      {/* Confirmação de Exclusão */}
      <ConfirmDialog
        open={transferToDelete !== null}
        onClose={() => setTransferToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Excluir Transferência"
        description="Deseja realmente remover esta transferência? Os saldos das contas envolvidas serão recalculados."
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

