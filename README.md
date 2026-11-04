# FIN: Planejamento do Frontend

Documento de planejamento do frontend do app de finanças pessoais **FIN**. Reúne as decisões de produto, a arquitetura, o contrato com o backend, o design system, a especificação das telas e a ordem de implementação.

> **Fonte Oficial da Verdade:** A documentação técnica detalhada e modular para desenvolvimento com agentes de IA e desenvolvedores está dividida em:
> - [`docs/`](./docs/README.md): Arquitetura, Design System, Estado & Dados, Rotas/Layouts, Especificação de Telas e Guia Sequencial.
> - [`api/`](./api/README.md): Contratos oficiais de integração RESTful do backend (rotas, payloads, respostas e erros).

> **Tema padrão: claro.** O tema escuro é opcional e alternável pelo usuário. Todos os tokens existem nos dois temas, mas o app abre em claro.
>
> Escopo atual: tela **Início** (dashboard), em duas etapas. As demais telas (Transações, Contas, Cartões, Metas, Relatórios, Simulações, Configurações) estão previstas na arquitetura e na navegação.

---

## 1. Decisões de produto

| Item | Decisão |
|---|---|
| Tema | **Claro por padrão**, escuro opcional (botão no topo) |
| Atalhos rápidos | Nova receita, Nova despesa, Transferir, Pagar fatura |
| Navegação mobile | Início, Transações, botão central **+**, Relatórios, Mais (contas, cartões, metas, configurações) |
| Efeito glass | Somente na pílula de atalhos sobre o cartão de saldo e na barra inferior. O resto é sólido, para manter a legibilidade e o desempenho em celulares fracos |
| 4º KPI | "Faturas em aberto" (o backend já devolve `creditCardDebt`), em vez de orçamento |
| Dados (fase atual) | Mock realista em R$, sem marcas reais, mês de outubro/2026 completo |
| Idioma | Tudo em português (o item de menu "Dashboard" vira "Início") |
| Prioridade de plataforma | Mobile primeiro, com versão desktop completa |
| Regra de ouro | O front **exibe** o que o backend calcula. Saldo, fatura, status de meta e intervalo de período vêm da API |

---

## 2. Stack e convenções

| Tema | Escolha | Motivo |
|---|---|---|
| Framework | Next.js (App Router), **TypeScript estrito** | Server Components na leitura inicial; Client Components só onde há interação |
| Estilo | Tailwind CSS v4 + shadcn/ui, tokens em CSS (`@theme`) | Cores e espaçamentos em um lugar só |
| Dados do servidor | **TanStack Query** | Cache, refetch e estados de loading/erro prontos |
| Estado de UI | **Zustand** (tema, sidebar, filtros de interface) | Leve; não guarda dado do backend |
| Formulários | React Hook Form + Zod | Validação espelhando as regras do backend |
| Gráficos | **Recharts** | Declarativo; aceita tema por variável CSS |
| Ícones | lucide-react (sem emojis) | Importar por dicionário fixo, nunca a biblioteca inteira |
| Fonte | Inter via `next/font` | |
| Login | Google Identity Services, enviando o **ID Token** ao backend | Ver seção 6 |
| Sessão | Access token em memória + refresh token em cookie `httpOnly` | Ver seção 6 |

Convenções:

- Textos visíveis em português do Brasil; código, arquivos, componentes e variáveis em inglês.
- Valores monetários com `tabular-nums` e `Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })` (`R$ 1.234,56`), centralizados em `lib/format`.
- **Fase atual sem `fetch`:** tudo vem de `lib/mock-data.ts`, com interfaces que espelham a API real para trocar o mock depois sem refatorar.

---

## 3. Arquitetura

### 3.1 Árvore de diretórios

