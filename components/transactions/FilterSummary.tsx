import type { Page, Transaction } from '@/types';

export function FilterSummary({ data }: { data: Page<Transaction> | undefined }) {
  if (!data) return null;
  return <p className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text-muted">
    <strong className="tabular-nums text-text">{data.totalElements}</strong> transações encontradas
  </p>;
}

