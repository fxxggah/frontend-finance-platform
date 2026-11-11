import { formatMoney } from '@/lib/format/money';
import type { Page, Transaction } from '@/types';

interface FilterSummaryProps {
  data: Page<Transaction> | undefined;
}

export function FilterSummary({ data }: FilterSummaryProps) {
  if (!data) return null;

  const transactions = data.content;
  const incomeTotal = transactions
    .filter((t) => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);
  const expenseTotal = transactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);
  const balance = incomeTotal - expenseTotal;

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 text-sm">
      <span className="text-text-muted">
        <strong className="text-text">{data.totalElements}</strong> transações
      </span>
      <span className="text-text-muted">·</span>
      <span className="tabular-nums text-income font-semibold">
        + {formatMoney(incomeTotal, { signDisplay: 'never' })} receitas
      </span>
      <span className="text-text-muted">·</span>
      <span className="tabular-nums text-expense font-semibold">
        − {formatMoney(expenseTotal, { signDisplay: 'never' })} despesas
      </span>
      <span className="text-text-muted">·</span>
      <span className={`tabular-nums font-bold ${balance >= 0 ? 'text-income' : 'text-expense'}`}>
        Saldo: {formatMoney(balance, { showSign: true })}
      </span>
    </div>
  );
}