```
fin-web/
├── app/
│   ├── (public)/
│   │   ├── login/page.tsx
│   │   └── layout.tsx
│   ├── (app)/                       # área autenticada
│   │   ├── layout.tsx               # sidebar/bottom-nav + guard de sessão
│   │   ├── dashboard/page.tsx       # tela "Início"
│   │   ├── transactions/
│   │   │   ├── page.tsx
│   │   │   └── new/page.tsx         # ou modal interceptado
│   │   ├── accounts/page.tsx
│   │   ├── cards/
│   │   │   ├── page.tsx
│   │   │   └── [id]/invoices/[ym]/page.tsx
│   │   ├── transfers/page.tsx
│   │   ├── goals/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── reports/page.tsx
│   │   ├── simulations/
│   │   │   ├── investment/page.tsx
│   │   │   └── debt/page.tsx
│   │   └── settings/page.tsx
│   ├── api/auth/
│   │   ├── session/route.ts         # grava o refresh token em cookie
│   │   ├── refresh/route.ts         # troca o cookie por novo access token
│   │   └── logout/route.ts
│   ├── layout.tsx                   # raiz: fontes, tema, providers
│   ├── globals.css                  # tokens CSS e @theme do Tailwind
│   ├── not-found.tsx
│   └── error.tsx
├── components/
│   ├── ui/                          # Button, Card (solid | brand | glass), Badge, Input, Dialog/Sheet...
│   ├── layout/                      # Sidebar, BottomNav, Topbar, MobileHeader, QuickActionsSheet, MoreSheet
│   ├── dashboard/                   # BalanceCard, QuickActions, KpiCard, PeriodSelect, CashFlowChart,
│   │                                # CategoryDonut, GoalsCarousel, RecentTransactions, EncouragementBanner
│   ├── transactions/                # TransactionList, TransactionRow, TransactionFilters
│   ├── charts/                      # wrappers de Recharts já com tema
│   ├── cards/                       # CreditCardVisual, InvoiceSummary
│   ├── goals/                       # GoalCard, GoalProgress
│   └── icons/                       # CategoryIcon (mapa de chaves → lucide)
├── lib/
│   ├── api/
│   │   ├── client.ts                # fetch base: baseURL, Bearer, refresh automático, ProblemDetail
│   │   ├── errors.ts                # ApiError + parser de ProblemDetail
│   │   └── endpoints/               # um arquivo por feature (accounts.ts, transactions.ts...)
│   ├── query/
│   │   ├── keys.ts                  # query keys centralizadas
│   │   └── provider.tsx
│   ├── auth/
│   │   ├── session.ts
│   │   └── google.ts                # carregamento do Google Identity Services
│   ├── format/
│   │   ├── money.ts                 # formatação BRL, sem float
│   │   └── date.ts                  # período, fuso America/Sao_Paulo
│   ├── mock-data.ts                 # fase atual (removido quando a API entrar)
│   └── utils.ts                     # cn() = clsx + tailwind-merge
├── services/                        # regras de apresentação (não de negócio)
│   ├── period.ts                    # seletor de período → params da API
│   └── chart-data.ts                # resposta da API → série do gráfico
├── types/
│   ├── api.generated.ts             # gerado do OpenAPI; nunca editar à mão
│   ├── domain.ts                    # tipos de UI derivados (ex.: ChartPoint)
│   └── index.ts
├── stores/
│   ├── ui.store.ts                  # sidebar, tema
│   └── filters.store.ts             # filtros da tela de transações
├── hooks/                           # useDashboard, useTransactions, useGoals...
├── styles/tokens.ts                 # espelho tipado dos tokens (uso em JS)
├── middleware.ts                    # protege rotas (app) sem sessão
├── .env.example
└── next.config.ts
```

### 3.2 Separação de responsabilidades

| Camada | Responsabilidade | Não faz |
|---|---|---|
| `app/` | Rotas e layouts; leitura inicial no servidor | |
| `components/` | Somente apresentação | Chamar `fetch` direto |
| `lib/api/endpoints/` | **Única** camada que conhece URL e formato do backend | |
| `hooks/` | Junta endpoint + query + estado de UI para a tela | Telas não usam `useQuery` cru |
| `services/` | Transformação para exibição (ex.: agrupar série do gráfico) | Recalcular saldo, fatura ou progresso |
| `types/api.generated.ts` | Contrato tipado da API | Edição manual |

---

## 4. Rotas

