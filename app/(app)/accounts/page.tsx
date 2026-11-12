'use client';

import { CreditCard } from 'lucide-react';
import { PageContainer, PageHeader } from '@/components/ui/page';
import { useState } from 'react';
import { Plus, ChevronDown, ChevronRight, Archive, Wallet, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { AccountCard, ACCOUNT_TYPE_LABELS } from '@/components/accounts/AccountCard';
import { AccountFormModal } from '@/components/accounts/AccountFormModal';
import { TransferForm } from '@/components/transactions/TransferForm';
import { CategoryIcon } from '@/components/icons/CategoryIcon';
import { useAccounts, useDeleteAccount } from '@/hooks/use-accounts';
import { useDevState } from '@/hooks/use-dev-state';
import { formatMoney } from '@/lib/format/money';
import type { Account } from '@/types';

export default function AccountsPage() {
  const devState = useDevState();
  const { data, isLoading, isError, refetch } = useAccounts(true);
  const deleteMutation = useDeleteAccount();

  // Estados locais de modais
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);

  // Transferência rápida a partir de uma conta
  const [transferFromId, setTransferFromId] = useState<number | null>(null);
  const [isTransferOpen, setIsTransferOpen] = useState(false);

  // Acordeão de arquivadas
  const [isArchivedOpen, setIsArchivedOpen] = useState(false);

  // DevState overrides
  const showLoading = devState === 'loading' || (isLoading && devState !== 'empty' && devState !== 'error');
  const showError = devState === 'error' || (isError && devState !== 'loading');
  const showEmpty = devState === 'empty' || (!showLoading && !showError && (!data || data.accounts.length === 0));

  const accounts = data?.accounts ?? [];
  const activeAccounts = accounts.filter((a) => !a.archived);
  const archivedAccounts = accounts.filter((a) => a.archived);
  const isOnlyOneActive = activeAccounts.length <= 1;

  const totalBalance = data?.totalBalance ?? 0;
  const creditCardDebt = data?.creditCardDebt ?? 0;

  function handleOpenCreate() {
    setEditingAccount(null);
    setIsFormOpen(true);
  }

  function handleOpenEdit(account: Account) {
    setEditingAccount(account);
    setIsFormOpen(true);
  }

  function handleTransferFrom(accountId: number) {
    setTransferFromId(accountId);
    setIsTransferOpen(true);
  }

  function handleConfirmDelete() {
    if (!accountToDelete) return;
    deleteMutation.mutate(accountToDelete.id, {
      onSettled: () => {
        setAccountToDelete(null);
      },
    });
  }

  if (showError) {
    return (
      <PageContainer className="space-y-6">
        <EmptyState
          icon={AlertCircle}
          title="Erro ao carregar contas"
          description="Não foi possível obter os dados das suas contas. Verifique sua conexão e tente novamente."
          actionLabel="Tentar novamente"
          onAction={() => refetch()}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer className="space-y-8">
      {/* Cabeçalho da página */}
      <PageHeader title="Minhas Contas" description={<>Gerencie suas contas bancárias, carteiras físicas e reservas financeiras</>} action={<><Button variant="brand" onClick={handleOpenCreate} className="self-start sm:self-auto gap-2">
        <Plus size={18} />
        <span>Nova conta</span>
      </Button></>} />

      {/* Topo: Card tipo BRAND consolidado */}
      {showLoading ? (
        <Skeleton className="h-44 w-full rounded-3xl" />
      ) : (
        <Card variant="brand" padding="lg" className="flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-white/80">
              Saldo Consolidado
            </span>
            <div className="mt-2 text-3xl sm:text-4xl font-semibold tabular-nums tracking-tight text-white">
              {formatMoney(totalBalance)}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-2 text-xs text-white/90">
            <span className="flex items-center gap-1.5">
              <CreditCard className="size-4" aria-hidden="true" /> Faturas de cartão em aberto:
            </span>
            <span className="font-bold tabular-nums text-sm text-white">
              {formatMoney(creditCardDebt)}
            </span>
          </div>
        </Card>
      )}

      {/* Grade de contas ativas */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text">
            Contas ativas ({showLoading ? '…' : activeAccounts.length})
          </h2>
        </div>

        {showLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-36 rounded-2xl" />
            ))}
          </div>
        ) : showEmpty || activeAccounts.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="Nenhuma conta ativa"
            description="Cadastre sua primeira conta bancária ou carteira para começar a acompanhar seu saldo."
            actionLabel="Criar primeira conta"
            onAction={handleOpenCreate}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeAccounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                isLastActive={isOnlyOneActive}
                onEdit={handleOpenEdit}
                onTransferFrom={handleTransferFrom}
                onDelete={setAccountToDelete}
              />
            ))}
          </div>
        )}
      </section>

      {/* Seção de Contas Arquivadas (Colapsável) */}
      {!showLoading && archivedAccounts.length > 0 && (
        <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5 transition-all">
          <button
            type="button"
            onClick={() => setIsArchivedOpen(!isArchivedOpen)}
            className="flex w-full items-center justify-between text-left"
            aria-expanded={isArchivedOpen}
          >
            <div className="flex items-center gap-2.5">
              <Archive size={18} className="text-text-muted" />
              <h3 className="text-sm font-semibold text-text">
                Contas arquivadas ({archivedAccounts.length})
              </h3>
            </div>
            {isArchivedOpen ? (
              <ChevronDown size={18} className="text-text-muted" />
            ) : (
              <ChevronRight size={18} className="text-text-muted" />
            )}
          </button>

          {isArchivedOpen && (
            <div className="mt-4 pt-4 border-t border-border grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 animate-in fade-in duration-200">
              {archivedAccounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between rounded-xl border border-border/70 bg-surface-soft p-3.5 opacity-80"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="flex size-10 shrink-0 items-center justify-center rounded-xl"
                      style={{
                        backgroundColor: `${account.color}15`,
                        color: account.color,
                      }}
                    >
                      <CategoryIcon name={account.icon} size={20} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-text">{account.name}</p>
                      <p className="text-xs text-text-muted">
                        {ACCOUNT_TYPE_LABELS[account.type] || account.type} · Arquivada
                      </p>
                    </div>
                  </div>

                  <span className="tabular-nums text-sm font-semibold text-text-muted ml-2">
                    {formatMoney(account.balance)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Modal de Criação / Edição de Conta */}
      <AccountFormModal
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        account={editingAccount}
      />

      {/* Formulário de Transferência a partir de uma conta */}
      <TransferForm
        open={isTransferOpen}
        onOpenChange={setIsTransferOpen}
        initialFromAccountId={transferFromId ?? undefined}
      />

      {/* Confirmação de Exclusão / Arquivamento */}
      <ConfirmDialog
        open={!!accountToDelete}
        onClose={() => setAccountToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Arquivar ou Excluir Conta"
        description="Contas com movimentações são arquivadas, não excluídas. O histórico e os relatórios continuam intactos."
        confirmLabel="Confirmar"
        cancelLabel="Cancelar"
        isLoading={deleteMutation.isPending}
      />
    </PageContainer>
  );
}

