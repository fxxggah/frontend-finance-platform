# Guia de Implementação Sequencial Passo a Passo

Este documento define a ordem exata de criação dos arquivos e módulos para construir o frontend do **FIN**, garantindo que as dependências base (tipos, tokens, serviços e primitivos) estejam prontas antes das telas e componentes.

**Fase atual:** integração real das telas das fases 4–7 com a infraestrutura da
fase 2. Configuração, geração OpenAPI, consultas, sessão e limitações atuais estão
em [api-integration.md](./api-integration.md).

**Design global:** a linguagem aprovada no Início foi consolidada na UI compartilhada e aplicada à navegação, módulos financeiros, simulações, Configurações, login e telas de erro. Variantes, restrições de liquid glass e roteiro de validação estão em [design-system.md](./design-system.md). Esta evolução visual não altera as fases de integração nem os contratos de API.

Cobertura de QA e limites das medições estão em [design-validation.md](./design-validation.md).

---

## FASE 1: Configuração Base, Tokens e Tipagem
*Objetivo: Estabelecer o Design System, formatação monetária e contratos TypeScript.*

### 1.1 `app/globals.css`
- Declarar as variáveis de cores para tema claro e tema escuro.
- Configurar o bloco `@theme` do Tailwind CSS v4 para expor os tokens semânticos (`bg-bg`, `bg-surface`, `bg-primary`, `text-income`, `text-expense`, etc.).
- Definir regra de tipografia com fonte Inter e classes utilitárias para `tabular-nums`.

### 1.2 `lib/format/money.ts` e `lib/format/date.ts`
- Implementar `formatMoney(value, options)` utilizando `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`.
- Implementar formatadores de data: extenso (`"31 de outubro de 2026"`), data curta (`"31/10"`), mês/ano (`"out/2026"`) e competência de fatura (`"2026-10"`).

### 1.3 `types/index.ts` (ou `types/domain.ts`)
- Declarar os tipos e enums globais do domínio:
  - `TransactionType`, `AccountType`, `GoalType`, `GoalStatus`, `GoalState`, `InvoiceStatus`, `Period`, `Granularity`.
  - Interfaces: `User`, `Account`, `AccountsResponse`, `Category`, `Transaction`, `Page<T>`, `Transfer`, `CreditCard`, `InvoiceResponse`, `Goal`, `DashboardSummary`, `ExpenseByCategory`, `EvolutionResponse`.

### 1.4 `lib/utils.ts`
- Implementar a função utilitária `cn(...inputs)` combinando `clsx` e `tailwind-merge`.

---

## FASE 2: Camada de API, Autenticação e Mock Data
*Objetivo: Preparar a infraestrutura de dados e controle de sessão.*

### 2.1 `lib/api/errors.ts`
- Criar a classe `ApiError` estendendo `Error`.
- Implementar o mapeamento estruturado do formato `ProblemDetail` (RFC 7807) para capturar `status`, `title`, `detail` e a lista `errors: [{ field, message }]`.

### 2.2 `lib/api/client.ts`
- Implementar `apiFetch<T>(endpoint, options)`.
- Gerenciar inclusão do cabeçalho `Authorization: Bearer <token>` a partir da memória.
- Interceptar status `401 Unauthorized` para executar a rotação do token via `POST /api/v1/auth/refresh` e repetir a requisição.

### 2.3 `lib/mock-data.ts`
- Criar a base de dados determinística para a usuária Hellen Carol com `TODAY = "2026-10-31"`.
- Incluir contas (Conta Principal, Carteira, Reserva Digital e Poupança arquivada), faturas de cartão de 2026-08 a 2026-12 e lançamentos do mês de Outubro/2026.

### 2.4 `lib/api/endpoints/*.ts`
- Criar serviços assíncronos isolados por recurso (`accounts.ts`, `transactions.ts`, `credit-cards.ts`, `goals.ts`, `dashboard.ts`, `simulations.ts`).
- Adicionar o desvio condicional `if (USE_MOCK) return mockData;` em cada método.

