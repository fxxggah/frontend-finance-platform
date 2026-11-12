# Gerenciamento de Estado e Camada de Dados

Este documento especifica a estratégia de gerenciamento de dados do **FIN**, abrangendo o cache de dados do servidor com TanStack Query, chaves padronizadas, estado de UI com Zustand, validação com Zod e a base de dados determinística para mock.

---

## 1. Separação de Responsabilidades de Estado

| Tipo de Estado | Tecnologia | O que armazena |
|---|---|---|
| **Server State** (Dados Remotos) | **TanStack Query (React Query v5)** | Contas, transações, dashboard, faturas, metas, relatórios, categorias. |
| **Client UI State** (Interface Local) | **Zustand** | Sidebar colapsada/expandida, tema ativo, visibilidade de saldo ("••••"). |
| **URL State** (Filtros e Janela Temporal) | **Next.js SearchParams** | `?period=MONTH&date=2026-10-31`, abas ativas `?tab=`, busca `?q=`. |
| **Form State** (Validação e Inputs) | **React Hook Form + Zod** | Dados temporários de formulários, erros de validação antes do submit. |

---

## 2. TanStack Query: Chaves Centrais (`lib/query/keys.ts`)

A centralização das chaves evita inconsistências e facilita a invalidação seletiva de cache após mutations:

```typescript
export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  accounts: {
    all: ['accounts'] as const,
    list: (includeArchived: boolean) => ['accounts', 'list', { includeArchived }] as const,
    detail: (id: number) => ['accounts', 'detail', id] as const,
  },
  categories: {
    all: ['categories'] as const,
    list: (type?: string) => ['categories', 'list', { type }] as const,
  },
  transactions: {
    all: ['transactions'] as const,
    list: (filters: Record<string, unknown>) => ['transactions', 'list', filters] as const,
    detail: (id: number) => ['transactions', 'detail', id] as const,
  },
  transfers: {
    all: ['transfers'] as const,
    list: (filters: Record<string, unknown>) => ['transfers', 'list', filters] as const,
  },
  creditCards: {
    all: ['credit-cards'] as const,
    list: ['credit-cards', 'list'] as const,
    invoices: (cardId: number) => ['credit-cards', cardId, 'invoices'] as const,
    invoiceDetail: (cardId: number, ym: string) => ['credit-cards', cardId, 'invoices', ym] as const,
  },
  dashboard: {
    summary: (period: string, date?: string, filters?: Record<string, unknown>) =>
      ['dashboard', 'summary', { period, date, ...filters }] as const,
    expensesByCategory: (period: string, date?: string) =>
      ['dashboard', 'expenses-by-category', { period, date }] as const,
    evolution: (period: string, date?: string) =>
      ['dashboard', 'evolution', { period, date }] as const,
    recent: (limit: number) => ['dashboard', 'recent', limit] as const,
  },
  goals: {
    all: ['goals'] as const,
    list: (type?: string, status?: string) => ['goals', 'list', { type, status }] as const,
    detail: (id: number) => ['goals', 'detail', id] as const,
    contributions: (id: number) => ['goals', id, 'contributions'] as const,
  },
};
```

### Configurações Padrão de Cache (`staleTime`):
- **Dados Voláteis (Dashboard e Transações):** `staleTime: 30 * 1000` (30 segundos).
- **Dados Estruturais (Contas, Cartões e Categorias):** `staleTime: 5 * 60 * 1000` (5 minutos).

---

## 3. Invalidações Cruzadas em Mutations

Ao registrar ou alterar um dado, múltiplos caches devem ser invalidados para manter a consistência em tela:

| Ação do Usuário | Caches a Invalidar no `onSuccess` |
|---|---|
| **Criar/Editar/Excluir Transação** | `queryKeys.transactions.all`, `queryKeys.dashboard.summary()`, `queryKeys.dashboard.expensesByCategory()`, `queryKeys.accounts.all`, `queryKeys.creditCards.all`, `queryKeys.goals.all`. |
| **Criar Transferência** | `queryKeys.transfers.all`, `queryKeys.accounts.all`. |
| **Pagar Fatura de Cartão** | `queryKeys.creditCards.all`, `queryKeys.accounts.all`, `queryKeys.dashboard.summary()`. |
| **Adicionar Contribuição em Meta** | `queryKeys.goals.detail(id)`, `queryKeys.goals.contributions(id)`, `queryKeys.goals.all`. |

