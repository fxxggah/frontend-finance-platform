'use client';

import { PageHeader, PageContainer } from '@/components/ui/page';
import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Ban,
  PlusCircle,
  TrendingUp,
  AlertCircle,
  Calendar,
  ExternalLink,
  Info,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ProgressBar, type ProgressVariant } from '@/components/ui/progress-bar';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { CategoryIcon } from '@/components/icons/CategoryIcon';
import { GoalStateBadge } from '@/components/goals/GoalStateBadge';
import { GoalFormModal } from '@/components/goals/GoalFormModal';
import { GoalContributionModal } from '@/components/goals/GoalContributionModal';
import {
  useGoal,
  useCancelGoal,
  useDeleteGoal,
  useGoalContributions,
  useDeleteGoalContribution,
} from '@/hooks/use-goals';
import { useDevState } from '@/hooks/use-dev-state';
import { formatMoney } from '@/lib/format/money';
import { formatDate } from '@/lib/format/date';
import { cn } from '@/lib/utils';
import type { GoalState, GoalType } from '@/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

const TYPE_NAMES: Record<GoalType, string> = {
  SAVINGS: 'Economia',
  INCOME: 'Ganho',
  EXPENSE: 'Teto de Gasto',
};

const STATE_TO_PROGRESS_VARIANT: Record<GoalState, ProgressVariant> = {
  IN_PROGRESS: 'primary',
  WARNING: 'warning',
  EXCEEDED: 'expense',
  ACHIEVED: 'income',
  EXPIRED: 'warning',
};