### 2.5 `lib/query/keys.ts` e `lib/query/provider.tsx`
- Declarar o objeto de chaves centralizadas `queryKeys`.
- Configurar o `QueryClientProvider` global com `staleTime` de 30 segundos para dashboard/transações e 5 minutos para entidades estruturais.

### 2.6 `app/api/auth/session/route.ts` e `logout/route.ts`
- Criar Route Handlers Next.js para leitura, gravação e remoção do cookie seguro `fin_session`.

### 2.7 `middleware.ts`
- Configurar o middleware para redirecionar acessos não autenticados para `/login` e usuários autenticados para `/dashboard`.

---

## FASE 3: Componentes de UI Primitivos e Ícones
*Objetivo: Construir os blocos visuais reutilizáveis.*

### 3.1 `components/icons/CategoryIcon.tsx`
- Implementar o mapa de ícones do `lucide-react` para renderizar os ícones retornados pela API com fallback para `HelpCircle`.

### 3.2 `components/ui/*.tsx`
- Primitivos acessíveis baseados em Tailwind CSS v4 / shadcn:
  - `Button` (variantes `default`, `brand`, `outline`, `ghost`, `danger`, tamanhos com altura mínima de 44px).
  - `Card` (com suporte a bordas `rounded-2xl` e `rounded-3xl`).
  - `Input` e `Select` (com suporte a estados de erro e foco violeta).
  - `Badge` (variantes `income`, `expense`, `warning`, `primary`).
  - `Dialog` e `Sheet` (para modais desktop e bottom sheets mobile).
  - `ProgressBar` (para limites de cartão e metas).
  - `Skeleton` (para estados de carregamento estruturais).
  - `EmptyState` (ilustração, título, descrição e botão de ação).
  - `ConfirmDialog` (modal de confirmação para ações destrutivas).

---

## FASE 4: Layouts, Shell e Telas Públicas
*Objetivo: Estruturar a navegação responsiva e a autenticação.*

### 4.1 `app/(public)/layout.tsx` e `app/(public)/login/page.tsx`
- Desenvolver a tela de login com blobs decorativos, card centralizado, botão Google e integração com a sessão.

### 4.2 `components/layout/*.tsx`
- **`Sidebar.tsx`:** Barra lateral desktop fixa (`w-64`, cor `#0E1230`, navegação com pílula ativa gradiente e card inferior de incentivo a metas).
- **`Topbar.tsx`:** Cabeçalho desktop com saudação, seletor de tema claro/escuro e avatar.
- **`BottomNav.tsx`:** Barra inferior mobile fixa com efeito vidro, 5 posições e botão central flutuante `+` (`FabAction`).
- **`MobileHeader.tsx`:** Topo mobile com fundo em gradiente hero e cantos `rounded-b-[2rem]`.

### 4.3 `app/(app)/layout.tsx`
- Combinar o Shell responsivo com os providers globais (`QueryClientProvider`, `Toaster` do Sonner).

---

## FASE 5: Módulo Principal — Dashboard (Início) e Transações
*Objetivo: Implementar o núcleo financeiro da aplicação.*

### 5.1 `hooks/`
- Criar hooks do React Query: `useDashboardSummary`, `useExpensesByCategory`, `useEvolution`, `useTransactions`, `useCreateTransaction`, etc.
- Criar `useDevState` para suporte à query string `?state=loading|empty|error`.

### 5.2 `components/dashboard/*.tsx` e `components/charts/*.tsx`
- `HeroBalanceCard.tsx`: Cartão com gradiente, alternador de olho de saldo e pílula de atalhos rápidos.
- `KpiCards.tsx`: Grade com os 4 indicadores de desempenho e sparklines.
- `CashFlowChart.tsx`: Wrapper do Recharts para área de fluxo de caixa acumulado (`toCumulative()`).
- `ExpensesDonutChart.tsx`: Gráfico de rosca com total no centro e legenda detalhada.
- `RecentTransactionsList.tsx`: Lista dos 5 lançamentos mais recentes.