---

## 4. Estado Global de UI com Zustand (`stores/ui-store.ts`)

Mantém apenas estados efêmeros da interface:

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UiState {
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  isBalanceVisible: boolean;
  toggleBalanceVisibility: () => void;
  quickActionOpen: boolean;
  setQuickActionOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      isSidebarCollapsed: false,
      toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
      isBalanceVisible: true,
      toggleBalanceVisibility: () => set((state) => ({ isBalanceVisible: !state.isBalanceVisible })),
      quickActionOpen: false,
      setQuickActionOpen: (open) => set({ quickActionOpen: open }),
    }),
    {
      name: 'fin-ui-preferences',
      partialize: (state) => ({ isBalanceVisible: state.isBalanceVisible, isSidebarCollapsed: state.isSidebarCollapsed }),
    }
  )
);
```

---

## 5. Massa de Dados Determinística para Mock (`lib/mock-data.ts`)

Para testes consistentes sem backend, os dados mockados seguem a persona e métricas pré-estabelecidas:

- **Usuária Padrão:** Hellen Carol (`Hellen@exemplo.com`, ID: `1`).
- **Data de Referência Fixa:** `TODAY = "2026-10-31"`.
- **Contas Bancárias:**
  - `Conta Principal` (BANK): R$ 12.480,30, `#5B3DF5`, ícone `landmark`.
  - `Carteira Física` (CASH): R$ 320,60, `#0E9F6E`, ícone `wallet`.
  - `Reserva Digital` (DIGITAL_WALLET): R$ 5.942,00, `#4F7BFF`, ícone `smartphone`.
  - `Poupança Antiga` (BANK): `archived: true`.
  - **Saldo Total (`totalBalance`):** `R$ 18.742,90`.
  - **Dívida Consolidada em Cartões (`creditCardDebt`):** `R$ 2.315,40`.
- **Cartão Violeta:**
  - Limite: R$ 6.000,00 | Usado: R$ 4.115,40 | Disponível: R$ 1.884,60.
  - Fechamento: dia 25 | Vencimento: dia 02.
  - Faturas mockadas: `2026-08` (PAID), `2026-09` (PAID), `2026-10` (CLOSED - R$ 1.685,40), `2026-11` (OPEN - R$ 630,00), `2026-12` (OPEN - R$ 450,00).
- **Mês Corrente (Outubro/2026):**
  - Receitas: `R$ 8.450,00` (Salário R$ 7.200,00 + Freelance R$ 1.250,00).
  - Despesas: `R$ 4.826,35` (Moradia R$ 1.650,00, Alimentação R$ 1.120,50, Transporte R$ 640,00, Lazer R$ 520,35, Saúde R$ 380,00, Educação R$ 290,00, Outros R$ 225,50).
  - Saldo Líquido do Mês: `R$ 3.623,65`.

---

## 6. Formulários com React Hook Form e Zod

Todos os formulários devem validar antes de disparar mutations para a API:

```typescript
// Exemplo: Validação de Nova Transação
export const transactionFormSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']),
  amount: z.number().positive('O valor deve ser maior que zero'),
  categoryId: z.number().int('Selecione uma categoria'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  description: z.string().max(255).optional(),
  notes: z.string().max(500).optional(),
  destinationType: z.enum(['account', 'card']),
  accountId: z.number().optional(),
  creditCardId: z.number().optional(),
  installments: z.number().int().min(1).max(24).default(1),
}).refine((data) => {
  if (data.destinationType === 'account') return Boolean(data.accountId);
  if (data.destinationType === 'card') return Boolean(data.creditCardId) && data.type === 'EXPENSE';
  return false;
}, {
  message: 'Destino inválido para o tipo de transação selecionado',
  path: ['destinationType'],
});
```

