'use client';

import { ArrowDownLeft, ArrowUpRight, Repeat2, CreditCard } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
    <div className="mx-3 grid grid-cols-4 gap-1 rounded-3xl border border-white/70 bg-surface/85 p-3 shadow-[0_12px_30px_-16px_rgba(20,23,46,.3)] backdrop-blur-xl sm:mx-8 sm:px-5">
      {ACTIONS.map(({ label, icon: Icon, colorClasses }, index) => (
        <button
          key={label}
          onClick={handlers[index]}
          className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl text-center text-[10px] font-semibold text-text transition hover:bg-surface-soft"
        >
          <span className={`grid size-10 place-items-center rounded-2xl ${colorClasses}`}>
            <Icon className="size-4" />
          </span>
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
