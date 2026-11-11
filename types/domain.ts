export type TransactionType = "INCOME" | "EXPENSE";
export type AccountType = "BANK" | "CASH" | "DIGITAL_WALLET" | "OTHER";
export type GoalType = "SAVINGS" | "INCOME" | "EXPENSE";
export type GoalStatus = "ACTIVE" | "CANCELLED";
export type GoalState = "IN_PROGRESS" | "WARNING" | "EXCEEDED" | "ACHIEVED" | "EXPIRED";
export type InvoiceStatus = "OPEN" | "CLOSED" | "PARTIALLY_PAID" | "PAID" | "OVERDUE";
export type Period = "DAY" | "WEEK" | "FORTNIGHT" | "MONTH" | "QUARTER" | "SEMESTER" | "YEAR" | "CUSTOM";
export type Granularity = "DAY" | "WEEK" | "MONTH";

export interface User {
  id: number;
  name: string;
  email: string;
  pictureUrl: string | null;
}

export interface Account {
  id: number;
  name: string;
  type: AccountType;
  balance: number;
  color: string;
  icon: string;
  archived: boolean;
}

export interface AccountsResponse {
  accounts: Account[];
  totalBalance: number;
  creditCardDebt: number;
}

export interface Category {
  id: number;
  name: string;
  type: TransactionType;
  color: string;
  icon: string;
}

export interface Transaction {
  id: number;
  type: TransactionType;
  amount: number;
  date: string;
  description: string;
  notes: string | null;
  category: Category;
  account: { id: number; name: string } | null;
  creditCard: { id: number; name: string } | null;
  invoiceReference: string | null;
  installment: { groupId?: string; number: number; total: number } | null;
}

export interface Page<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface Transfer {
  id: number;
  fromAccount: { id: number; name: string };
  toAccount: { id: number; name: string };
  amount: number;
  date: string;
  description: string | null;
}

export interface CreditCard {
  id: number;
  name: string;
  creditLimit: number;
  usedLimit: number;
  availableLimit: number;
  closingDay: number;
  dueDay: number;
  color: string;
  icon: string;
  archived: boolean;
  currentInvoice: {
    reference: string;
    total: number;
    status: InvoiceStatus;
    dueDate: string;
  };
}

export interface InvoiceSummary {
  reference: string;
  closingDate: string;
  dueDate: string;
  total: number;
  paid: number;
  status: InvoiceStatus;
}

export interface InvoicePayment {
  id: number;
  account: { id: number; name: string };
  amount: number;
  date: string;
}

export interface InvoiceDetail extends InvoiceSummary {
  transactions: Transaction[];
  payments: InvoicePayment[];
}

export interface Goal {
  id: number;
  type: GoalType;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  targetAmount: number;
  currentAmount: number;
  percentage: number;
  state: GoalState;
  status: GoalStatus;
  category: { id: number; name: string } | null;
  startDate: string | null;
  endDate: string | null;
  monthlyNeeded: number | null;
  supportText?: string;
}

export interface GoalContribution {
  id: number;
  amount: number;
  date: string;
  notes: string | null;
}

export interface DashboardSummary {
  period: Period;
  from: string;
  to: string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  previous: {
    from: string;
    to: string;
    incomeChangePct: number | null;
    expenseChangePct: number | null;
  };
}

export interface ExpenseByCategory {
  categoryId: number;
  name: string;
  color: string;
  icon: string;
  total: number;
  percentage: number;
  count: number;
}

export interface EvolutionPoint {
  label: string;
  from: string;
  to: string;
  income: number;
  expense: number;
  balance: number;
}

export interface EvolutionResponse {
  granularity: Granularity;
  points: EvolutionPoint[];
}

export interface InvestmentResult {
  totalInvested: number;
  totalInterest: number;
  finalAmount: number;
  monthlyBreakdown: {
    month: number;
    invested: number;
    interest: number;
    balance: number;
  }[];
}

export interface DebtResult {
  months: number;
  totalPaid: number;
  totalInterest: number;
  schedule: {
    month: number;
    payment: number;
    interest: number;
    principal: number;
    balance: number;
  }[];
}

/* --- DTOs de Requisição (Request Payloads) --- */

export interface GoogleLoginRequest {
  idToken: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

export interface TransactionRequest {
  type: TransactionType;
  amount: number;
  categoryId: number;
  date: string;
  description?: string;
  notes?: string | null;
  accountId?: number;
  creditCardId?: number;
  installments?: number;
}

export interface TransactionFilterParams {
  period?: Period;
  date?: string;
  type?: TransactionType;
  categoryId?: number;
  accountId?: number;
  creditCardId?: number;
  search?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export interface TransferRequest {
  fromAccountId: number;
  toAccountId: number;
  amount: number;
  date: string;
  description?: string | null;
}

export interface TransferFilterParams {
  from?: string;
  to?: string;
  accountId?: number;
  page?: number;
  size?: number;
}

export interface AccountRequest {
  name: string;
  type: AccountType;
  balance?: number;
  initialBalance?: number;
  color?: string;
  icon?: string;
}

export interface AccountDeleteResponse {
  archived: boolean;
}

export interface CreditCardRequest {
  name: string;
  creditLimit: number;
  closingDay: number;
  dueDay: number;
  color?: string;
  icon?: string;
}

export interface InvoicePaymentRequest {
  accountId: number;
  amount: number;
  date: string;
}

export interface GoalContributionRequest {
  amount: number;
  date: string;
  notes?: string;
}

export interface GoalRequest {
  type: GoalType;
  name: string;
  targetAmount: number;
  categoryId?: number | null;
  description?: string | null;
  color?: string;
  icon?: string;
  startDate?: string | null;
  endDate?: string | null;
}

export interface CategoryRequest {
  name: string;
  type: TransactionType;
  color: string;
  icon: string;
}


