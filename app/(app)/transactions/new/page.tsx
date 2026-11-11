'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { TransactionForm } from '@/components/transactions/TransactionForm';

export default function NewTransactionPage() {
  const router = useRouter();
  const params = useSearchParams();
  return <TransactionForm open defaultType={params.get('type') === 'INCOME' ? 'INCOME' : 'EXPENSE'}
    onOpenChange={open => { if (!open) router.replace('/transactions'); }} />;
}