| Rota | Renderização | Fonte de dados (futura) |
|---|---|---|
| `/login` | Estática | Google Identity Services |
| `/dashboard` | Server Component com dados iniciais + client para o período | `GET /dashboard/summary`, `/expenses-by-category`, `/evolution`, `/recent-transactions` |
| `/transactions` | Client (filtros e paginação sem recarregar) | `GET /transactions` com filtros na URL |
| `/transactions/new` | Modal interceptado | `POST /transactions` |
| `/accounts` | Client | `GET /accounts` |
| `/cards/[id]/invoices/[ym]` | Server | `GET /credit-cards/{id}/invoices/{yyyy-MM}` |
| `/goals/[id]` | Server | `GET /goals/{id}` |
| `/reports` | Client | `dashboard/*` com `period` na URL |
| `/simulations/*` | Client | `POST /simulations/*` (sem cache, é cálculo) |

**Filtros sempre na URL** (`searchParams`): período, tipo, categoria e página. O link fica compartilhável, o botão voltar funciona e recarregar não perde o filtro.

```
/transactions?period=MONTH&date=2026-11-02&type=EXPENSE&categoryId=3&page=0
```

---

## 5. Estado e cache

| Tipo | Onde vive | Exemplo |
|---|---|---|
| Dado do servidor | TanStack Query | saldo, transações, metas |
| Estado de URL | `searchParams` | período, filtros, página |
| Estado de UI efêmero | Zustand ou `useState` | sidebar aberta, tema, modal, saldo oculto |

Nunca copiar dado do servidor para o Zustand: duas verdades geram tela desatualizada.

**Cache:**

- `staleTime` de 30 s para dashboard e transações; 5 min para categorias e contas.
- Após mutação, invalidar **as keys afetadas**, não tudo. Criar transação invalida `transactions`, `dashboard`, `accounts` e `credit-cards`.

**Query keys centralizadas** (`lib/query/keys.ts`):

```ts
export const qk = {
  accounts: ["accounts"] as const,
  categories: (type?: TransactionType) => ["categories", { type }] as const,
  transactions: (filters: TransactionFilters) => ["transactions", filters] as const,
  dashboard: {
    summary: (p: PeriodParams) => ["dashboard", "summary", p] as const,
    byCategory: (p: PeriodParams) => ["dashboard", "by-category", p] as const,
    evolution: (p: PeriodParams) => ["dashboard", "evolution", p] as const,
  },
  creditCards: ["credit-cards"] as const,
  invoice: (cardId: number, ym: string) => ["invoice", cardId, ym] as const,
  goals: (filters?: GoalFilters) => ["goals", filters] as const,
};
```

---

## 6. Autenticação

O refresh token **não** fica em `localStorage` (qualquer script injetado roubaria a sessão). Fluxo:

1. Login com Google: o front recebe o **ID Token**.
2. O front envia o ID Token para `POST /api/v1/auth/google` (direto ou via Route Handler).
3. O backend devolve `accessToken` (15 min) e `refreshToken` (7 dias).
4. O Route Handler `app/api/auth/session` grava o **refresh token em cookie `httpOnly`, `secure`, `sameSite=lax`**. O access token fica **só em memória**.
5. Ao reabrir o app, o front chama `POST /api/auth/refresh` (Route Handler), que lê o cookie e obtém novo access token.

O Route Handler como proxy evita CORS com credenciais e mantém o refresh token fora do JavaScript.

**Interceptor** (`lib/api/client.ts`):

- Anexa `Authorization: Bearer` em toda chamada.
- Em **401**, tenta refresh **uma vez** e repete a chamada original.
- Se o refresh falhar, limpa a sessão e redireciona para `/login`.
- Chamadas simultâneas com 401 disparam **um único refresh** (promise compartilhada), senão a rotation do backend invalida o token na segunda.

**Guard:** `middleware.ts` redireciona para `/login` quando não há cookie de sessão. É só UX; a validação real é do backend.

---

## 7. Erros e contrato com o backend

### 7.1 Tratamento de erros

| Status | Tratamento |
|---|---|
| Qualquer `ProblemDetail` | Vira `ApiError` com `status`, `title`, `detail` e `errors[]` |
| 400 | `errors[]` mapeado nos campos do formulário (`setError` do React Hook Form) |
| 422 | Toast com o `detail` (regra de negócio, em português) |
| 404 em detalhe | Tela "não encontrado", nunca erro genérico |