export default function GoalDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const goalId = parseInt(resolvedParams.id, 10);
  const router = useRouter();
  const devState = useDevState();

  const { data: goal, isLoading, isError, refetch } = useGoal(goalId);
  const { data: contributions, isLoading: contribsLoading } = useGoalContributions(goalId);

  const cancelMutation = useCancelGoal();
  const deleteMutation = useDeleteGoal();
  const deleteContribMutation = useDeleteGoalContribution(goalId);

  // Estados locais de diálogos
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isContribOpen, setIsContribOpen] = useState(false);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [contribToDelete, setContribToDelete] = useState<number | null>(null);

  const showLoading = devState === 'loading' || (isLoading && devState !== 'empty' && devState !== 'error');
  const showError = devState === 'error' || (isError && devState !== 'loading');

  if (devState === 'empty') {
    return <PageContainer>
      <EmptyState title="Nenhuma meta disponível" description="Escolha uma meta para acompanhar o progresso."
        actionLabel="Ver metas" onAction={() => router.push('/goals')} />
    </PageContainer>;
  }

  if (showError) {
    return (
      <PageContainer className="space-y-6">
        <Link
          href="/goals"
          className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text"
        >
          <ArrowLeft size={16} />
          <span>Voltar para metas</span>
        </Link>
        <EmptyState
          icon={AlertCircle}
          title="Erro ao carregar meta"
          description="Não foi possível obter os dados desta meta financeira. Tente novamente."
          actionLabel="Tentar novamente"
          onAction={() => refetch()}
        />
      </PageContainer>
    );
  }

  const isSavings = goal?.type === 'SAVINGS';
  const isCancelled = goal?.status === 'CANCELLED';
  const progressVariant = goal ? STATE_TO_PROGRESS_VARIANT[goal.state] || 'primary' : 'primary';

  function handleConfirmCancel() {
    cancelMutation.mutate(goalId, {
      onSettled: () => setIsCancelConfirmOpen(false),
    });
  }

  function handleConfirmDelete() {
    deleteMutation.mutate(goalId, {
      onSuccess: () => {
        router.push('/goals');
      },
      onSettled: () => setIsDeleteConfirmOpen(false),
    });
  }

  return (
    <PageContainer className="space-y-8">
      {/* Navegação e Ações Rápidas */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Link
          href="/goals"
          className="inline-flex items-center gap-2 text-sm font-medium text-text-muted hover:text-text transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Voltar para metas</span>
        </Link>

        {goal && (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditOpen(true)}
              className="gap-1.5 text-xs"
            >
              <Edit2 size={14} />
              <span>Editar</span>
            </Button>

            {!isCancelled && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCancelConfirmOpen(true)}
                className="gap-1.5 text-xs text-warning hover:bg-warning-soft"
              >
                <Ban size={14} />
                <span>Cancelar meta</span>
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDeleteConfirmOpen(true)}
              className="gap-1.5 text-xs text-expense hover:bg-expense-soft"
            >
              <Trash2 size={14} />
              <span>Excluir</span>
            </Button>
          </div>
        )}
      </div>

      <PageHeader title={goal?.name ?? 'Detalhes da meta'} description="Acompanhe o progresso e as movimentações do seu objetivo." />
      {/* Topo: Card Principal da Meta com Grande Indicador */}
      {showLoading || !goal ? (
        <Skeleton className="h-64 rounded-3xl" />
      ) : (
        <Card variant="panel" padding="lg" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div
                className="flex size-14 shrink-0 items-center justify-center rounded-2xl shadow-sm"
                style={{
                  backgroundColor: `${goal.color || '#5B3DF5'}15`,
                  color: goal.color || '#5B3DF5',
                }}
              >
                <CategoryIcon name={goal.icon || 'target'} size={28} />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-semibold tracking-tight text-text">{goal.name}</h2>
                  <GoalStateBadge state={goal.state} />
                  {isCancelled && (
                    <span className="rounded-full bg-expense-soft text-expense px-2.5 py-0.5 text-xs font-semibold">
                      Cancelada
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-muted mt-0.5">
                  Tipo: <strong>{TYPE_NAMES[goal.type]}</strong>
                  {goal.category && ` · Categoria: ${goal.category.name}`}
                </p>
              </div>
            </div>

            {/* Percentual em Destaque */}
            <div className="text-left sm:text-right">
              <span className="text-3xl sm:text-4xl font-semibold tabular-nums tracking-tight text-text">
                {goal.percentage.toFixed(1)}%
              </span>
              <p className="text-xs text-text-muted">do objetivo atingido</p>
            </div>
          </div>

          {/* Barra de Progresso com suporte a overflow */}
          <div className="space-y-2">
            <ProgressBar
              value={goal.percentage}
              variant={progressVariant}
              size="md"
              aria-label={`Progresso da meta ${goal.name}`}
            />
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-text tabular-nums">
                {formatMoney(goal.currentAmount)}
              </span>
              <span className="text-text-muted tabular-nums">
                Alvo: {formatMoney(goal.targetAmount)}
              </span>
            </div>
          </div>

          {/* Dados de Período e Métricas Específicas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-border text-xs">
            {goal.startDate && (
              <div>
                <p className="text-text-muted">Início</p>
                <p className="font-semibold text-text text-sm mt-0.5">{formatDate(goal.startDate)}</p>
              </div>
            )}
            {goal.endDate && (
              <div>
                <p className="text-text-muted">Prazo / Fim</p>
                <p className="font-semibold text-text text-sm mt-0.5">{formatDate(goal.endDate)}</p>
              </div>
            )}
            {goal.monthlyNeeded && (
              <div>
                <p className="text-text-muted">Aporte mensal sugerido</p>
                <p className="font-bold tabular-nums text-primary text-sm mt-0.5">
                  {formatMoney(goal.monthlyNeeded)} / mês
                </p>
              </div>
            )}
          </div>

          {goal.description && (
            <p className="text-xs text-text-muted italic border-t border-border/60 pt-3">
              &quot;{goal.description}&quot;
            </p>
          )}
        </Card>
      )}

      {/* Seção Condicional por Tipo de Meta */}
      {isSavings ? (
        /* SAVINGS: Histórico de Contribuições e Botão de Aporte/Retirada */
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-text">Movimentações da Meta</h2>
              <p className="text-xs text-text-muted">
                Aportes e resgates realizados nesta reserva financeira
              </p>
            </div>

            <Button
              variant="brand"
              disabled={isCancelled}
              onClick={() => setIsContribOpen(true)}
              className="gap-2 self-start sm:self-auto"
            >
              <PlusCircle size={18} />
              <span>Adicionar depósito/retirada</span>
            </Button>
          </div>

          {contribsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-2xl" />
              ))}
            </div>
          ) : !contributions || contributions.length === 0 ? (
            <EmptyState
              icon={TrendingUp}
              title="Nenhuma contribuição registrada"
              description="Faça seu primeiro depósito para iniciar o acúmulo da sua meta."
              actionLabel={!isCancelled ? 'Fazer primeiro aporte' : undefined}
              onAction={!isCancelled ? () => setIsContribOpen(true) : undefined}
            />
          ) : (
            <div className="space-y-2.5">
              {contributions.map((c) => {
                const isDeposit = c.amount > 0;
                return (
                  <Card
                    key={c.id}
                    className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:border-border transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          'flex size-10 shrink-0 items-center justify-center rounded-xl font-bold text-base',
                          isDeposit ? 'bg-income-soft text-income' : 'bg-expense-soft text-expense'
                        )}
                      >
                        {isDeposit ? '+' : '−'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-text">
                          {isDeposit ? 'Depósito / Aporte' : 'Resgate / Retirada'}
                        </p>
                        {c.notes && (
                          <p className="text-xs text-text-muted truncate">{c.notes}</p>
                        )}
                        <p className="text-[11px] text-text-muted">{formatDate(c.date)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={cn(
                          'font-bold tabular-nums text-sm',
                          isDeposit ? 'text-income' : 'text-expense'
                        )}
                      >
                        {formatMoney(c.amount, { showSign: true })}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setContribToDelete(c.id)}
                        className="size-8 p-0 text-text-muted hover:text-expense"
                        title="Remover movimentação"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      ) : (
        /* INCOME / EXPENSE: Aviso explicativo com link para transações */
        <Card className="p-6 text-center space-y-4 border-dashed border-2">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary-soft text-primary">
            <Info size={24} />
          </div>
          <PageContainer className="space-y-1">
            <h2 className="text-base font-semibold text-text">Cálculo Automático por Transações</h2>
            <p className="text-xs text-text-muted leading-relaxed">
              Esta meta é calculada automaticamente a partir das suas transações no período estipulado. Lançamentos cadastrados com a categoria vinculada atualizam o saldo em tempo real.
            </p>
          </PageContainer>
          <div>
            <Link
              href={
                goal?.category
                  ? `/transactions?categoryId=${goal.category.id}`
                  : '/transactions'
              }
            >
              <Button variant="outline" className="gap-2 text-xs">
                <span>Ver transações do período</span>
                <ExternalLink size={14} />
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Modal de Edição */}
      {goal && (
        <GoalFormModal
          open={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          goal={goal}
        />
      )}

      {/* Modal de Aporte / Retirada */}
      {goal && isSavings && (
        <GoalContributionModal
          open={isContribOpen}
          onClose={() => setIsContribOpen(false)}
          goal={goal}
        />
      )}

      {/* Confirmação de Cancelamento */}
      <ConfirmDialog
        open={isCancelConfirmOpen}
        onClose={() => setIsCancelConfirmOpen(false)}
        onConfirm={handleConfirmCancel}
        title="Cancelar Meta"
        description="Ao cancelar esta meta, seu progresso é congelado e nenhuma nova contribuição poderá ser adicionada. Os dados históricos permanecerão preservados."
        confirmLabel="Cancelar meta"
        cancelLabel="Voltar"
        isLoading={cancelMutation.isPending}
      />

      {/* Confirmação de Exclusão */}
      <ConfirmDialog
        open={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Excluir Meta"
        description="A meta e todas as suas contribuições registradas serão removidas permanentemente. Esta ação não poderá ser desfeita."
        confirmLabel="Excluir definitivamente"
        cancelLabel="Voltar"
        isLoading={deleteMutation.isPending}
      />
    </PageContainer>
  );
}

