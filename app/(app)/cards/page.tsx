'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, CreditCard as CardIcon, ChevronRight, MoreVertical, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ProgressBar } from '@/components/ui/progress-bar';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { VisualCard } from '@/components/cards/VisualCard';
import { CreditCardFormModal } from '@/components/cards/CreditCardFormModal';
import { InvoiceStatusBadge } from '@/components/cards/InvoiceStatusBadge';
import { useCreditCards, useDeleteCreditCard } from '@/hooks/use-credit-cards';
import { useDevState } from '@/hooks/use-dev-state';
import { formatMoney } from '@/lib/format/money';
import { formatDate } from '@/lib/format/date';
import { cn } from '@/lib/utils';
import type { CreditCard } from '@/types';

export default function CreditCardsPage() {
  const devState = useDevState();
  const { data: cards, isLoading, isError, refetch } = useCreditCards(false);
  const deleteMutation = useDeleteCreditCard();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);
  const [cardToDelete, setCardToDelete] = useState<CreditCard | null>(null);

  const showLoading = devState === 'loading' || (isLoading && devState !== 'empty' && devState !== 'error');
  const showError = devState === 'error' || (isError && devState !== 'loading');
  const showEmpty = devState === 'empty' || (!showLoading && !showError && (!cards || cards.length === 0));

  function handleOpenCreate() {
    setEditingCard(null);
    setIsFormOpen(true);
  }

  function handleOpenEdit(card: CreditCard) {
    setEditingCard(card);
    setIsFormOpen(true);
  }

  function handleConfirmDelete() {
    if (!cardToDelete) return;
    deleteMutation.mutate(cardToDelete.id, {
      onSettled: () => setCardToDelete(null),
    });
  }

  if (showError) {
    return (
      <div className="container mx-auto max-w-6xl p-4 lg:p-8 space-y-6">
        <EmptyState
          icon={AlertCircle}
          title="Erro ao carregar cartões"
          description="Não foi possível obter seus cartões de crédito. Verifique sua conexão e tente novamente."
          actionLabel="Tentar novamente"
          onAction={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl p-4 lg:p-8 space-y-8">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">Cartões de Crédito</h1>
          <p className="text-sm text-text-muted">
            Monitore seus limites, datas de fechamento e controle suas faturas mensais
          </p>
        </div>
        <Button variant="brand" onClick={handleOpenCreate} className="self-start sm:self-auto gap-2">
          <Plus size={18} />
          <span>Novo cartão</span>
        </Button>
      </div>

      {/* Grid de Cartões */}
      {showLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-96 rounded-3xl" />
          ))}
        </div>
      ) : showEmpty || !cards || cards.length === 0 ? (
        <EmptyState
          icon={CardIcon}
          title="Nenhum cartão cadastrado"
          description="Adicione seus cartões para gerenciar faturas, parcelamentos e limites de crédito em um só lugar."
          actionLabel="Cadastrar primeiro cartão"
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {cards.map((card) => {
            const usedPct = card.creditLimit > 0 ? (card.usedLimit / card.creditLimit) * 100 : 0;
            const isExceeded = card.availableLimit < 0;
            const exceededAmount = Math.abs(card.availableLimit);

            return (
              <Card key={card.id} className="p-5 sm:p-6 flex flex-col justify-between space-y-5">
                {/* Cartão Visual Realista */}
                <VisualCard card={card} size="md" />

                {/* Barra de Uso do Limite */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-text-muted">Limite Utilizado</span>
                    <span className="font-semibold tabular-nums text-text">
                      {formatMoney(card.usedLimit)} de {formatMoney(card.creditLimit)}
                    </span>
                  </div>

                  <ProgressBar
                    value={usedPct}
                    variant={isExceeded ? 'expense' : usedPct > 80 ? 'warning' : 'primary'}
                    aria-label={`Uso de limite do cartão ${card.name}`}
                  />

                  <div className="flex items-center justify-between text-xs">
                    {isExceeded ? (
                      <span className="font-bold text-expense tabular-nums">
                        Limite excedido em {formatMoney(exceededAmount)}
                      </span>
                    ) : (
                      <span className="text-text-muted">
                        Disponível:{' '}
                        <strong className="text-text tabular-nums font-semibold">
                          {formatMoney(card.availableLimit)}
                        </strong>
                      </span>
                    )}
                    <span className="text-text-muted tabular-nums">
                      {Math.round(usedPct)}% do total
                    </span>
                  </div>
                </div>

                {/* Datas de Fechamento e Vencimento */}
                <div className="rounded-2xl bg-surface-soft p-3.5 border border-border flex items-center justify-between text-xs">
                  <span className="text-text-muted">Ciclo da fatura</span>
                  <span className="font-semibold text-text">
                    Fecha dia {card.closingDay} · Vence dia {card.dueDay}
                  </span>
                </div>

                {/* Resumo da Fatura Atual */}
                <div className="rounded-2xl border border-border/80 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                        Fatura Atual ({card.currentInvoice.reference})
                      </p>
                      <p className="text-xl font-bold tabular-nums text-text mt-0.5">
                        {formatMoney(card.currentInvoice.total)}
                      </p>
                    </div>
                    <InvoiceStatusBadge status={card.currentInvoice.status} />
                  </div>

                  <div className="flex items-center justify-between text-xs text-text-muted pt-2 border-t border-border/60">
                    <span>Vencimento: {formatDate(card.currentInvoice.dueDate)}</span>
                    <Link
                      href={`/cards/${card.id}/invoices/${card.currentInvoice.reference}`}
                      className="font-semibold text-primary hover:underline flex items-center gap-0.5"
                    >
                      <span>Ver fatura</span>
                      <ChevronRight size={14} />
                    </Link>
                  </div>
                </div>

                {/* Ações do Cartão */}
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(card)}
                      className="gap-1.5 text-xs"
                    >
                      <Edit2 size={14} />
                      <span>Editar</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCardToDelete(card)}
                      className="gap-1.5 text-xs text-expense hover:bg-expense-soft"
                    >
                      <Trash2 size={14} />
                      <span>Excluir</span>
                    </Button>
                  </div>

                  <Link href={`/cards/${card.id}`}>
                    <Button variant="brand" size="sm" className="gap-1.5 text-xs">
                      <span>Ver histórico</span>
                      <ChevronRight size={14} />
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal de Criação / Edição */}
      <CreditCardFormModal
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        card={editingCard}
      />

      {/* Confirmação de Exclusão */}
      <ConfirmDialog
        open={!!cardToDelete}
        onClose={() => setCardToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Arquivar ou Excluir Cartão"
        description="Cartões com faturas ou compras registradas são arquivados, mantendo todo o histórico e relatórios preservados."
        confirmLabel="Confirmar"
        cancelLabel="Cancelar"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

