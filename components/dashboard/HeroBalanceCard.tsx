'use client';

import { ArrowDownLeft, ArrowUpRight, Eye, EyeOff, CreditCard } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { formatMoney } from '@/lib/format/money';
import { useUiStore } from '@/stores/ui-store';
import type { DashboardSummary } from '@/types';
import Link from 'next/link';
import styles from '@/components/ui/surfaces.module.css';
import layout from './dashboard.module.css';

interface HeroBalanceCardProps {
  summary: DashboardSummary;
  totalBalance: number;
  creditCardDebt: number;
}

export function HeroBalanceCard({ summary, totalBalance, creditCardDebt }: HeroBalanceCardProps) {
  const isBalanceVisible = useUiStore((s) => s.isBalanceVisible);
  const toggleBalanceVisibility = useUiStore((s) => s.toggleBalanceVisibility);

  return (
    <Card variant="brand" className={`${layout.balance} flex h-full flex-col overflow-hidden`}>

      <div className="relative flex flex-1 flex-col p-6 sm:p-8">
        {/* Título e botão de visibilidade */}
        <div className="flex items-center justify-between">
          <p className={`${styles.eyebrow} text-white/85`}>Patrimônio total</p>
          <button
            aria-label={isBalanceVisible ? 'Ocultar saldo' : 'Mostrar saldo'}
            onClick={toggleBalanceVisibility}
            aria-pressed={!isBalanceVisible}
            className={`${styles.heroButton} grid size-11 place-items-center rounded-2xl transition-colors hover:bg-white/20`}
          >
            {isBalanceVisible ? <Eye className="size-4 text-white" /> : <EyeOff className="size-4 text-white" />}
          </button>
        </div>

        {/* Saldo principal */}
        <p className="mt-5 break-words tabular-nums text-[clamp(2rem,4.5vw,3.5rem)] leading-tight font-semibold tracking-[-0.045em] text-white">
          {isBalanceVisible ? formatMoney(totalBalance) : 'R$ ••••••'}
        </p>

        <p className="mt-2 text-xs text-white/85">Visão consolidada das suas contas</p>
        <Link href="/cards" className="mt-5 inline-flex min-h-11 w-fit items-center gap-2 text-xs text-white/90 hover:underline">
          <CreditCard className="size-3.5" aria-hidden="true" />
          Em faturas <strong className="tabular-nums font-semibold text-white">{isBalanceVisible ? formatMoney(creditCardDebt) : '••••'}</strong>
          <ArrowUpRight className="size-3.5" aria-hidden="true" />
        </Link>
      </div>
        <div className={`${styles.heroStats} relative grid grid-cols-2 gap-4 px-6 py-5 sm:px-8`}>
          <div>
            <div className="flex items-center gap-1.5 text-xs text-white/85">
              <ArrowDownLeft className="size-3 text-white" />
              Receitas do período
            </div>
            <p className="mt-2 tabular-nums text-base font-semibold text-white">
              {isBalanceVisible ? formatMoney(summary.totalIncome, { showSign: true }) : '••••'}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs text-white/85">
              <ArrowUpRight className="size-3 text-white" />
              Despesas do período
            </div>
            <p className="mt-2 tabular-nums text-base font-semibold text-white">
              {isBalanceVisible ? formatMoney(-Math.abs(summary.totalExpense), { showSign: true }) : '••••'}
            </p>
          </div>
        </div>

    </Card>
  );
}
