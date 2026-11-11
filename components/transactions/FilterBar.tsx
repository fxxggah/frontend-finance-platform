'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useCategories } from '@/hooks/use-categories';
import { useAccounts } from '@/hooks/use-accounts';
import type { TransactionType } from '@/types';
import { PERIOD_OPTIONS, isPeriod } from '@/lib/periods';
import { usePeriodParams } from '@/hooks/use-period-params';

export function FilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { period, date, from, to, setPeriod } = usePeriodParams();

  const { data: categoriesData } = useCategories();
  const { data: accountsData } = useAccounts();

  const [search, setSearch] = useState(searchParams.get('q') ?? '');

  // Debounce 300ms para a busca
  useEffect(() => {
    if (search === (searchParams.get('q') ?? '')) return;
    const timer = setTimeout(() => {
      const next = new URLSearchParams(searchParams.toString());
      if (search) next.set('q', search);
      else next.delete('q');
      next.set('page', '0');
      router.push(`${pathname}?${next.toString()}`);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, searchParams, router, pathname]);

  const setParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(searchParams.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      next.set('page', '0');
      router.push(`${pathname}?${next.toString()}`);
    },
    [searchParams, router, pathname]
  );

  const type = searchParams.get('type') as TransactionType | null;
  const categoryId = searchParams.get('categoryId') ?? '';
  const accountId = searchParams.get('accountId') ?? '';

  const hasFilters = !!(type || categoryId || accountId || search || period !== 'MONTH');

  const clearFilters = () => {
    setSearch('');
    router.push(pathname);
  };

  return (
    <Card variant="panel" className="p-4 sm:p-5">
      {/* Linha 1: busca */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
        <Input
          type="text"
          placeholder="Buscar transações..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
          aria-label="Buscar transações"
        />
      </div>

      {/* Linha 2: filtros em grade */}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {/* Período */}
        <Select
          aria-label="Período"
          value={period}
          onChange={(e) => {
            if (isPeriod(e.target.value)) setPeriod({ period: e.target.value });
          }}
        >
          {PERIOD_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>

        {/* Tipo */}
        <Select
          aria-label="Tipo"
          value={type ?? ''}
          onChange={(e) => setParam('type', e.target.value)}
        >
          <option value="">Todos os tipos</option>
          <option value="INCOME">Receitas</option>
          <option value="EXPENSE">Despesas</option>
        </Select>

        {/* Categoria */}
        <Select
          aria-label="Categoria"
          value={categoryId}
          onChange={(e) => setParam('categoryId', e.target.value)}
        >
          <option value="">Todas as categorias</option>
          {categoriesData?.map((c) => (
            <option key={c.id} value={String(c.id)}>
              {c.name}
            </option>
          ))}
        </Select>

        {/* Conta */}
        <Select
          aria-label="Conta"
          value={accountId}
          onChange={(e) => setParam('accountId', e.target.value)}
        >
          <option value="">Todas as contas</option>
          {accountsData?.accounts.map((a) => (
            <option key={a.id} value={String(a.id)}>
              {a.name}
            </option>
          ))}
        </Select>
      </div>

      {period === 'CUSTOM' && <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Input type="date" label="De" value={from ?? date} max={to ?? date}
          onChange={event => { if (event.target.value) setPeriod({ from: event.target.value }); }} />
        <Input type="date" label="Até" value={to ?? date} min={from ?? date}
          onChange={event => { if (event.target.value) setPeriod({ to: event.target.value }); }} />
      </div>}

      {/* Limpar filtros */}
      {hasFilters && (
        <button
          onClick={clearFilters}
          className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
        >
          <X className="size-3" />
          Limpar filtros
        </button>
      )}
    </Card>
  );
}
