'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronRight, Edit2, Calendar, FileText, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ProgressBar } from '@/components/ui/progress-bar';
import { VisualCard } from '@/components/cards/VisualCard';
import { CreditCardFormModal } from '@/components/cards/CreditCardFormModal';
import { InvoiceStatusBadge } from '@/components/cards/InvoiceStatusBadge';
import { useCreditCard, useInvoices } from '@/hooks/use-credit-cards';
import { useDevState } from '@/hooks/use-dev-state';
import { formatMoney } from '@/lib/format/money';
import { formatDate, formatMonthYear } from '@/lib/format/date';
import { cn } from '@/lib/utils';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CreditCardDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const cardId = parseInt(resolvedParams.id, 10);
  const devState = useDevState();

  const { data: card, isLoading: cardLoading, isError: cardError, refetch: refetchCard } =
    useCreditCard(cardId);
  const { data: invoices, isLoading: invoicesLoading, isError: invoicesError, refetch: refetchInvoices } =
    useInvoices(cardId);

  const [isEditOpen, setIsEditOpen] = useState(false);

  const showLoading =
    devState === 'loading' || ((cardLoading || invoicesLoading) && devState !== 'empty' && devState !== 'error');
  const showError = devState === 'error' || ((cardError || invoicesError) && devState !== 'loading');
  const showEmpty = devState === 'empty' || (!showLoading && !showError && (!invoices || invoices.length === 0));

  if (showError) {
    return (
      <div className="container mx-auto max-w-5xl p-4 lg:p-8 space-y-6">
        <Link
          href="/cards"
          className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Voltar para cartões</span>
        </Link>
        <EmptyState
          icon={AlertCircle}
          title="Erro ao carregar detalhes do cartão"
          description="Não foi possível obter as informações do cartão. Tente novamente."
          actionLabel="Tentar novamente"
          onAction={() => {
            refetchCard();
            refetchInvoices();
          }}
        />
      </div>
    );
  }

  const usedPct = card && card.creditLimit > 0 ? (card.usedLimit / card.creditLimit) * 100 : 0;
  const isExceeded = card ? card.availableLimit < 0 : false;
  const exceededAmount = card ? Math.abs(card.availableLimit) : 0;

  return (
    <div className="container mx-auto max-w-5xl p-4 lg:p-8 space-y-8">
      {/* Navegação de Retorno */}
      <div className="flex items-center justify-between">
        <Link
          href="/cards"
          className="inline-flex items-center gap-2 text-sm font-medium text-text-muted hover:text-text transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Voltar para cartões</span>
        </Link>

        {card && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditOpen(true)}
            className="gap-1.5 text-xs"
          >
            <Edit2 size={14} />
            <span>Editar cartão</span>
          </Button>
        )}
      </div>

      {/* Topo: Cartão Visual + Métricas */}
      {showLoading || !card ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-56 rounded-3xl md:col-span-1" />
          <Skeleton className="h-56 rounded-3xl md:col-span-2" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <VisualCard card={card} size="lg" className="h-full min-h-[220px]" />
          </div>

          <Card className="p-6 md:col-span-2 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Visão Geral de Limite
                </span>
                <span className="text-xs font-medium text-text-muted">
                  Fecha dia {card.closingDay} · Vence dia {card.dueDay}
                </span>
              </div>

              <div className="mt-3 flex items-baseline justify-between">
                <div>
                  <p className="text-xs text-text-muted">Limite total concedido</p>
                  <p className="text-2xl font-bold tabular-nums text-text">{formatMoney(card.creditLimit)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-text-muted">Limite utilizado</p>
                  <p className="text-xl font-bold tabular-nums text-text">{formatMoney(card.usedLimit)}</p>
                </div>
              </div>

              <div className="mt-4 space-y-1.5">
                <ProgressBar
                  value={usedPct}
                  variant={isExceeded ? 'expense' : usedPct > 80 ? 'warning' : 'primary'}
                />
                <div className="flex items-center justify-between text-xs">
                  {isExceeded ? (
                    <span className="font-bold text-expense tabular-nums">
                      Limite excedido em {formatMoney(exceededAmount)}
                    </span>
                  ) : (
                    <span className="text-text-muted">
                      Disponível:{' '}
                      <strong className="text-text font-semibold tabular-nums">
                        {formatMoney(card.availableLimit)}
                      </strong>
                    </span>
                  )}
                  <span className="text-text-muted tabular-nums">{Math.round(usedPct)}% em uso</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-surface-soft p-3.5 border border-border flex items-center justify-between text-xs">
              <span className="text-text-muted">Fatura atual em aberto</span>
              <span className="font-bold tabular-nums text-text">
                {card.currentInvoice ? formatMoney(card.currentInvoice.total) : 'Sem fatura atual'}
              </span>
            </div>
          </Card>
        </div>
      )}

      {/* Listagem de Faturas por Mês */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-text">Faturas Mensais</h2>
            <p className="text-xs text-text-muted">
              Histórico ordenado por competência das compras realizadas
            </p>
          </div>
        </div>

        {showLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))}
          </div>
        ) : showEmpty || !invoices || invoices.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Nenhuma fatura encontrada"
            description="As faturas serão geradas automaticamente conforme você realizar compras neste cartão."
          />
        ) : (
          <div className="space-y-3">
            {invoices.map((invoice) => {
              const remaining = Math.max(0, invoice.total - invoice.paid);
              const label = formatMonthYear(`${invoice.reference}-01`);

              return (
                <Link
                  key={invoice.reference}
                  href={`/cards/${cardId}/invoices/${invoice.reference}`}
                  className="block"
                >
                  <Card className="p-4 sm:p-5 transition-all hover:border-primary/40 hover:shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Referência e datas */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary font-bold text-xs uppercase">
                        <Calendar size={18} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-text capitalize">{label}</h3>
                          <span className="text-xs text-text-muted font-mono">
                            ({invoice.reference})
                          </span>
                        </div>
                        <p className="text-xs text-text-muted mt-0.5">
                          Fecha em {formatDate(invoice.closingDate)} · Vence em {formatDate(invoice.dueDate)}
                        </p>
                      </div>
                    </div>

                    {/* Valores e Status */}
                    <div className="flex items-center justify-between sm:justify-end gap-5">
                      <div className="text-right">
                        <div className="text-sm font-bold tabular-nums text-text">
                          {formatMoney(invoice.total)}
                        </div>
                        {invoice.paid > 0 && remaining > 0 && (
                          <div className="text-xs text-text-muted tabular-nums">
                            Pago: {formatMoney(invoice.paid)}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <InvoiceStatusBadge status={invoice.status} />
                        <ChevronRight size={18} className="text-text-muted shrink-0" />
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Modal de Edição */}
      {card && (
        <CreditCardFormModal
          open={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          card={card}
        />
      )}
    </div>
  );
}

