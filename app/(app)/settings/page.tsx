'use client';

import { PageContainer, PageHeader } from '@/components/ui/page';
import { useState } from 'react';
import {
  User,
  Moon,
  Sun,
  Eye,
  EyeOff,
  Trash2,
  Settings,
  Database,
  RefreshCw,
  LogOut,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/hooks/use-theme';
import { useUiStore } from '@/stores/ui-store';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { deleteMe } from '@/lib/api/endpoints/auth';
import { useCurrentUser, useLogout } from '@/hooks/use-current-user';
import { UserAvatar } from '@/components/layout/UserAvatar';
import { useDevState } from '@/hooks/use-dev-state';
import { Skeleton } from '@/components/ui/skeleton';

// ─── Componentes auxiliares ───────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted px-1">
      {children}
    </h2>
  );
}

function SettingsRow({
  icon: Icon,
  label,
  description,
  action,
  danger,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  description?: string;
  action: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div className="flex items-center gap-4 py-4">
      <span
        className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${
          danger ? 'bg-expense-soft text-expense' : 'bg-surface-soft text-text-muted'
        }`}
        aria-hidden="true"
      >
        <Icon size={16} />
      </span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${danger ? 'text-expense' : 'text-text'}`}>{label}</p>
        {description && <p className="text-xs text-text-muted mt-0.5">{description}</p>}
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  );
}

