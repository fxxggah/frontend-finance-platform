'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CreditCard as CardIcon, DollarSign, RotateCcw, Info, ShoppingBag, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { CategoryIcon } from '@/components/icons/CategoryIcon';
import { InvoiceStatusBadge } from '@/components/cards/InvoiceStatusBadge';
import { InvoicePayModal } from '@/components/cards/InvoicePayModal';
import { useCreditCard, useDeleteInvoicePayment, useInvoiceDetail } from '@/hooks/use-credit-cards';
import { useDevState } from '@/hooks/use-dev-state';
import { formatMoney } from '@/lib/format/money';
import { formatDate, formatLongDate, formatMonthYear } from '@/lib/format/date';
import type { Transaction } from '@/types';

interface PageProps {
  params: Promise<{ id: string; ym: string }>;
}

export default function InvoiceDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const cardId = parseInt(resolvedParams.id, 10);
  const ym = resolvedParams.ym;
  const devState = useDevState();

  const { data: card } = useCreditCard(cardId);
  const { data: invoice, isLoading, isError, refetch } = useInvoiceDetail(cardId, ym);
  const deletePaymentMutation = useDeleteInvoicePayment(cardId, ym);

  const [isPayOpen, setIsPayOpen] = useState(false);
  const [paymentToRefund, setPaymentToRefund] = useState<number | null>(null);

  const showLoading = devState === 'loading' || (isLoading && devState !== 'empty' && devState !== 'error');
  const showError = devState === 'error' || (isError && devState !== 'loading');

  if (showError) {
    return (
      <div className="container mx-auto max-w-4xl p-4 lg:p-8 space-y-6">
        <Link
          href={`/cards/${cardId}`}
          className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text"
        >
          <ArrowLeft size={16} />
          <span>Voltar para faturas do cartão</span>
        </Link>
        <EmptyState
          icon={AlertCircle}
          title="Erro ao carregar fatura"
          description="Não foi possível obter os lançamentos desta fatura. Tente novamente."
          actionLabel="Tentar novamente"
          onAction={() => refetch()}
        />
      </div>
    );
  }

  const remaining = invoice ? Math.max(0, invoice.total - invoice.paid) : 0;
  const isOpen = invoice?.status === 'OPEN';
  const monthLabel = formatMonthYear(`${ym}-01`);

  // Agrupamento de compras por dia
  const transactions = invoice?.transactions ?? [];
  const groupedTransactions: Record<string, Transaction[]> = {};
  for (const t of transactions) {
    if (!groupedTransactions[t.date]) {
      groupedTransactions[t.date] = [];
    }
    groupedTransactions[t.date].push(t);
  }
  const sortedDates = Object.keys(groupedTransactions).sort((a, b) => b.localeCompare(a));

  const payments = invoice?.payments ?? [];

  return (
    <div className="container mx-auto max-w-4xl p-4 lg:p-8 space-y-8">
      {/* Navegação */}
      <div className="flex items-center justify-between">
        <Link
          href={`/cards/${cardId}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-text-muted hover:text-text transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Voltar para {card ? card.name : 'o cartão'}</span>
        </Link>

        {invoice && (
          <div className="flex items-center gap-2">
            <InvoiceStatusBadge status={invoice.status} />
          </div>
        )}
      </div>

      {!showLoading && invoice && invoice.payments === undefined && (
        <p className="rounded-2xl border border-border bg-surface p-4 text-sm text-text-muted">
          O histórico detalhado de pagamentos está indisponível. O total pago está no resumo da fatura.
        </p>
      )}
      {/* Resumo da Fatura */}
      {showLoading || !invoice ? (
        <Skeleton className="h-48 rounded-3xl" />
      ) : (
        <Card variant="solid" padding="lg" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Fatura de {monthLabel}
              </p>
              <h1 className="text-3xl font-extrabold tabular-nums tracking-tight text-text mt-1">
                {formatMoney(invoice.total)}
              </h1>
            </div>

            {/* Botão de Pagamento com trava para OPEN */}
            <div className="flex flex-col items-start sm:items-end gap-1.5">
              <Button
                variant="brand"
                disabled={isOpen || remaining <= 0}
                onClick={() => setIsPayOpen(true)}
                className="gap-2"
              >
                <DollarSign size={18} />
                <span>Pagar fatura</span>
              </Button>
              {isOpen && (
                <span className="text-[11px] text-text-muted">
                  A fatura só fica disponível para pagamento após o fechamento ({formatDate(invoice.closingDate)}).
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-border text-xs">
            <div>
              <p className="text-text-muted">Total pago</p>
              <p className="font-bold tabular-nums text-text text-sm mt-0.5">
                {formatMoney(invoice.paid)}
              </p>
            </div>
            <div>
              <p className="text-text-muted">Restante</p>
              <p className="font-bold tabular-nums text-expense text-sm mt-0.5">
                {formatMoney(remaining)}
              </p>
            </div>
            <div>
              <p className="text-text-muted">Fechamento</p>
              <p className="font-semibold text-text text-sm mt-0.5">
                {formatDate(invoice.closingDate)}
              </p>
            </div>
            <div>
              <p className="text-text-muted">Vencimento</p>
              <p className="font-semibold text-text text-sm mt-0.5">
                {formatDate(invoice.dueDate)}
              </p>
            </div>
          </div>

          {/* Nota informativa */}
          <div className="flex items-start gap-2.5 rounded-2xl bg-surface-soft p-3.5 text-xs text-text-muted border border-border">
            <Info size={16} className="text-primary shrink-0 mt-0.5" />
            <span>
              <strong>Lembrete contábil:</strong> Pagar fatura não é despesa; a despesa já foi contada na compra. O pagamento quita o limite de crédito utilizado.
            </span>
          </div>
        </Card>
      )}

      {/* Pagamentos Efetuados */}
      {!showLoading && payments.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted">
            Pagamentos Realizados ({payments.length})
          </h2>
          <div className="space-y-2">
            {payments.map((p) => (
              <Card key={p.id} className="p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-income-soft text-income">
                    <DollarSign size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-text">
                      {p.account.name || 'Conta bancária'}
                    </p>
                    <p className="text-[11px] text-text-muted">{formatDate(p.date)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-bold tabular-nums text-sm text-income">
                    {formatMoney(p.amount)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPaymentToRefund(p.id)}
                    className="gap-1 text-xs text-text-muted hover:text-expense"
                    title="Estornar pagamento"
                  >
                    <RotateCcw size={14} />
                    <span>Estornar</span>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Compras da Fatura Agrupadas por Dia */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-text">Compras da Fatura</h2>
          <p className="text-xs text-text-muted">
            Transações lançadas nesta competência agrupadas por dia de compra
          </p>
        </div>

        {showLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))}
          </div>
        ) : sortedDates.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="Nenhuma compra nesta fatura"
            description="Não há compras registradas para este ciclo do cartão."
          />
        ) : (
          <div className="space-y-6">
            {sortedDates.map((dateStr) => {
              const dayTransactions = groupedTransactions[dateStr];
              return (
                <div key={dateStr} className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted px-1">
                    {formatLongDate(dateStr)}
                  </h3>

                  <div className="space-y-2">
                    {dayTransactions.map((tx) => (
                      <Card
                        key={tx.id}
                        className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:border-primary/30 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="flex size-10 shrink-0 items-center justify-center rounded-xl"
                            style={{
                              backgroundColor: `${tx.category.color}15`,
                              color: tx.category.color,
                            }}
                          >
                            <CategoryIcon name={tx.category.icon} size={20} />
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-text">
                              {tx.description}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-text-muted">{tx.category.name}</span>
                              {tx.installment && (
                                <Badge variant="neutral" className="text-[10px] py-0 px-1.5">
                                  {tx.installment.number}/{tx.installment.total}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-bold tabular-nums text-sm text-text">
                            {formatMoney(tx.amount)}
                          </span>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Modal de Pagamento de Fatura */}
      {invoice && (
        <InvoicePayModal
          open={isPayOpen}
          onClose={() => setIsPayOpen(false)}
          cardId={cardId}
          invoice={invoice}
        />
      )}

      {/* Confirmação de Estorno */}
      <ConfirmDialog
        open={paymentToRefund !== null}
        onClose={() => setPaymentToRefund(null)}
        onConfirm={() => {
          if (paymentToRefund !== null) {
            deletePaymentMutation.mutate(paymentToRefund, {
              onSettled: () => setPaymentToRefund(null),
            });
          }
        }}
        title="Estornar Pagamento de Fatura"
        description="O valor pago será estornado para a conta de origem e voltará a constar como saldo devedor nesta fatura."
        confirmLabel="Estornar"
        cancelLabel="Cancelar"
        isLoading={deletePaymentMutation.isPending}
      />
    </div>
  );
}

