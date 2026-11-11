'use client';

import Link from 'next/link';
import { TrendingUp, TrendingDown, ChevronRight, PieChart } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { CategoryIcon } from '@/components/icons/CategoryIcon';
import { formatMoney } from '@/lib/format/money';
import { cn } from '@/lib/utils';
import type { DashboardSummary, ExpenseByCategory } from '@/types';

interface SummaryKpisProps {
  summary?: DashboardSummary | null;
  topCategory?: ExpenseByCategory | null;
  periodQuery: string; // Ex: "?period=MONTH&date=2026-10-31"
}

export function SummaryKpis({ summary, topCategory, periodQuery }: SummaryKpisProps) {
  const totalIncome = summary?.totalIncome ?? 0;
  const totalExpense = summary?.totalExpense ?? 0;
  const balance = summary?.balance ?? 0;

  // Taxa de poupança: (saldo / receitas) * 100
  const savingsRate = totalIncome > 0 ? Math.max(0, (balance / totalIncome) * 100) : 0;

  const incomeChange = summary?.previous?.incomeChangePct;
  const expenseChange = summary?.previous?.expenseChangePct;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-1 gap-3.5 sm:gap-4">
      {/* 1. Receitas do Período */}
      <Link href={`/transactions${periodQuery ? `${periodQuery}&` : '?'}type=INCOME`} className="block group">
        <Card className="p-4 sm:p-5 transition-all group-hover:border-income/50 group-hover:shadow-md flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                Receitas
              </span>
              <ChevronRight size={14} className="text-text-muted group-hover:text-income transition-colors" />
            </div>
            <p className="mt-1 text-lg sm:text-xl font-bold tabular-nums text-text">
              {formatMoney(totalIncome)}
            </p>
          </div>

          <div className="mt-3 flex items-center gap-1.5 text-xs">
            {incomeChange !== undefined && incomeChange !== null ? (
              <span
                className={cn(
                  'flex items-center gap-0.5 font-semibold tabular-nums',
                  incomeChange >= 0 ? 'text-income' : 'text-expense'
                )}
              >
                {incomeChange >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                {incomeChange >= 0 ? `+${incomeChange.toFixed(1)}%` : `${incomeChange.toFixed(1)}%`}
              </span>
            ) : (
              <span className="text-text-muted">Sem anterior</span>
            )}
            <span className="text-[11px] text-text-muted">vs. anterior</span>
          </div>
        </Card>
      </Link>

      {/* 2. Despesas do Período */}
      <Link href={`/transactions${periodQuery ? `${periodQuery}&` : '?'}type=EXPENSE`} className="block group">
        <Card className="p-4 sm:p-5 transition-all group-hover:border-expense/50 group-hover:shadow-md flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                Despesas
              </span>
              <ChevronRight size={14} className="text-text-muted group-hover:text-expense transition-colors" />
            </div>
            <p className="mt-1 text-lg sm:text-xl font-bold tabular-nums text-text">
              {formatMoney(totalExpense)}
            </p>
          </div>

          <div className="mt-3 flex items-center gap-1.5 text-xs">
            {expenseChange !== undefined && expenseChange !== null ? (
              <span
                className={cn(
                  'flex items-center gap-0.5 font-semibold tabular-nums',
                  expenseChange <= 0 ? 'text-income' : 'text-expense'
                )}
              >
                {expenseChange <= 0 ? <TrendingDown size={13} /> : <TrendingUp size={13} />}
                {expenseChange >= 0 ? `+${expenseChange.toFixed(1)}%` : `${expenseChange.toFixed(1)}%`}
              </span>
            ) : (
              <span className="text-text-muted">Sem anterior</span>
            )}
            <span className="text-[11px] text-text-muted">vs. anterior</span>
          </div>
        </Card>
      </Link>

      {/* 3. Maior Categoria de Despesa */}
      <Link
        href={
          topCategory
            ? `/transactions${periodQuery ? `${periodQuery}&` : '?'}categoryId=${topCategory.categoryId}`
            : `/transactions${periodQuery}`
        }
        className="block group"
      >
        <Card className="p-4 sm:p-5 transition-all group-hover:border-primary/50 group-hover:shadow-md flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                Maior Categoria
              </span>
              <ChevronRight size={14} className="text-text-muted group-hover:text-primary transition-colors" />
            </div>

            {topCategory ? (
              <div className="mt-2 flex items-center gap-2.5 min-w-0">
                <div
                  className="flex size-8 shrink-0 items-center justify-center rounded-xl"
                  style={{
                    backgroundColor: `${topCategory.color}15`,
                    color: topCategory.color,
                  }}
                >
                  <CategoryIcon name={topCategory.icon} size={16} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-text">{topCategory.name}</p>
                  <p className="text-xs font-semibold tabular-nums text-text-muted">
                    {formatMoney(topCategory.total)}
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-2 text-xs text-text-muted">Sem dados no período</p>
            )}
          </div>

          {topCategory && (
            <p className="mt-3 text-[11px] text-text-muted tabular-nums">
              Representa <strong>{topCategory.percentage.toFixed(1)}%</strong> das despesas
            </p>
          )}
        </Card>
      </Link>

      {/* 4. Taxa de Poupança */}
      <Link href={`/transactions${periodQuery}`} className="block group">
        <Card className="p-4 sm:p-5 transition-all group-hover:border-primary/50 group-hover:shadow-md flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                Taxa de Poupança
              </span>
              <ChevronRight size={14} className="text-text-muted group-hover:text-primary transition-colors" />
            </div>
            <p className="mt-1 text-lg sm:text-xl font-bold tabular-nums text-text">
              {savingsRate.toFixed(1)}%
            </p>
          </div>

          <div className="mt-3 space-y-1">
            <ProgressBar value={savingsRate} variant="income" size="sm" />
            <p className="text-[10px] text-text-muted">
              Saldo líquido sobre receitas
            </p>
          </div>
        </Card>
      </Link>
    </div>
  );
}