/** Toggle switch acessível */
function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-11 w-14 items-center justify-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      <span aria-hidden="true" className={`inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${checked ? 'bg-primary' : 'bg-border'}`}>
      <span
        className={`inline-block size-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
      </span>
    </button>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function SettingsPage() {
  const router = useRouter();
  const devState = useDevState();
  const { data: profile, isPending, isError, refetch: refetchProfile } = useCurrentUser();
  const currentUser = devState ? undefined : profile;
  const profileLoading = devState === 'loading' || (!devState && isPending);
  const profileError = devState === 'error' || (!devState && isError);
  const logout = useLogout();
  const { isDark, toggleTheme } = useTheme();
  const { isBalanceVisible, toggleBalanceVisibility } = useUiStore();
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [clearCacheOpen, setClearCacheOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  async function handleDeleteAccount() {
    setIsDeletingAccount(true);
    try {
      await deleteMe();
      toast.success('Conta excluída. Seus dados foram removidos.');
      await logout();
      router.replace('/login');
    } catch {
      toast.error('Não foi possível excluir a conta. Tente novamente.');
    } finally {
      setIsDeletingAccount(false);
      setDeleteAccountOpen(false);
    }
  }

  function handleClearCache() {
    // Limpa localStorage (exceto tema)
    const theme = localStorage.getItem('fin-theme');
    localStorage.clear();
    if (theme) localStorage.setItem('fin-theme', theme);
    toast.success('Cache limpo com sucesso. A página será recarregada.');
    setTimeout(() => window.location.reload(), 1500);
  }

  async function handleLogout() {
    try {
      await logout();
      toast.success('Sessão encerrada.');
      router.replace('/login');
    } catch {
      router.replace('/login');
    }
  }

  return (
    <PageContainer width="form" className="space-y-8">
      {/* Cabeçalho */}
      <PageHeader title="Configurações" description={<>Gerencie sua conta e preferências</>} />

      {/* ── Seção: Perfil e Conta ── */}
      <section aria-labelledby="section-profile">
        <SectionTitle>
          <span id="section-profile">Perfil e Conta</span>
        </SectionTitle>

        <Card variant="solid" className="mt-3 divide-y divide-border px-5">
          {/* Avatar + dados */}
          <div className="flex items-center gap-4 py-4">
            <div
              className="flex size-12 items-center justify-center rounded-full bg-primary text-white text-lg font-bold select-none"
              aria-hidden="true"
            >
              <UserAvatar user={currentUser} />
            </div>
            <div>
              {profileLoading ? <Skeleton className="h-5 w-40" /> : <p className="font-semibold text-text">{currentUser?.name ?? (devState === 'empty' ? 'Nenhum perfil disponível' : 'Perfil indisponível')}</p>}
              {currentUser && <p className="text-sm text-text-muted">{currentUser.email}</p>}
              {profileError && <button type="button" className="min-h-11 text-sm text-primary" onClick={() => void refetchProfile()}>Tentar novamente</button>}
            </div>
          </div>

          {/* Encerrar sessão */}
          <SettingsRow
            icon={LogOut}
            label="Encerrar sessão"
            description="Sair da conta atual neste dispositivo"
            action={
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Sair
              </Button>
            }
          />

          {/* Excluir conta */}

        </Card>
      </section>

      {/* ── Seção: Aparência ── */}
      <section aria-labelledby="section-appearance">
        <SectionTitle>
          <span id="section-appearance">Aparência</span>
        </SectionTitle>

        <Card variant="solid" className="mt-3 divide-y divide-border px-5">
          <SettingsRow
            icon={isDark ? Moon : Sun}
            label="Tema"
            description={isDark ? 'Tema escuro ativado' : 'Tema claro ativado'}
            action={
              <div className="flex items-center gap-2">
                <Sun size={14} className="text-warning" aria-hidden="true" />
                <Toggle
                  checked={isDark}
                  onChange={toggleTheme}
                  label="Alternar tema escuro"
                />
                <Moon size={14} className="text-primary" aria-hidden="true" />
              </div>
            }
          />
        </Card>
      </section>

      {/* ── Seção: Preferências Gerais ── */}
      <section aria-labelledby="section-preferences">
        <SectionTitle>
          <span id="section-preferences">Preferências Gerais</span>
        </SectionTitle>

        <Card variant="solid" className="mt-3 divide-y divide-border px-5">
          <SettingsRow
            icon={isBalanceVisible ? Eye : EyeOff}
            label="Exibir saldo"
            description={
              isBalanceVisible
                ? 'Os valores monetários estão visíveis'
                : 'Os valores monetários estão ocultos (•••)'
            }
            action={
              <Toggle
                checked={isBalanceVisible}
                onChange={() => toggleBalanceVisibility()}
                label="Alternar visibilidade do saldo"
              />
            }
          />
        </Card>
      </section>

      <section aria-labelledby="section-danger">
        <SectionTitle><span id="section-danger">Zona de atenção</span></SectionTitle>
        <Card className="mt-3 border-expense/20 px-5"><SettingsRow
            icon={Trash2}
            label="Excluir minha conta"
            description="Remove permanentemente todos os seus dados (LGPD)"
            danger
            action={
              <Button
                variant="danger"
                size="sm"
                onClick={() => setDeleteAccountOpen(true)}
              >
                Excluir
              </Button>
            }
          /></Card>
      </section>

      {/* ── Aviso de privacidade ── */}
      <div className="flex items-start gap-2 rounded-2xl border border-primary/20 bg-primary-soft px-4 py-3">
        <ShieldAlert size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
        <p className="text-xs text-text-muted leading-relaxed">
          Seus dados são protegidos conforme a{' '}
          <strong className="font-medium text-text">Lei Geral de Proteção de Dados (LGPD)</strong>.
          A exclusão da conta é permanente e irreversível.
        </p>
      </div>

      {/* ── Dialogs de confirmação ── */}
      <ConfirmDialog
        open={deleteAccountOpen}
        onOpenChange={(open) => setDeleteAccountOpen(open)}
        onConfirm={handleDeleteAccount}
        title="Excluir conta permanentemente"
        description="Essa ação é irreversível. Todos os seus dados financeiros, categorias, metas e transações serão removidos permanentemente. Deseja continuar?"
        confirmLabel="Sim, excluir minha conta"
        cancelLabel="Cancelar"
        isPending={isDeletingAccount}
      />

      <ConfirmDialog
        open={clearCacheOpen}
        onOpenChange={(open) => setClearCacheOpen(open)}
        onConfirm={handleClearCache}
        title="Limpar cache local"
        description="Isso removerá preferências salvas no navegador como visibilidade de saldo e filtros. Será necessário reconfigurar suas preferências."
        confirmLabel="Limpar cache"
      />
    </PageContainer>
  );
}