### 7.2 Tipos gerados

1. O backend publica `/v3/api-docs`.
2. `npx openapi-typescript <url> -o types/api.generated.ts` gera os tipos.
3. Os endpoints em `lib/api/endpoints/` usam esses tipos: se a API mudar, o TypeScript acusa no build.

Adicionar o script `"api:types"` no `package.json`.

---

## 8. Design system

### 8.1 Direção visual

Tema **claro suave** (não branco puro), identidade **violeta e azul**, cantos bem arredondados, sombras difusas, gradientes modernos e tipografia limpa. Tokens **semânticos** (`--surface`, não `--gray-900`), para os temas trocarem sem tocar em componente.

### 8.2 Tokens de cor

| Token | Claro (padrão) | Escuro (opcional) |
|---|---|---|
| `bg` | `#EDEFFA` | `#0B0E24` |
| `surface` | `#FFFFFF` | `#141834` |
| `surface-soft` | `#F6F7FD` | `#1B2043` |
| `surface-glass` | `rgba(255,255,255,0.85)` | `rgba(30,34,74,0.55)` |
| `border` | `#E3E6F5` | `rgba(255,255,255,0.08)` |
| `text` | `#14172E` | `#F4F5FF` |
| `text-muted` | `#6B7194` | `#9AA0C7` |
| `primary` | `#5B3DF5` | `#7C5CFF` |
| `primary-soft` | `#EFEAFF` | ajustar para contraste |
| `accent` | `#4F7BFF` | `#4CC9F0` |
| `income` / `income-soft` | `#0E9F6E` / `#E6F8F0` | `#34D399` |
| `expense` / `expense-soft` | `#E11D48` / `#FFE9EE` | `#FB7185` |
| `warning` / `warning-soft` | `#F59E0B` / `#FFF3DD` | `#FBBF24` |
| `sidebar` | `#0E1230` (texto `#C9CDEB`) | igual |
| `gradient-hero` | `linear-gradient(135deg, #3B1FA8 0%, #5B3DF5 55%, #4F7BFF 100%)` | igual |

O item ativo da sidebar usa gradiente do `primary`. A sidebar é escura nos dois temas.

### 8.3 Tailwind v4 (`app/globals.css`)

O claro é o `:root`; o escuro entra por `data-theme="dark"`.

```css
@import "tailwindcss";

@theme {
  --font-sans: var(--font-inter), ui-sans-serif, system-ui, sans-serif;

  --color-bg: var(--bg);
  --color-surface: var(--surface);
  --color-surface-soft: var(--surface-soft);
  --color-glass: var(--surface-glass);
  --color-border: var(--border);
  --color-text: var(--text);
  --color-muted: var(--text-muted);
  --color-primary: var(--primary);
  --color-primary-soft: var(--primary-soft);
  --color-accent: var(--accent);
  --color-income: var(--income);
  --color-income-soft: var(--income-soft);
  --color-expense: var(--expense);
  --color-expense-soft: var(--expense-soft);
  --color-warning: var(--warning);
  --color-warning-soft: var(--warning-soft);

  --radius-card: 1.5rem;     /* rounded-3xl */
  --radius-control: 1rem;    /* rounded-2xl */
  --shadow-soft: 0 8px 30px -12px rgba(20, 23, 46, 0.18);
}

:root {
  --bg: #EDEFFA;
  --surface: #FFFFFF;
  --surface-soft: #F6F7FD;
  --surface-glass: rgba(255, 255, 255, 0.85);
  --border: #E3E6F5;
  --text: #14172E;
  --text-muted: #6B7194;
  --primary: #5B3DF5;
  --primary-soft: #EFEAFF;
  --accent: #4F7BFF;
  --income: #0E9F6E;   --income-soft: #E6F8F0;
  --expense: #E11D48;  --expense-soft: #FFE9EE;
  --warning: #F59E0B;  --warning-soft: #FFF3DD;
  --gradient-hero: linear-gradient(135deg, #3B1FA8 0%, #5B3DF5 55%, #4F7BFF 100%);
}

:root[data-theme="dark"] {
  --bg: #0B0E24;
  --surface: #141834;
  --surface-soft: #1B2043;
  --surface-glass: rgba(30, 34, 74, 0.55);
  --border: rgba(255, 255, 255, 0.08);
  --text: #F4F5FF;
  --text-muted: #9AA0C7;
  --primary: #7C5CFF;
  --accent: #4CC9F0;
  --income: #34D399;
  --expense: #FB7185;
  --warning: #FBBF24;
}

body { background: var(--bg); color: var(--text); }
```