### 5.3 `app/(app)/dashboard/page.tsx`
- Integrar todos os componentes do Início, suportando o seletor de período via URL e estados de carregamento/vazio.

### 5.4 `components/transactions/*.tsx`
- Barra de busca com debounce de 300 ms, filtros de período/categoria/conta e tabela/lista agrupada por data.
- Modal de cadastro de transação com cálculo de parcelas (1x a 24x) e data prevista da fatura.

### 5.5 `app/(app)/transactions/page.tsx`
- Montar a página com abas de **Transações** e **Transferências**.

---

## FASE 6: Módulos de Apoio — Contas, Cartões, Metas e Relatórios
*Objetivo: Implementar as seções secundárias de gestão.*

### 6.1 `app/(app)/accounts/page.tsx`
- Cartão superior com Saldo e dívida de cartões.
- Grade de contas com menu de opções e bloqueio de exclusão da última conta ativa.

### 6.2 `components/cards/*.tsx` e `app/(app)/cards/...`
- Cartões visuais realistas, barras de limite usado vs. disponível (alerta vermelho em estouro).
- Tela `/cards/[id]/invoices/[ym]` com status da fatura e modal de pagamento, inclusive antecipado em faturas `OPEN`, até o saldo restante. O status permanece aberto até o fechamento.

### 6.3 `app/(app)/transfers/page.tsx`
- Histórico de transferências e formulário com validação (`fromAccountId !== toAccountId`).

### 6.4 `components/goals/*.tsx` e `app/(app)/goals/...`
- Assistente de criação em 2 passos para metas `SAVINGS`, `INCOME` e `EXPENSE`.
- Tela de detalhe `/goals/[id]` com lista de contribuições e formulário de aporte/resgate.

### 6.5 `app/(app)/reports/page.tsx`
- Gráficos comparativos mensais, termômetro da taxa de poupança e cards de insights automáticos gerados por `lib/insights.ts`.

---

## FASE 7: Simulações, Configurações e Finalização
*Objetivo: Concluir as rotas restantes e tratamento de erros globais.*

### 7.1 `app/(app)/simulations/investment/page.tsx` e `debt/page.tsx`
- Calculadoras financeiras puras em `lib/simulations.ts` com disclaimer obrigatório e cronogramas de amortização.

### 7.2 `app/(app)/categories/page.tsx`
- Gerenciamento de categorias por abas (Receitas / Despesas), com seletores visuais e trava de tipo para categorias com lançamentos.

### 7.3 `app/(app)/settings/page.tsx`
- Gerenciamento de perfil, alternância de tema e exclusão de conta (LGPD).

### 7.4 `app/not-found.tsx` e `app/error.tsx`
- Telas padronizadas de página não encontrada e erro inesperado com botão de retorno seguro.


## V2 / fase 4 — voz para rascunho (16/11/2026)

Gabriel autorizou integração neste repositório e no backend. Piloto com dados fictícios em desenvolvimento, sem publicação. A divisão antiga de responsáveis e o diretório `api/` do AGENTS são históricos: contratos locais estão em `docs/api/`, snapshot real em `openapi.json`; Gabriel responde pelo projeto inteiro.

Implementar sem novas bibliotecas: `lib/api/endpoints/voice.ts` (áudio binário/idempotência/validação de resposta), `hooks/use-voice-draft.ts` (mutation sem retry/cache persistente), `hooks/use-audio-recorder.ts` (captura/limites/liberação), `components/transactions/VoiceTransactionPanel.tsx` e integração em `TransactionForm.tsx`. Usar os hooks de perfil/catálogos e o formulário existentes; nenhuma rota nova. `lib/config.ts` centraliza `NEXT_PUBLIC_VOICE_PILOT_ENABLED`, false por padrão e inativo em USE_MOCK. Preservar alterações locais anteriores e arquivos .env*.

