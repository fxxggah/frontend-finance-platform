import type { components, paths } from './api.generated';

type Schemas = components['schemas'];
type Complete<T> = T extends (infer Item)[] ? Complete<Item>[]
  : T extends object ? { [K in keyof T]-?: Complete<NonNullable<T[K]>> } : T;
type Model<Name extends keyof Schemas> = Complete<Schemas[Name]>;
type Nullable<T, Keys extends keyof T> = Omit<T, Keys> & { [K in Keys]: T[K] | null };

// Modelos de apresentação derivados do OpenAPI. Os DTOs do Spring não anotam
// required/nullable nas respostas; campos opcionais de domínio podem vir null.
export type User = Nullable<Model<'UserResponse'>, 'pictureUrl'>;
export type Account = Model<'AccountResponse'>;
export type AccountType = Account['type'];
export type AccountsResponse = Model<'AccountListResponse'>;
export type Category = Model<'CategoryResponse'>;
export type TransactionType = Category['type'];
export type Transaction = Omit<Nullable<Model<'TransactionResponse'>,
  'notes' | 'account' | 'creditCard' | 'invoiceReference' | 'installment'>, 'installment'> & {
  installment: (Omit<Model<'InstallmentInfo'>, 'groupId'> & { groupId?: string }) | null;
};
export type RecentTransaction = Nullable<Model<'TransactionRecentDTO'>, 'accountName' | 'creditCardName'>;
export type Page<T> = Omit<Model<'PageResponseTransactionResponse'>, 'content'> & { content: T[] };
export type Transfer = Omit<Nullable<Model<'TransferResponse'>, 'description'>, 'fromAccount' | 'toAccount'> & {
  fromAccount: Pick<Model<'AccountSummary'>, 'id' | 'name'>;
  toAccount: Pick<Model<'AccountSummary'>, 'id' | 'name'>;
};
export type InvoiceSummary = Model<'InvoiceResponse'>;
export type InvoiceStatus = InvoiceSummary['status'];
export type CreditCard = Omit<Model<'CreditCardResponse'>, 'currentInvoice'> & {
  currentInvoice: InvoiceSummary | null;
};
// Não há consulta de pagamentos no OpenAPI atual; undefined sinaliza indisponibilidade.
export interface InvoicePayment {
  id: number;
  account: Pick<Account, 'id' | 'name'>;
  amount: number;
  date: string;
}
export type InvoiceDetail = InvoiceSummary & { transactions: Transaction[]; payments?: InvoicePayment[] };
export type Goal = Omit<Nullable<Model<'GoalResponse'>,
  'description' | 'startDate' | 'endDate' | 'monthlyNeeded' | 'category'>, 'category'> & {
  category: Pick<Model<'CategorySimpleDto'>, 'id' | 'name'> | null;
  supportText?: string;
};
export type GoalType = Goal['type'];
export type GoalStatus = Goal['status'];
export type GoalState = Goal['state'];
export type GoalContribution = Nullable<Model<'GoalContributionResponse'>, 'notes'>;
export type DashboardSummary = Omit<Model<'DashboardSummaryDTO'>, 'previous'> & {
  previous: Nullable<Model<'PreviousSummaryDTO'>, 'incomeChangePct' | 'expenseChangePct'>;
};
export type Period = Extract<DashboardSummary['period'], 'DAY' | 'WEEK' | 'MONTH' | 'YEAR' | 'CUSTOM'>;
export type ExpenseByCategory = Model<'CategoryExpenseDTO'>;
export type EvolutionResponse = Model<'EvolutionDTO'>;
export type EvolutionPoint = EvolutionResponse['points'][number];
export type Granularity = EvolutionResponse['granularity'];
export type DashboardFilters = Omit<NonNullable<paths['/api/v1/dashboard/summary']['get']['parameters']['query']>, 'period'> & { period?: Period };
export type TransactionFilterParams = Omit<NonNullable<paths['/api/v1/transactions']['get']['parameters']['query']>, 'sort'> & { sort?: string };
export type TransferFilterParams = Omit<NonNullable<paths['/api/v1/transfers']['get']['parameters']['query']>, 'sort'> & { sort?: string };

export type GoogleLoginRequest = Schemas['GoogleLoginRequest'];
export type AuthResponse = Omit<Model<'AuthResponse'>, 'user'> & { user: User };
export type TokenResponse = Model<'TokenResponse'>;
export type TransactionRequest = Omit<Schemas['TransactionRequest'], 'notes'> & { notes?: string | null };
export type TransferRequest = Omit<Schemas['TransferRequest'], 'description'> & { description?: string | null };
export type AccountRequest = Schemas['AccountRequest'];
export type AccountDeleteResponse = Model<'AccountDeleteResponse'>;
export type CreditCardRequest = Schemas['CreditCardRequest'];
export type InvoicePaymentRequest = Schemas['InvoicePaymentRequest'];
export type GoalContributionRequest = Schemas['GoalContributionRequest'];
export type GoalRequest = Omit<Schemas['GoalRequest'], 'categoryId' | 'description' | 'startDate' | 'endDate'> & {
  categoryId?: number | null;
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
};
export type CategoryRequest = Schemas['CategoryRequest'];
export type CategoryUpdateRequest = Schemas['CategoryUpdateRequest'];
export type InvestmentSimulationRequest = Schemas['InvestmentSimulationRequest'];
export type DebtSimulationRequest = Schemas['DebtPayoffSimulationRequest'];
export type InvestmentSimulationResponse = Model<'InvestmentSimulationResponse'>;
export type DebtSimulationResponse = Model<'DebtPayoffSimulationResponse'>;

// Nomes de apresentação usados pelas tabelas e gráficos de simulação.
export type InvestmentResult = Pick<InvestmentSimulationResponse, 'totalInvested' | 'totalInterest' | 'finalAmount'> & {
  monthlyBreakdown: {
    month: number;
    invested: number;
    interest: number;
    balance: number;
  }[];
};
export type DebtResult = Pick<DebtSimulationResponse, 'months' | 'totalPaid' | 'totalInterest'> & {
  schedule: {
    month: number;
    payment: number;
    interest: number;
    principal: number;
    balance: number;
  }[];
};