**Tema sem flash:** como o padrão é claro, um script inline no `<head>` só precisa ler a preferência salva em `localStorage` e aplicar `data-theme="dark"` antes da pintura, caso o usuário tenha escolhido o escuro.

### 8.4 Forma, elevação e espaçamento

- Cards grandes: `rounded-3xl`. Cards comuns, botões e inputs: `rounded-2xl`.
- Sombra padrão: `0 8px 30px -12px rgba(20,23,46,0.18)`; brilho colorido só em destaque (cartão de saldo, botão **+**).
- Grade de 4 px. Padding de card `p-5` no mobile, `p-6` no desktop. Gap entre cards `gap-4` no mobile, `gap-6` no desktop.

### 8.5 Tipografia

| Papel | Tamanho | Peso | Uso |
|---|---|---|---|
| Display (saldo) | `text-4xl` mobile / `text-5xl` desktop | 600 | valor principal |
| Título de página | `text-2xl` | 600 | cabeçalho de tela |
| Título de card | `text-base` | 600 | nome do card |
| Corpo | `text-sm` | 400 | descrições e listas |
| Legenda | `text-xs` | 500 | rótulos de gráfico, datas |

Valores de despesa com sinal **−** em `text-expense`; receita com **+** em `text-income`. O sinal sempre aparece, para não depender só da cor.

### 8.6 Componentes base

| Componente | Observações |
|---|---|
| **Card** | `rounded-card border border-border p-5`. Variantes: `solid` (`bg-surface shadow-soft`), `brand` (`gradient-hero`, texto branco, sombra colorida), `glass` (`bg-glass backdrop-blur-xl`) |
| **Button** | `h-11 rounded-control`, foco visível. Variantes: `primary` (gradiente), `secondary`, `ghost`, `danger` |
| **Input** | `h-11 rounded-control bg-surface-soft border border-border`; estado `error` com `border-expense` |
| **Badge** | `rounded-full px-2.5 py-0.5 text-xs`. Variantes: `income`, `expense`, `warning`, `neutral` |
| **QuickAction** | Ícone em círculo `primary-soft`, rótulo curto abaixo, alvo ≥ 44px |
| **ProgressBar** | Trilho `h-2 rounded-full bg-border`; cor por estado da meta |
| **Dialog / Sheet** | Bottom sheet no mobile, dialog no desktop |

No glass, o texto precisa de contraste mínimo de 4,5:1; se o fundo variar, aumentar a opacidade.

### 8.7 Gráficos

Cores de série em ordem fixa, para o usuário aprender a leitura:

| Série | Cor |
|---|---|
| Receita | `--income` |
| Despesa | `--expense` |
| Saldo | `--accent` |
| Categorias (rosca) | cor própria de cada categoria (ver 11.2) |

- Rosca sempre com legenda (valor e percentual), nunca só cor.
- Grade horizontal tracejada em `border`, sem grade vertical; eixos em `text-muted`.
- Área com gradiente que some para transparente.
- Animações de até 400 ms.
- Cores vindas dos tokens CSS, para funcionar nos dois temas.

---

## 9. Estrutura do app (shell responsivo)

### 9.1 Desktop (≥ 1024px)

- **Sidebar fixa** (`w-64`), cor `sidebar`.
  - Topo: wordmark "FIN" em texto com símbolo geométrico em gradiente violeta-azul (sem imagem).
  - Itens: Início, Transações, Contas, Cartões, Metas, Relatórios, Configurações. Ativo: pílula em gradiente violeta, ícone e texto brancos.
  - Base: card "Defina um objetivo" com botão "Nova meta".
- **Topbar:** saudação "Boa tarde, Marina!" com subtítulo "Veja como estão suas finanças", seletor de período, botão de tema e sino com contador.

