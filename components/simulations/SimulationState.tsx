'use client';

import type { ReactNode } from 'react';
import { AlertCircle, Calculator } from 'lucide-react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useDevState } from '@/hooks/use-dev-state';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { PageContainer } from '@/components/ui/page';

export function SimulationState({ children }: { children: ReactNode }) {
  const state = useDevState();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const clearState = () => {
    const next = new URLSearchParams(params.toString());
    next.delete('state');
    router.replace(`${pathname}${next.size ? `?${next}` : ''}`);
  };
  if (!state) return children;
  return <PageContainer className="space-y-5">
    {state === 'loading' ? <div role="status" aria-label="Carregando simulação"><Skeleton className="h-80 rounded-3xl" /></div>
      : <EmptyState icon={state === 'error' ? AlertCircle : Calculator}
          title={state === 'error' ? 'Não foi possível carregar a simulação' : 'Nenhuma simulação por enquanto'}
          description="Configure os valores para explorar os resultados."
          actionLabel={state === 'error' ? 'Tentar novamente' : 'Configurar simulação'} onAction={clearState} />}
  </PageContainer>;
}
