'use client';

import { CashFlowChart } from '@/components/charts/CashFlowChart';
import { ExpensesDonutChart } from '@/components/charts/ExpensesDonutChart';
import { GoalsSection } from './GoalsSection';
import { RecentTransactionsList } from './RecentTransactionsList';
import type { EvolutionPoint, ExpenseByCategory, Goal, RecentTransaction } from '@/types';

interface FinancialSectionsProps {
  points: EvolutionPoint[];
  categories: ExpenseByCategory[];
  totalExpense: number;
  goals: Goal[];
  transactions: RecentTransaction[];
  showCharts: boolean;
}

export function FinancialSections({ points, categories, totalExpense, goals, transactions, showCharts }: FinancialSectionsProps) {
  return (
    <>
      {showCharts && <div className="mt-9 grid min-w-0 gap-6 xl:grid-cols-2">
        <CashFlowChart points={points} />
        <ExpensesDonutChart categories={categories} total={totalExpense} />
      </div>}
      <GoalsSection goals={goals} />
      <RecentTransactionsList transactions={transactions} />
    </>
  );
}
