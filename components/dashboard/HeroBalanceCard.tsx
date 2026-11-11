'use client';

import { ArrowDownLeft, ArrowUpRight, Eye, EyeOff, CreditCard } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { formatMoney } from '@/lib/format/money';
import { useUiStore } from '@/stores/ui-store';
import type { DashboardSummary } from '@/types';

interface HeroBalanceCardProps {
  summary: DashboardSummary;
  totalBalance: number;
  creditCardDebt: number;
}

export function HeroBalanceCard({ summary, totalBalance, creditCardDebt }: HeroBalanceCardProps) {
  const isBalanceVisible = useUiStore((s) => s.isBalanceVisible);
  const toggleBalanceVisibility = useUiStore((s) => s.toggleBalanceVisibility);

  return (
    <Card variant="brand" className="relative overflow-hidden p-5 sm:p-7">
      {/* Círculos decorativos concêntricos */}
      <div className="pointer-events-none absolute -right-20 -top-28 size-80 rounded-full border-[28px] border-white opacity-5" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-6 -top-14 size-56 rounded-full border-[20px] border-white opacity-5" aria-hidden="true" />

      <div className="relative">
        {/* Título e botão de visibilidade */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-white/70">Patrimônio Total</p>
          <button
            aria-label={isBalanceVisible ? 'Ocultar saldo' : 'Mostrar saldo'}
            onClick={toggleBalanceVisibility}
            className="grid size-11 place-items-center rounded-xl bg-white/10 transition hover:bg-white/20"
          >
            {isBalanceVisible ? <Eye className="size-4 text-white" /> : <EyeOff className="size-4 text-white" />}
          </button>
        </div>

        {/* Saldo principal */}
        <p className="mt-2 tabular-nums text-4xl font-bold tracking-tight text-white sm:text-5xl">
          {isBalanceVisible ? formatMoney(totalBalance) : 'R$ ••••••'}
        </p>

        {/* Receitas e Despesas do período */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-1 text-xs text-white/65">
              <ArrowDownLeft className="size-3 text-white" />
              Receitas do período
            </div>
            <p className="mt-1 tabular-nums text-sm font-semibold text-white">
              {isBalanceVisible ? formatMoney(summary.totalIncome) : '••••'}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-1 text-xs text-white/65">
              <ArrowUpRight className="size-3 text-white" />
              Despesas do período
            </div>
            <p className="mt-1 tabular-nums text-sm font-semibold text-white">
              {isBalanceVisible ? formatMoney(summary.totalExpense) : '••••'}
            </p>
          </div>
        </div>

        {/* Faturas de cartão */}
        <p className="mt-5 flex items-center gap-1.5 text-xs text-white/60">
          <CreditCard className="size-3" />
          Em faturas de cartão:{' '}
          <strong className="font-semibold text-white/85">
            {isBalanceVisible ? formatMoney(creditCardDebt) : '••••'}
          </strong>
        </p>
      </div>
    </Card>
  );
}
