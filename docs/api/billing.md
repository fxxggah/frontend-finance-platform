# Assinatura PRO — Stripe sandbox (fase 5)

Contrato aprovado por Gabriel em 16/11/2026. Backend só dev & !prod e FIN_BILLING_ENABLED=true. Frontend opt-in NEXT_PUBLIC_BILLING_ENABLED=true; false por padrão e inativo em USE_MOCK. Um plano mensal BRL/cartão; sem trial/cupons/troca de plano. Preço vem de GET /api/v1/billing/plan; nunca definir valor no navegador.

GET /billing/plan → { amount, currency: BRL, interval: MONTH, testMode: true }.
GET /billing/subscription → { status, paidUntil, manualProExpiresAt, effectiveProExpiresAt, cancelAtPeriodEnd, canCheckout, canManage, reviewRequired, testMode: true }. Datas nullable Instant UTC; permissões e validade são calculadas pelo backend.
POST /billing/checkout-sessions sem corpo, Idempotency-Key UUID → { url }, somente https://checkout.stripe.com.
POST /billing/portal-sessions sem corpo → { url }, somente https://billing.stripe.com.
JWT vem do cliente central. Não aceitar/enviar customer/subscription/user ID, preço, moeda ou URL de retorno. Status não implica pagamento; retorno ?billing=return somente solicita atualização, nunca concede PRO. Perfil /users/me é a fonte do plano efetivo. Cancelamento mantém período pago; reembolso/disputa afetam só o período da cobrança; PRO manual não é somado nem revogado por isso.

Erros ProblemDetail.code: 400 INVALID_BILLING_REQUEST/INVALID_IDEMPOTENCY_KEY; 404 rota desativada ou usuário/cliente ausente; 409 BILLING_OPERATION_IN_PROGRESS/SUBSCRIPTION_EXISTS/CHECKOUT_EXPIRED; 422 BILLING_REVIEW_REQUIRED; 502 INVALID_STRIPE_RESPONSE; 503 BILLING_UNAVAILABLE. Não repetir mutations automaticamente; manter a chave da intenção em falhas incertas e permitir retomar checkout pronto. Consulta de status e atualização manual continuam disponíveis. Bloquear cliques concorrentes e validar URL hospedada antes de navegar.

Painel nas Configurações, com preço/validade/status da API, estados loading/empty/error, botão Assinar/Continuar e Gerenciar. Atualizar perfil quando validade efetiva mudar. Sem persistir cartão/chaves/IDs da Stripe em localStorage/Zustand/URL. Modo de testes claramente identificado; nenhuma cobrança real autorizada nesta fase. DELETE /users/me pode falhar 503 e já deixar usuário bloqueado enquanto cancela recorrência; informar indisponibilidade sem afirmar exclusão concluída.