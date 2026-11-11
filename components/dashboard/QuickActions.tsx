'use client';

import { ArrowDownLeft, ArrowUpRight, Repeat2, CreditCard } from 'lucide-react';
import { useRouter } from 'next/navigation';
import styles from '@/components/ui/surfaces.module.css';

interface QuickActionsProps {
  onNewIncome?: () => void;
  onNewExpense?: () => void;
  onTransfer?: () => void;
}

const ACTIONS = [
  {
    label: 'Nova receita',
    icon: ArrowDownLeft,
    tone: 'income',
    colorClasses: 'bg-income-soft text-income',
  },
  {
    label: 'Nova despesa',
    icon: ArrowUpRight,
    tone: 'expense',
    colorClasses: 'bg-expense-soft text-expense',
  },
  {
    label: 'Transferir',
    icon: Repeat2,
    tone: 'primary',
    colorClasses: 'bg-primary-soft text-primary',
  },
  {
    label: 'Pagar fatura',
    icon: CreditCard,
    tone: 'warning',
    colorClasses: 'bg-warning-soft text-warning',
  },
] as const;

export function QuickActions({ onNewIncome, onNewExpense, onTransfer }: QuickActionsProps) {
  const router = useRouter();

  const handlers = [
    onNewIncome ?? (() => router.push('/transactions/new?type=INCOME')),
    onNewExpense ?? (() => router.push('/transactions/new?type=EXPENSE')),
    onTransfer ?? (() => router.push('/transactions?tab=transfers')),
    () => router.push('/cards'),
  ];

  return (
    <nav aria-label="Ações rápidas" className={`${styles.glass} ${styles.dock} fin-glass grid grid-cols-2 gap-1 rounded-3xl p-2 sm:grid-cols-4 sm:p-3 sm:backdrop-blur-md`}>
      {ACTIONS.map(({ label, icon: Icon, colorClasses }, index) => (
        <button
          key={label}
          onClick={handlers[index]}
          className={`${styles.action} flex min-h-16 items-center justify-center gap-2 rounded-2xl px-2 text-xs font-semibold text-text sm:gap-3`}
        >
          <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${colorClasses}`}>
            <Icon className="size-4" aria-hidden="true" />
          </span>
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