### 9.2 Mobile (< 1024px)

- **Cabeçalho** em `gradient-hero`, `rounded-b-[2rem]`, com avatar, saudação e sino.
- **Barra inferior fixa** com vidro sutil (branco 80% + `backdrop-blur`), cantos superiores arredondados e 5 posições: Início, Transações, **+** central, Relatórios, Mais. O **+** é flutuante, em gradiente com brilho, maior e elevado.
- **Bottom sheets:** **+** abre Nova receita, Nova despesa, Transferir. **Mais** abre Contas, Cartões, Metas, Simulações, Configurações.

### 9.3 Seletor de período (reutilizável)

- Opções: Dia, Semana, Quinzena, Mês, Trimestre, Semestre, Ano, Personalizado (dois campos de data).
- Mostra o intervalo resolvido ao lado (ex.: "1 a 31 de out. de 2026").
- Estado local na fase de mock; pronto para receber `value` e `onChange`. Com a API, o período vai para a URL e o intervalo vem do backend.

---

## 10. Tela Início, etapa 1 (base + topo)

### 10.1 Cartão de saldo (elemento mais importante)

- Variante `brand`, texto branco, `rounded-3xl`, sombra colorida e textura sutil de círculos concêntricos translúcidos.
- Rótulo "Saldo total"; valor `text-4xl` (mobile) / `text-5xl` (desktop).
- Botão de olho para ocultar/mostrar (oculto exibe `R$ ••••`).
- Duas linhas pequenas: seta para baixo + "Receitas do mês" e seta para cima + "Despesas do mês".
- Linha discreta: "Em faturas de cartão: R$ 2.315,40".

### 10.2 Atalhos rápidos

- Pílula **glass** sobreposta à borda inferior do cartão de saldo.
- 4 botões: Nova receita, Nova despesa, Transferir, Pagar fatura; ícone em círculo `primary-soft` e rótulo curto. Alvo mínimo de 44px.

### 10.3 Cards de KPI (2 colunas no mobile, 4 no desktop)

| KPI | Cor | Variação boa quando |
|---|---|---|
| Receitas do período | Verde | sobe |
| Despesas do período | Violeta | **cai** |
| Saldo do período | Azul | sobe |
| Faturas em aberto | Âmbar | (usa `creditCardDebt`) |

Cada card: fundo suave da cor, ícone em círculo, rótulo, valor, variação vs. período anterior (seta + %; verde quando bom, vermelho quando ruim) e sparkline decorativo. Variação `null` mostra "—", nunca "0%".

---

## 11. Tela Início, etapa 2 (gráficos, metas, transações)

Reaproveita tokens, componentes e shell da etapa 1. Ordem das seções:

### 11.1 Fluxo de caixa (gráfico de área)

- Card sólido com título, `PeriodSelect` e botão de menu.
- Duas séries **acumuladas**, ponto por dia: Receitas e Despesas.
- Dados coerentes com os totais: salário de R$ 7.200,00 no dia 5, freelance de R$ 1.250,00 no dia 18, despesas somando R$ 4.826,35.
- Eixo X com datas (1 out, 8 out...), eixo Y abreviado (R$ 2 mil). Legenda no topo.
- Tooltip com data, receita acumulada, despesa acumulada e saldo do dia.
- Rodapé: "Você gastou 3,1% menos que em setembro." (derivado de `expenseChangePct`).

### 11.2 Despesas por categoria (rosca)

- Total no centro ("R$ 4.826,35" + "Total"). Legenda ao lado (desktop) ou abaixo (mobile), do maior para o menor.
- Destaque: "Maior categoria: Moradia (34,2%)".
- Hover/toque numa fatia realça a fatia e a linha da legenda.
- `CategoryIcon` mapeia a chave para o lucide por dicionário fixo, com fallback `CircleHelp`.

| Categoria | Valor | % | Ícone | Cor |
|---|---|---|---|---|
| Moradia | 1.650,00 | 34,19 | `home` | `#5B3DF5` |
| Alimentação | 1.120,50 | 23,22 | `utensils` | `#10B981` |
| Transporte | 640,00 | 13,26 | `car` | `#F59E0B` |
| Lazer | 520,35 | 10,78 | `gamepad-2` | `#EC4899` |
| Saúde | 380,00 | 7,87 | `heart-pulse` | `#4F7BFF` |
| Educação | 290,00 | 6,01 | `graduation-cap` | `#F97316` |
| Outros | 225,50 | 4,67 | `shopping-bag` | `#94A3B8` |