Sincronizar OpenAPI por `scripts/generate-api-types.mjs --file <snapshot real>` e derivar tipos em `types/domain.ts`; nunca editar api.generated.ts à mão. `ApiError` preserva code e Retry-After. QA: serviços/gravador, pnpm build, Chrome 390/1440 com microfone/transporte controlados (`scripts/voice-smoke.mjs`), regressão de parcelas e estados existentes. Safari real/iPhone e avaliação real do prompt continuam exigindo piloto manual, sem inventar evidências.

### Resultado da implementação V2 / fase 4

- [x] Captura nativa, limites, prévia e envio explícito com JWT/Idempotency-Key.
- [x] Aplicação do rascunho com a política de sugestões aprovada em 16/11/2026, pendências para valor/origem sem base, revisão obrigatória, confirmação existente e bloqueio de clique duplo.
- [x] Tratamento de erros, alternativa manual, liberação de mídia e flag desligada por padrão.
- [x] Snapshot/tipos gerados do OpenAPI real; TypeScript/build e QA automático aprovados.
- [x] Gabriel confirmou o piloto com provedor real no Chrome e, após acesso HTTPS, no Safari do iPhone em 16/11/2026. Evidência manual é o relato do usuário; não atribuir essa comprovação aos testes sintéticos.

Verificações: pnpm test:api (23 testes), money-input (4 testes), pnpm build com flag ligada para QA e desligada no build final. Chrome em 390/1440 validou fluxo de voz e regressão manual (parcelas, erros/foco, envio único e ?state=loading|empty|error). O QA existente ganhou SMOKE_API_URL e espera assíncrona de refetch. Uma regressão inicial identificou foco perdido por campo desabilitado no retorno 400; restaurado o comportamento manual e verificação repetida com sucesso. No backend, compile e 974 testes passaram. Nenhum .env foi editado, nenhum dado real enviado à IA e nenhum endereço público foi publicado. Roteiro completo em [voice-pilot.md](./voice-pilot.md).

### Ajuste aprovado do rascunho — 16/11/2026

Descrição pela fala, tipo/categoria sugeridos, hoje São Paulo e 1 parcela quando ausentes vêm do backend. Valor ausente/origem ambígua continuam pendentes. lib/api/endpoints/voice.ts valida description; TransactionForm aplica a sugestão e mantém revisão obrigatória. Contrato em docs/api/voice.md; atualizar backend antes do frontend. Sem nova dependência ou alteração no Design System.

### Preparação do Safari — 16/11/2026

Gabriel pediu acesso no iPhone. Proxy restrito local pronto e testado; a abertura pública pelo Cloudflare aguarda autorização específica após bloqueio da revisão automática inicial. Scripts independentes em scripts/safari-pilot-proxy.mjs e scripts/safari-pilot-proxy.test.mjs. Sem mudança em endpoints, dependências, .env ou servidor normal de localhost. Próximos passos após autorização: origem temporária, build com API na mesma origem, backend dev, OAuth com origem autorizada e piloto real Safari. Roteiro em docs/voice-pilot.md.
Abertura do piloto: Gabriel autorizou explicitamente o Cloudflare em 16/11/2026 após a preparação. Túnel, proxy restrito e frontend auxiliar iniciados; build e sete testes aprovados. HTTPS real/páginas/assets e bloqueios conferidos sem credenciais; falta Gabriel autorizar a origem no cliente OAuth e executar Safari físico. A URL operacional está no build/safari-pilot/origin.txt do backend; roteiro em docs/voice-pilot.md. Não há deploy de produção ou teste Safari declarado como concluído.
### Fase 4 encerrada — 16/11/2026

Gabriel confirmou os testes no Safari (“testei, tudo okay”). Fase 4 concluída, sem publicação em produção; fase 5/pagamento não iniciada. As sessões auxiliares já estavam encerradas na verificação final (sem cloudflared/listeners 3007/8766), sem interromper processos do usuário. Preparar build local sem a origem temporária e com piloto desligado por padrão, preservando .env. Gabriel deve remover manualmente a origem temporária das origens JavaScript do OAuth. Ver roteiro e histórico em docs/voice-pilot.md.

