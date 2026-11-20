'use client';
import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBillingPlan, getBillingStatus, createCheckout, createBillingPortal } from '@/lib/api/endpoints/billing';
import { queryKeys } from '@/lib/query/keys';

export function useBilling(checkingReturn: boolean) {
  const client = useQueryClient();
  const plan = useQuery({ queryKey: queryKeys.billing.plan, queryFn: getBillingPlan, retry: false, staleTime: 60_000 });
  const status = useQuery({ queryKey: queryKeys.billing.status, queryFn: getBillingStatus, retry: false, staleTime: 0, refetchInterval: query => checkingReturn && !query.state.data?.paidUntil ? 2_000 : 30_000 });
  const checkout = useMutation({ mutationFn: createCheckout, retry: false, gcTime: 0 });
  const portal = useMutation({ mutationFn: createBillingPortal, retry: false, gcTime: 0 });
  const validity = status.data?.effectiveProExpiresAt;
  useEffect(() => {
    if (validity !== undefined) void client.invalidateQueries({ queryKey: queryKeys.auth.me });
  }, [client, validity]);
  async function refresh() { await Promise.all([plan.refetch(), status.refetch(), client.invalidateQueries({ queryKey: queryKeys.auth.me })]); }
  return { plan, status, checkout, portal, refresh };
}