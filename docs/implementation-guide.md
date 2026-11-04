# Guia de Implementação Sequencial Passo a Passo

Este documento define a ordem exata de criação dos arquivos e módulos para construir o frontend do **FIN**, garantindo que as dependências base (tipos, tokens, serviços e primitivos) estejam prontas antes das telas e componentes.

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
- Criar a base de dados determinística para a usuária Marina Souza com `TODAY = "2026-10-31"`.
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
- **`Topbar.tsx`:** Cabeçalho desktop com saudação, seletor de tema claro/escuro, sino de notificações e avatar.
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
- Cartão superior com patrimônio e dívida de cartões.
- Grade de contas com menu de opções e bloqueio de exclusão da última conta ativa.

### 6.2 `components/cards/*.tsx` e `app/(app)/cards/...`
- Cartões visuais realistas, barras de limite usado vs. disponível (alerta vermelho em estouro).
- Tela `/cards/[id]/invoices/[ym]` com status da fatura e modal de pagamento (bloqueado para faturas `OPEN`).

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

