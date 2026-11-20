import { z } from 'zod';
import { apiFetch } from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';
import { USE_MOCK } from '@/lib/config';

const date = z.string().datetime({ offset: true }).nullable();
export const billingPlanSchema = z.object({ amount: z.number().finite().positive(), currency: z.literal('BRL'), interval: z.literal('MONTH'), testMode: z.literal(true) });
export const billingStatusSchema = z.object({
  status: z.enum(['NONE', 'INCOMPLETE', 'INCOMPLETE_EXPIRED', 'TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'UNPAID', 'PAUSED']),
  paidUntil: date, manualProExpiresAt: date, effectiveProExpiresAt: date,
  cancelAtPeriodEnd: z.boolean(), canCheckout: z.boolean(), canManage: z.boolean(), reviewRequired: z.boolean(), testMode: z.literal(true),
});
export type BillingPlan = z.infer<typeof billingPlanSchema>;
export type BillingStatus = z.infer<typeof billingStatusSchema>;
function realBackend() {
  if (USE_MOCK) throw new ApiError({ status: 503, title: 'Assinatura indisponível', detail: 'O teste de assinatura precisa do backend de desenvolvimento.' });
}
function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) throw new ApiError({ status: 502, title: 'Resposta inválida', detail: 'Não foi possível validar os dados da assinatura.' });
  return result.data;
}
function session(value: unknown, host: string): string {
  const data = parse(z.object({ url: z.string().url() }), value);
  const url = new URL(data.url);
  if (url.protocol !== 'https:' || url.hostname !== host || url.username || url.password || url.port) {
    throw new ApiError({ status: 502, title: 'Endereço inválido', detail: 'Não foi possível abrir o pagamento com segurança.' });
  }
  return data.url;
}
export async function getBillingPlan(): Promise<BillingPlan> {
  realBackend(); return parse(billingPlanSchema, await apiFetch<unknown>('/billing/plan'));
}
export async function getBillingStatus(): Promise<BillingStatus> {
  realBackend(); return parse(billingStatusSchema, await apiFetch<unknown>('/billing/subscription'));
}
export async function createCheckout(key: string): Promise<string> {
  realBackend(); return session(await apiFetch<unknown>('/billing/checkout-sessions', { method: 'POST', headers: { 'Idempotency-Key': key } }), 'checkout.stripe.com');
}
export async function createBillingPortal(): Promise<string> {
  realBackend(); return session(await apiFetch<unknown>('/billing/portal-sessions', { method: 'POST' }), 'billing.stripe.com');
}