### 11.3 Metas em andamento

- Título "Metas" com link "Ver todas". Carrossel com scroll-snap no mobile; grade de 3 colunas no desktop.
- Card: ícone em círculo colorido, nome, atual / alvo, barra, percentual, linha de apoio e Badge de estado.
- Metas de gasto mostram "limite"; de economia, "alvo".

| Estado | Cor da barra | Badge |
|---|---|---|
| `IN_PROGRESS` | Violeta | Em andamento |
| `WARNING` | Âmbar | Atenção |
| `EXCEEDED` | Vermelho | Estourada |
| `ACHIEVED` | Verde | Concluída |

| Meta | Tipo | Progresso | Estado | Linha de apoio |
|---|---|---|---|---|
| Entrada do apartamento (`home`) | SAVINGS | 18.500,00 de 60.000,00 (30,8%), prazo 31/12/2028 | IN_PROGRESS | "Guardar R$ 1.429,00 por mês para chegar a tempo" |
| PS5 (`gamepad-2`) | SAVINGS | 2.100,00 de 4.500,00 (46,7%), sem prazo | IN_PROGRESS | n/d |
| Alimentação em outubro (`utensils`) | EXPENSE | 1.120,50 de 1.200,00 (93,4%) | WARNING | "Restam R$ 79,50 do limite" |

### 11.4 Transações recentes

- Título com link "Ver todas" (para `/transactions`).
- **Mobile:** lista de cards compactos. **Desktop:** tabela (Data, Descrição, Categoria, Conta ou cartão, Valor).
- Linha: ícone da categoria, descrição, categoria (chip colorido no desktop), conta/cartão em muted, valor à direita (+ verde / − vermelho).
- Compra parcelada: Badge "2/3". Compra no cartão: nome do cartão.

| Data | Descrição | Categoria | Conta/Cartão | Valor |
|---|---|---|---|---|
| 31/10 | Supermercado do bairro | Alimentação | Conta Principal | −R$ 312,48 |
| 30/10 | Combustível | Transporte | Cartão Violeta | −R$ 180,00 |
| 28/10 | Notebook (parcela 3/10) | Educação | Cartão Violeta | −R$ 450,00 |
| 25/10 | Academia | Saúde | Conta Principal | −R$ 119,90 |
| 18/10 | Projeto freelance | Freelance | Conta Principal | +R$ 1.250,00 |

### 11.5 Banner de incentivo

Faixa em `gradient-hero`, `rounded-3xl`, texto "Pequenos passos, grandes resultados", subtítulo curto e botão claro "Criar meta". Ilustração só com formas geométricas (sem imagem externa, sem emoji).

---

## 12. Layout por breakpoint

| | Desktop (≥ 1024px) | Mobile (< 1024px) |
|---|---|---|
| Linha 1 | Fluxo de caixa (7/12) + Despesas por categoria (5/12) | Coluna única |
| Linha 2 | Metas em 3 colunas | Metas em carrossel |
| Linha 3 | Transações em tabela, largura total | Transações em cards |
| Linha 4 | Banner de incentivo | Banner de incentivo |

No mobile, a rosca tem a legenda abaixo.

---

## 13. Contrato de dados (mock)

Interfaces espelham a API real (`lib/mock-data.ts`).

