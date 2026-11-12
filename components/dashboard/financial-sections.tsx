'use client';

import { CashFlowChart } from '@/components/charts/CashFlowChart';
import { ExpensesDonutChart } from '@/components/charts/ExpensesDonutChart';
import { GoalsSection } from './GoalsSection';
import { RecentTransactionsList } from './RecentTransactionsList';
import type { EvolutionPoint, ExpenseByCategory, Goal, Period, RecentTransaction } from '@/types';

interface FinancialSectionsProps {
  points: EvolutionPoint[];
  period: Period;
  categories: ExpenseByCategory[];
  totalExpense: number;
  goals: Goal[];
  transactions: RecentTransaction[];
  showCharts: boolean;
}

export function FinancialSections({ points, period, categories, totalExpense, goals, transactions, showCharts }: FinancialSectionsProps) {
  return (
    <>
      {showCharts && <div className="mt-7 grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <CashFlowChart points={points} period={period} />
        <ExpensesDonutChart categories={categories} total={totalExpense} />
      </div>}
      <RecentTransactionsList transactions={transactions} />
      <GoalsSection goals={goals} />
    </>
  );
}