Build de encerramento restaurado para API localhost:8080 e voz false, sem editar .env. A primeira execução exibiu SecurityFatalError do Next 16.4.3 após compilar; a repetição normal passou, sem desativar verificações ou trocar dependências. Registrar a atualização de segurança do Next como pendência separada antes de produção; os logs estão no backend em build/safari-pilot/build-after-pilot.log e build-after-pilot-retry.log. Isso não invalida o relato funcional do Safari nem representa correção da vulnerabilidade.
## V2 / fase 5 — Stripe sandbox em implementação (16/11/2026)

Gabriel autorizou Stripe e o contrato em docs/api/billing.md. Backend descreve schema V3, endpoints e regras de cancelamento/PRO manual/reembolso/exclusão; nenhuma produção habilitada. Frontend: atualizar Next para 16.4.6 pelas correções de segurança; sem outra biblioteca nova. Criar lib/api/endpoints/billing.ts, hooks/use-billing.ts e components/billing/BillingPanel.tsx nas Configurações; flag NEXT_PUBLIC_BILLING_ENABLED false por padrão. Hooks/queryKeys/cliente existentes e Card/Button/tokens sem mudar Design System. Gerar OpenAPI/tipos do teste de integração do backend. Checkout/portal só URLs Stripe validadas; retorno do navegador nunca ativa PRO. Testes de API/UI controlados e build antes do piloto real sandbox.
### Resultado técnico da fase 5 — 16/11/2026

Implementação sandbox aprovada automaticamente, fase ainda em andamento para configuração/piloto real na conta Stripe de Gabriel. Backend: 1.004 testes e compile com JDK 25; migration V3/validate, isolamento, idempotência, inbox/fencing, assinatura e bloqueio de JWT de usuário em exclusão. Frontend: 28 testes de API, build Next 16.4.6 e Chrome em 390/1440 (checkout/portal único, URLs falsas, retorno sem grant, erros sem retry, chave preservada, estados e regressão de sessão). Build final com billing/voz false e API localhost:8080; modo desligado verificado sem chamadas de cobrança. Snapshot OpenAPI gerado de contexto com IA e Stripe de teste habilitados, sem perder tipos de voz. Não foram lidos/alterados arquivos .env, criados produtos Stripe nem enviados cartões/cobranças reais. R$ 39,90 é só fixture, não preço comercial definido. Roteiro: ../fin-backend/docs/stripe-sandbox.md.
## Lançamento da V1 na Vercel

- O commit candidato usa Node 24.x, pnpm definido no manifesto e instalação com lockfile congelado. Configure Preview e Production na Vercel com URL pública HTTPS da API e Client ID web do Google. As três flags de mock, voz e cobrança devem valer false.
- Configure uma origem HTTPS estável em Preview e a origem de produção no Google OAuth e no CORS do backend no Railway. Use o Client ID correspondente em ambos os lados. Cadastre /sobre como página pública do app no Google e vincule /termos e /privacidade à configuração de marca.
- Os textos públicos estão em revisão. Após aprovação de Gabriel, configure FIN_PUBLIC_COPY_APPROVED=true e FIN_PRIVACY_CONTACT_EMAIL com o contato público em Production. Preview permite revisar as páginas antes da aprovação.
- A sessão compartilha apenas um identificador aleatório de alteração por origem. Uma aba que detecta mudança cancela consultas, limpa o cache e pede confirmação para continuar. O cliente compara sub no refresh, invalida requisições pendentes e preserva o cookie da outra aba.
- Para testar o build de lançamento fora da Vercel, use FIN_RELEASE_BUILD=true e as mesmas variáveis públicas. Execute pnpm test:api, node --test scripts/release-readiness.test.mjs scripts/money-input.test.cjs scripts/safari-pilot-proxy.test.mjs e node scripts/auth-multitab-smoke.mjs.
- Em Preview, validar login Google real, recarga, logout, troca de conta em duas abas e criação, edição e exclusão de uma transação fictícia no Chrome e no Safari do iPhone. Após aprovação, gerar Production a partir do mesmo commit com as variáveis de produção e repetir o teste de login no domínio final.
