/**
 * Centralizador de chaves de consulta (Query Keys) para o TanStack Query v5.
 * Facilita a invalidação seletiva e tipada de caches remotos.
 */
export const queryKeys = {
  auth: {
    me: ["auth", "me"] as const,
  },
  accounts: {
    all: ["accounts"] as const,
    list: (includeArchived = false) => ["accounts", "list", { includeArchived }] as const,
    detail: (id: number) => ["accounts", "detail", id] as const,
  },
  categories: {
    all: ["categories"] as const,
    list: (type?: string) => ["categories", "list", { type }] as const,
  },
  transactions: {
    all: ["transactions"] as const,
    list: (filters: Record<string, unknown> = {}) => ["transactions", "list", filters] as const,
    detail: (id: number) => ["transactions", "detail", id] as const,
  },
  transfers: {
    all: ["transfers"] as const,
    list: (filters: Record<string, unknown> = {}) => ["transfers", "list", filters] as const,
  },
  creditCards: {
    all: ["credit-cards"] as const,
    list: (includeArchived = false) => ["credit-cards", "list", { includeArchived }] as const,
    invoices: (cardId: number) => ["credit-cards", cardId, "invoices"] as const,
    invoiceDetail: (cardId: number, ym: string) =>
      ["credit-cards", cardId, "invoices", ym] as const,
  },
  dashboard: {
    all: ["dashboard"] as const,
    summary: (period = "MONTH", date?: string, filters?: Record<string, unknown>) =>
      ["dashboard", "summary", { period, date, ...filters }] as const,
    expensesByCategory: (period = "MONTH", date?: string, filters?: Record<string, unknown>) =>
      ["dashboard", "expenses-by-category", { period, date, ...filters }] as const,
    evolution: (period = "MONTH", date?: string, filters?: Record<string, unknown>) =>
      ["dashboard", "evolution", { period, date, ...filters }] as const,
    recent: (limit = 5) => ["dashboard", "recent", limit] as const,
  },
  goals: {
    all: ["goals"] as const,
    list: (type?: string, status?: string) => ["goals", "list", { type, status }] as const,
    detail: (id: number) => ["goals", "detail", id] as const,
    contributions: (id: number) => ["goals", id, "contributions"] as const,
  },
} as const;

