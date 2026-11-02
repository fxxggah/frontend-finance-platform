export interface DashboardSummary {
  period: 'DAY' | 'WEEK' | 'FORTNIGHT' | 'MONTH' | 'QUARTER' | 'SEMESTER' | 'YEAR' | 'CUSTOM'
  from: string
  to: string
  totalIncome: number
  totalExpense: number
  balance: number
  previous: { from: string; to: string; incomeChangePct: number | null; expenseChangePct: number | null }
}

export interface AccountsOverview { totalBalance: number; creditCardDebt: number }
export interface User { name: string; pictureUrl: string | null }

export const dashboardSummary: DashboardSummary = {
  period: 'MONTH', from: '2026-10-01', to: '2026-10-31', totalIncome: 8450, totalExpense: 4826.35, balance: 3623.65,
  previous: { from: '2026-09-01', to: '2026-09-30', incomeChangePct: 4.2, expenseChangePct: -3.1 },
}
export const accountsOverview: AccountsOverview = { totalBalance: 18742.9, creditCardDebt: 2315.4 }
export const currentUser: User = { name: 'Marina Souza', pictureUrl: null }

export interface Goal { id: number; type: 'SAVINGS' | 'INCOME' | 'EXPENSE'; name: string; icon: string; color: string; targetAmount: number; currentAmount: number; percentage: number; state: 'IN_PROGRESS' | 'WARNING' | 'EXCEEDED' | 'ACHIEVED' | 'EXPIRED'; endDate: string | null; monthlyNeeded: number | null; supportText?: string }
export interface Transaction { id: number; type: 'INCOME' | 'EXPENSE'; amount: number; date: string; description: string; category: { id: number; name: string; icon: string; color: string }; account: { id: number; name: string } | null; creditCard: { id: number; name: string } | null; installment: { number: number; total: number } | null }

export const goals: Goal[] = [
  { id: 1, type: 'SAVINGS', name: 'Entrada do apartamento', icon: 'home', color: '#5B3DF5', targetAmount: 60000, currentAmount: 18500, percentage: 30.8, state: 'IN_PROGRESS', endDate: '2028-12-31', monthlyNeeded: 1429, supportText: 'Guardar R$ 1.429,00 por mês para chegar a tempo' },
  { id: 2, type: 'SAVINGS', name: 'PS5', icon: 'gamepad-2', color: '#EC4899', targetAmount: 4500, currentAmount: 2100, percentage: 46.7, state: 'IN_PROGRESS', endDate: null, monthlyNeeded: null },
  { id: 3, type: 'EXPENSE', name: 'Alimentação em outubro', icon: 'utensils', color: '#10B981', targetAmount: 1200, currentAmount: 1120.5, percentage: 93.4, state: 'WARNING', endDate: '2026-10-31', monthlyNeeded: null, supportText: 'Restam R$ 79,50 do limite' },
]
const categories = {
  moradia: { id: 1, name: 'Moradia', icon: 'home', color: '#5B3DF5' }, alimentacao: { id: 2, name: 'Alimentação', icon: 'utensils', color: '#10B981' }, transporte: { id: 3, name: 'Transporte', icon: 'car', color: '#F59E0B' }, lazer: { id: 4, name: 'Lazer', icon: 'gamepad-2', color: '#EC4899' }, saude: { id: 5, name: 'Saúde', icon: 'heart-pulse', color: '#4F7BFF' }, educacao: { id: 6, name: 'Educação', icon: 'graduation-cap', color: '#F97316' }, outros: { id: 7, name: 'Outros', icon: 'shopping-bag', color: '#94A3B8' }, freelance: { id: 8, name: 'Freelance', icon: 'briefcase-business', color: '#0E9F6E' },
}
export const expenseCategories = [
  { ...categories.moradia, value: 1650, percentage: 34.19 }, { ...categories.alimentacao, value: 1120.5, percentage: 23.22 }, { ...categories.transporte, value: 640, percentage: 13.26 }, { ...categories.lazer, value: 520.35, percentage: 10.78 }, { ...categories.saude, value: 380, percentage: 7.87 }, { ...categories.educacao, value: 290, percentage: 6.01 }, { ...categories.outros, value: 225.5, percentage: 4.67 },
]
export const transactions: Transaction[] = [
  { id: 1, type: 'EXPENSE', amount: 312.48, date: '2026-10-31', description: 'Supermercado do bairro', category: categories.alimentacao, account: { id: 1, name: 'Conta Principal' }, creditCard: null, installment: null },
  { id: 2, type: 'EXPENSE', amount: 180, date: '2026-10-30', description: 'Combustível', category: categories.transporte, account: null, creditCard: { id: 1, name: 'Cartão Violeta' }, installment: null },
  { id: 3, type: 'EXPENSE', amount: 450, date: '2026-10-28', description: 'Notebook (parcela)', category: categories.educacao, account: null, creditCard: { id: 1, name: 'Cartão Violeta' }, installment: { number: 3, total: 10 } },
  { id: 4, type: 'EXPENSE', amount: 119.9, date: '2026-10-25', description: 'Academia', category: categories.saude, account: { id: 1, name: 'Conta Principal' }, creditCard: null, installment: null },
  { id: 5, type: 'INCOME', amount: 1250, date: '2026-10-18', description: 'Projeto freelance', category: categories.freelance, account: { id: 1, name: 'Conta Principal' }, creditCard: null, installment: null },
]
export const cashFlow = Array.from({ length: 31 }, (_, index) => { const day = index + 1; const income = day >= 5 ? 7200 : 0; const freelance = day >= 18 ? 1250 : 0; const expense = 4826.35 * (day / 31); return { date: `2026-10-${String(day).padStart(2, '0')}`, income: income + freelance, expense, balance: income + freelance - expense } })