```ts
interface DashboardSummary {
  period: "DAY" | "WEEK" | "FORTNIGHT" | "MONTH" | "QUARTER" | "SEMESTER" | "YEAR" | "CUSTOM";
  from: string; to: string;
  totalIncome: number; totalExpense: number; balance: number;
  previous: { from: string; to: string; incomeChangePct: number | null; expenseChangePct: number | null };
}

interface AccountsOverview { totalBalance: number; creditCardDebt: number }

interface User { name: string; pictureUrl: string | null }

interface Goal {
  id: number;
  type: "SAVINGS" | "INCOME" | "EXPENSE";
  name: string; icon: string; color: string;
  targetAmount: number; currentAmount: number; percentage: number;
  state: "IN_PROGRESS" | "WARNING" | "EXCEEDED" | "ACHIEVED" | "EXPIRED";
  endDate: string | null;
  monthlyNeeded: number | null;
}

interface Transaction {
  id: number;
  type: "INCOME" | "EXPENSE";
  amount: number; date: string; description: string;
  category: { id: number; name: string; icon: string; color: string };
  account: { id: number; name: string } | null;
  creditCard: { id: number; name: string } | null;
  installment: { number: number; total: number } | null;
}
```

| Campo (Mês, 01/10/2026 a 31/10/2026) | Valor |
|---|---|
| `totalIncome` | 8.450,00 |
| `totalExpense` | 4.826,35 |
| `balance` | 3.623,65 |
| `previous.incomeChangePct` | 4,2 |
| `previous.expenseChangePct` | −3,1 |
| `totalBalance` | 18.742,90 |
| `creditCardDebt` | 2.315,40 |
| Usuária | Marina Souza |

---

## 14. Estados da interface

Cada tela tem três estados explícitos:

| Estado | Comportamento |
|---|---|
| Carregando | Skeleton com a mesma forma e altura final de cada card, gráfico e lista (nunca spinner solto) |
| Vazio | Sem transações: mensagem amigável no lugar dos gráficos e botão "Registrar primeira transação" |
| Erro | Card com mensagem curta e botão "Tentar de novo" |

Controle de desenvolvimento para testar: `?state=loading|empty|error` (fora da UI final).

---

## 15. Acessibilidade e desempenho

- Contraste mínimo de 4,5:1 nos dois temas.
- Foco visível; `aria-label` em botões só com ícone.
- Informação nunca só por cor (sinais + / −).
- Alvo de toque mínimo de 44px.
- `prefers-reduced-motion` respeitado; animações até 300 ms (gráfico até 400 ms).
- Glass restrito a dois elementos, para não pesar em celulares fracos.

---

## 16. Critérios de aceite

- [ ] App abre em **tema claro**; alternância para escuro sem perda de contraste e sem flash
- [ ] Shell responsivo em mobile e desktop
- [ ] Glass apenas na pílula de atalhos e na barra inferior
- [ ] Saldo oculta/mostra (`R$ ••••`)
- [ ] KPIs mostram "—" quando a variação é `null`; "queda de despesa é boa" respeitado
- [ ] Fluxo de caixa fecha com os totais do mock (8.450,00 e 4.826,35)
- [ ] Rosca soma 4.826,35, ordenada do maior para o menor
- [ ] Metas com cor e Badge corretos por estado
- [ ] Transações com Badge de parcela e nome do cartão
- [ ] Estados loading, vazio e erro acessíveis via `?state=`
- [ ] Nenhum `fetch` na fase de mock; valores via `lib/format`

---

## 17. Ordem de implementação

| Passo | O que fazer |
|---|---|
| 1 | Criar o projeto (`create-next-app`, App Router, TypeScript, Tailwind) e colar os tokens da seção 8.3 |
| 2 | Montar `components/ui/` (Button, Card, Input, Badge) antes de qualquer tela |
| 3 | Shell responsivo (Sidebar, BottomNav, Topbar, MobileHeader) |
| 4 | Tela Início com mock (etapas 1 e 2) |
| 5 | Gerar tipos com `openapi-typescript` a partir do backend rodando |
| 6 | Login com Google + Route Handlers de sessão |
| 7 | Trocar o mock por hooks reais no Início (primeira tela que valida o contrato, pois usa quase todos os endpoints de agregação) |
| 8 | Transações, depois contas e cartões |
| 9 | Metas, simulações e relatórios |

---

## 18. Referências de design

Três imagens de referência foram usadas **somente como inspiração de estilo** (composição, gradientes, arredondamento, hierarquia): um app mobile roxo com cartão de saldo e ações em pílula, um app mobile azul com lista de transações e estatísticas, e um dashboard desktop claro com sidebar escura, KPIs coloridos, rosca e tabela. Nenhum texto, nome, logo ou marca delas deve ser copiado.
