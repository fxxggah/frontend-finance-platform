'use client';

import { useState, useRef, useEffect } from 'react';
import { MoreVertical, Edit2, ArrowRightLeft, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { CategoryIcon } from '@/components/icons/CategoryIcon';
import { formatMoney } from '@/lib/format/money';
import { cn } from '@/lib/utils';
import type { Account, AccountType } from '@/types';

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  BANK: 'Banco',
  CASH: 'Dinheiro',
  DIGITAL_WALLET: 'Carteira digital',
  OTHER: 'Outro',
};

interface AccountCardProps {
  account: Account;
  isLastActive?: boolean;
  onEdit: (account: Account) => void;
  onTransferFrom: (accountId: number) => void;
  onDelete: (account: Account) => void;
}

export function AccountCard({
  account,
  isLastActive = false,
  onEdit,
  onTransferFrom,
  onDelete,
}: AccountCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  const isNegative = account.balance < 0;

  return (
    <Card className="relative p-5 transition-colors hover:border-primary/40 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        {/* Ícone e dados básicos */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div
            className="flex size-12 shrink-0 items-center justify-center rounded-2xl shadow-sm"
            style={{
              backgroundColor: `${account.color}15`,
              color: account.color,
            }}
          >
            <CategoryIcon name={account.icon} size={24} />
          </div>

          <div className="min-w-0">
            <h3 className="truncate font-semibold text-text text-base" title={account.name}>
              {account.name}
            </h3>
            <p className="text-xs text-text-muted">
              {ACCOUNT_TYPE_LABELS[account.type] || account.type}
            </p>
          </div>
        </div>

        {/* Menu de ações (Dropdown acessível) */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            aria-label={`Ações da conta ${account.name}`}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex size-11 items-center justify-center rounded-xl text-text-muted transition-colors hover:bg-surface-soft hover:text-text"
          >
            <MoreVertical size={18} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-9 z-20 w-48 rounded-2xl border border-border bg-surface p-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-150">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onEdit(account);
                }}
                className="flex w-full items-center gap-2.5 min-h-11 rounded-xl px-3 py-2 text-xs font-medium text-text transition-colors hover:bg-surface-soft"
              >
                <Edit2 size={15} className="text-text-muted" />
                <span>Editar</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onTransferFrom(account.id);
                }}
                className="flex w-full items-center gap-2.5 min-h-11 rounded-xl px-3 py-2 text-xs font-medium text-text transition-colors hover:bg-surface-soft"
              >
                <ArrowRightLeft size={15} className="text-text-muted" />
                <span>Transferir daqui</span>
              </button>

              <div className="my-1 border-t border-border" />

              <button
                type="button"
                disabled={isLastActive}
                title={isLastActive ? 'A última conta ativa não pode ser removida' : undefined}
                onClick={() => {
                  if (isLastActive) return;
                  setMenuOpen(false);
                  onDelete(account);
                }}
                className={cn(
                  'flex w-full items-center gap-2.5 min-h-11 rounded-xl px-3 py-2 text-xs font-medium transition-colors',
                  isLastActive
                    ? 'cursor-not-allowed text-text-muted/50'
                    : 'text-expense hover:bg-expense-soft'
                )}
              >
                <Trash2 size={15} />
                <span>Arquivar / Excluir</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Saldo da Conta */}
      <div className="mt-5 pt-3 border-t border-border/60 flex items-baseline justify-between">
        <span className="text-xs text-text-muted">Saldo disponível</span>
        <span
          className={cn(
            'text-lg font-semibold tabular-nums tracking-tight',
            isNegative ? 'text-expense font-semibold' : 'text-text'
          )}
        >
          {formatMoney(account.balance)}
        </span>
      </div>
    </Card>
  );
}

