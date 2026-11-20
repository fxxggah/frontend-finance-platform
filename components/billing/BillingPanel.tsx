'use client';
import { useEffect, useRef, useState } from 'react';
import { useBilling } from '@/hooks/use-billing';
import { useDevState } from '@/hooks/use-dev-state';
import { ApiError } from '@/lib/api/errors';
import { formatMoney } from '@/lib/format/money';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const labels: Record<string, string> = { NONE: 'Sem assinatura', INCOMPLETE: 'Pagamento pendente', INCOMPLETE_EXPIRED: 'Pagamento expirado', TRIALING: 'Em avaliação', ACTIVE: 'Assinatura ativa', PAST_DUE: 'Renovação pendente', CANCELED: 'Assinatura cancelada', UNPAID: 'Pagamento não confirmado', PAUSED: 'Assinatura pausada' };
function formatDate(value: string) { return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(new Date(value)); }
export function BillingPanel() {
  const dev = useDevState();
  const busy = useRef(false);
  const key = useRef<string | null>(null);
  const [error, setError] = useState<{ kind: 'checkout' | 'portal'; message: string } | null>(null);
  const [returned, setReturned] = useState(false);
  const [checkingReturn, setCheckingReturn] = useState(false);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('billing') !== 'return') return;
    setReturned(true);
    setCheckingReturn(true);
    const timer = window.setTimeout(() => setCheckingReturn(false), 60_000);
    return () => window.clearTimeout(timer);
  }, []);
  const { plan, status, checkout, portal, refresh } = useBilling(checkingReturn);
  const pending = checkout.isPending || portal.isPending;
  const loading = dev === 'loading' || (!dev && (plan.isPending || status.isPending));
  const failed = dev === 'error' || (!dev && (plan.isError || status.isError));
  const data = dev ? undefined : status.data;
  const awaitingPayment = returned && !data?.paidUntil;
  const errorMessage = error?.kind === 'checkout' && data?.canManage ? null : error?.message;
  async function open(kind: 'checkout' | 'portal') {
    if (busy.current) return;
    busy.current = true; setError(null);
    try {
      if (kind === 'checkout' && !key.current) key.current = crypto.randomUUID();
      const url = kind === 'checkout' ? await checkout.mutateAsync(key.current!) : await portal.mutateAsync();
      window.location.assign(url);
    } catch (failure) {
      if (failure instanceof ApiError && failure.code === 'CHECKOUT_EXPIRED') key.current = null;
      setError({ kind, message: failure instanceof ApiError ? failure.detail : 'Não foi possível abrir a cobrança. Tente novamente em instantes.' });
      busy.current = false;
      void refresh();
    }
  }
  return <section aria-labelledby="billing-title" data-testid="billing-panel">
    <h2 id="billing-title" className="px-1 text-xs font-semibold uppercase tracking-widest text-text-muted">Assinatura PRO</h2>
    <Card variant="solid" className="mt-3 space-y-4 p-5">
      <p className="text-sm font-medium text-primary">Ambiente de testes — sem cobrança real</p>
      {loading ? <div aria-label="Carregando assinatura" className="space-y-3"><Skeleton className="h-7 w-40" /><Skeleton className="h-5 w-56" /></div>
        : failed ? <p role="alert" className="text-sm text-expense">Não foi possível consultar a assinatura agora.</p>
        : data && plan.data ? <>
          <p className="text-xl font-semibold tabular-nums text-text">{formatMoney(plan.data.amount)} <span className="text-sm font-normal text-text-muted">por mês</span></p>
          <p className="text-sm text-text">{labels[data.status]}</p>
          {data.paidUntil && <p className="text-sm text-text-muted">Acesso pago confirmado até {formatDate(data.paidUntil)}.</p>}
          {data.manualProExpiresAt && <p className="text-sm text-text-muted">Acesso concedido manualmente até {formatDate(data.manualProExpiresAt)}. As validades não são somadas.</p>}
          {data.cancelAtPeriodEnd && <p className="text-sm text-text-muted">A renovação está cancelada. O período já pago continua disponível.</p>}
          {data.reviewRequired && <p className="text-sm text-warning">Um reembolso parcial aguarda análise.</p>}
          {awaitingPayment && <p role="status" className="text-sm text-text-muted">{checkingReturn ? 'Aguardando confirmação do pagamento. A tela atualiza automaticamente.' : 'A confirmação ainda não chegou. Se você já pagou, aguarde mais um pouco.'}</p>}
          <div className="flex flex-wrap gap-3">
            {data.canCheckout && !(awaitingPayment && checkingReturn) && <Button type="button" variant="brand" disabled={pending} onClick={() => void open('checkout')}>{checkout.isPending ? 'Abrindo pagamento...' : 'Assinar PRO'}</Button>}
            {data.canManage && <Button type="button" variant="outline" disabled={pending} onClick={() => void open('portal')}>{portal.isPending ? 'Abrindo portal...' : 'Gerenciar assinatura'}</Button>}
          </div>
        </> : <p className="text-sm text-text-muted">Nenhuma assinatura disponível.</p>}
      {errorMessage && <p role="alert" className="text-sm text-expense">{errorMessage}</p>}
      <p className="text-xs text-text-muted">O pagamento abre na Stripe. O acesso PRO é liberado após a confirmação do pagamento.</p>
    </Card>
  </section>;
}