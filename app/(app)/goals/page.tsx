'use client';

import { useState } from 'react';
import { Plus, Target, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { GoalCard } from '@/components/goals/GoalCard';
import { GoalFormModal } from '@/components/goals/GoalFormModal';
import { useGoals } from '@/hooks/use-goals';
import { useDevState } from '@/hooks/use-dev-state';
import { cn } from '@/lib/utils';
import type { GoalStatus, GoalType } from '@/types';

type FilterType = 'ALL' | GoalType;

const TYPE_TABS: { key: FilterType; label: string }[] = [
  { key: 'ALL', label: 'Todas' },
  { key: 'SAVINGS', label: 'Economia' },
  { key: 'INCOME', label: 'Ganho' },
  { key: 'EXPENSE', label: 'Gasto' },
];

export default function GoalsPage() {
  const devState = useDevState();
  const [selectedType, setSelectedType] = useState<FilterType>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<GoalStatus>('ACTIVE');
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data: goals, isLoading, isError, refetch } = useGoals(
    selectedType === 'ALL' ? undefined : selectedType,
    selectedStatus
  );

  const showLoading = devState === 'loading' || (isLoading && devState !== 'empty' && devState !== 'error');
  const showError = devState === 'error' || (isError && devState !== 'loading');
  const showEmpty = devState === 'empty' || (!showLoading && !showError && (!goals || goals.length === 0));

  if (showError) {
    return (
      <div className="container mx-auto max-w-6xl p-4 lg:p-8 space-y-6">
        <EmptyState
          icon={AlertCircle}
          title="Erro ao carregar metas"
          description="Não foi possível obter suas metas financeiras. Verifique sua conexão."
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
          <h1 className="text-2xl font-bold tracking-tight text-text">Metas Financeiras</h1>
          <p className="text-sm text-text-muted">
            Planeje suas economias, estabeleça tetos de gastos e monitore receitas
          </p>
        </div>
        <Button variant="brand" onClick={() => setIsFormOpen(true)} className="self-start sm:self-auto gap-2">
          <Plus size={18} />
          <span>Nova meta</span>
        </Button>
      </div>

      {/* Abas e Filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Abas de Tipo */}
        <div className="flex flex-wrap gap-2">
          {TYPE_TABS.map((tab) => {
            const isActive = selectedType === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setSelectedType(tab.key)}
                className={cn(
                  'rounded-xl px-4 py-2 text-xs font-semibold transition-all',
                  isActive
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-surface border border-border text-text-muted hover:bg-surface-soft hover:text-text'
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Filtro Secundário por Status */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface border border-border self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setSelectedStatus('ACTIVE')}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
              selectedStatus === 'ACTIVE'
                ? 'bg-primary-soft text-primary font-semibold'
                : 'text-text-muted hover:text-text'
            )}
          >
            Ativas
          </button>
          <button
            type="button"
            onClick={() => setSelectedStatus('CANCELLED')}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
              selectedStatus === 'CANCELLED'
                ? 'bg-primary-soft text-primary font-semibold'
                : 'text-text-muted hover:text-text'
            )}
          >
            Canceladas
          </button>
        </div>
      </div>

      {/* Grid de Metas */}
      {showLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      ) : showEmpty || !goals || goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="Nenhuma meta encontrada"
          description={
            selectedStatus === 'CANCELLED'
              ? 'Você não possui metas canceladas neste filtro.'
              : 'Defina sua primeira meta de economia, ganho ou limite de gastos.'
          }
          actionLabel={selectedStatus === 'ACTIVE' ? 'Criar primeira meta' : undefined}
          onAction={selectedStatus === 'ACTIVE' ? () => setIsFormOpen(true) : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      )}

      {/* Modal Wizard de Nova Meta */}
      <GoalFormModal
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
      />
    </div>
  );
}

