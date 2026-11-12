// Gerado por pnpm api:types a partir do OpenAPI do backend. Não editar manualmente.
export interface paths {
    "/api/v1/transfers/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Buscar transferência por ID */
        get: operations["findById"];
        /**
         * Atualizar transferência
         * @description Recalcula automaticamente os saldos das contas envolvidas (as antigas e as novas).
         */
        put: operations["update"];
        post?: never;
        /**
         * Excluir transferência
         * @description Remove a transferência e recalcula os saldos das contas automaticamente.
         */
        delete: operations["delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/transactions/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Buscar transação por ID
         * @description Retorna os detalhes de uma transação específica.
         */
        get: operations["findById_1"];
        /**
         * Atualizar transação
         * @description Atualiza os dados de uma transação existente. Não permite alterar o valor ou parcelas se for uma compra parcelada.
         */
        put: operations["update_1"];
        post?: never;
        /**
         * Excluir transação
         * @description Realiza a exclusão (soft delete) de uma transação. Se for parcelada, exclui o grupo inteiro.
         */
        delete: operations["delete_1"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/goals/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getGoal"];
        put: operations["updateGoal"];
        post?: never;
        delete: operations["deleteGoal"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/credit-cards/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put: operations["update_2"];
        post?: never;
        delete: operations["delete_2"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/categories/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * Atualizar categoria
         * @description Atualiza os dados de uma categoria existente. O tipo da categoria não pode ser alterado se ela já possuir transações vinculadas.
         */
        put: operations["update_3"];
        post?: never;
        /**
         * Excluir categoria
         * @description Exclui uma categoria. Se a categoria já possuir transações, o sistema aplicará um soft delete (ocultando-a de novos lançamentos); se estiver vazia, fará a exclusão física.
         */
        delete: operations["delete_3"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/accounts/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Buscar conta por ID
         * @description Retorna os detalhes de uma conta específica, juntamente com o seu saldo atual calculado.
         */
        get: operations["getById"];
        /**
         * Atualizar conta
         * @description Atualiza os dados de uma conta existente. Alterar o saldo inicial (initialBalance) atualizará automaticamente o saldo final calculado.
         */
        put: operations["update_4"];
        post?: never;
        /**
         * Excluir ou arquivar conta
         * @description Remove uma conta. Se a conta já tiver movimentações (transações), ela será arquivada (soft delete). Se estiver completamente vazia, sofrerá exclusão física (hard delete). Não é possível arquivar/excluir a última conta ativa do usuário.
         */
        delete: operations["delete_4"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/transfers": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Listar transferências
         * @description Retorna uma lista paginada de transferências. Pode ser filtrada por período ou por conta específica.
         */
        get: operations["list"];
        put?: never;
        /**
         * Criar transferência
         * @description Transfere um valor de uma conta para outra. Não gera receitas ou despesas, apenas altera o saldo dinâmico das contas.
         */
        post: operations["create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/transactions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Listar transações
         * @description Retorna uma lista paginada de transações do usuário logado, com suporte a filtros dinâmicos.
         */
        get: operations["list_1"];
        put?: never;
        /**
         * Criar transação
         * @description Cria uma nova transação (receita ou despesa) vinculada a uma conta ou cartão.
         */
        post: operations["create_1"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/simulations/investment": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["simulateInvestment"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/simulations/debt-payoff": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["simulateDebtPayoff"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/goals": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["listGoals"];
        put?: never;
        post: operations["createGoal"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/goals/{id}/contributions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["listContributions"];
        put?: never;
        post: operations["addContribution"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/credit-cards": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["list_2"];
        put?: never;
        post: operations["create_2"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/credit-cards/{id}/invoices/{reference}/payments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["payInvoice"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/categories": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Listar categorias
         * @description Retorna a lista de categorias do usuário logado, com suporte a filtro opcional por tipo (INCOME ou EXPENSE).
         */
        get: operations["list_3"];
        put?: never;
        /**
         * Criar categoria
         * @description Cria uma nova categoria personalizada (com nome, cor, ícone e tipo) vinculada ao usuário.
         */
        post: operations["create_3"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/refresh": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Renovar tokens
         * @description Troca o refresh token por um novo par de tokens (rotation)
         */
        post: operations["refresh"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/logout": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Logout
         * @description Revoga o refresh token
         */
        post: operations["logout"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/google": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Login com Google
         * @description Valida o ID Token do Google e retorna access + refresh tokens
         */
        post: operations["loginWithGoogle"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/accounts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Listar contas
         * @description Retorna a lista de contas do usuário logado, incluindo o saldo dinâmico de cada uma e o Saldo total (totalBalance). Permite filtrar ou incluir contas arquivadas.
         */
        get: operations["list_4"];
        put?: never;
        /**
         * Criar conta
         * @description Cria uma nova conta financeira. O nome da conta deve ser único por usuário.
         */
        post: operations["create_4"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/goals/{id}/cancel": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["cancelGoal"];
        trace?: never;
    };
    "/api/v1/users/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Dados do usuário logado */
        get: operations["getMe"];
        put?: never;
        post?: never;
        /**
         * Excluir conta (LGPD)
         * @description Apaga a conta e todos os dados do usuário
         */
        delete: operations["deleteMe"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/dashboard/summary": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getSummary"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/dashboard/recent-transactions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getRecentTransactions"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/dashboard/expenses-by-category": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getExpensesByCategory"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/dashboard/evolution": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getEvolution"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/credit-cards/{id}/invoices": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["listInvoices"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/goals/{id}/contributions/{contributionId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["deleteContribution"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/credit-cards/{id}/invoices/{reference}/payments/{paymentId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["deletePayment"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        TransferRequest: {
            /** Format: int64 */
            fromAccountId: number;
            /** Format: int64 */
            toAccountId: number;
            amount: number;
            /** Format: date */
            date: string;
            description?: string;
        };
        AccountSummary: {
            /** Format: int64 */
            id?: number;
            name?: string;
            color?: string;
            icon?: string;
        };
        TransferResponse: {
            /** Format: int64 */
            id?: number;
            fromAccount?: components["schemas"]["AccountSummary"];
            toAccount?: components["schemas"]["AccountSummary"];
            amount?: number;
            /** Format: date */
            date?: string;
            description?: string;
        };
        TransactionRequest: {
            /** @enum {string} */
            type: "INCOME" | "EXPENSE";
            amount?: number;
            /** Format: int64 */
            categoryId: number;
            /** Format: date */
            date: string;
            description?: string;
            notes?: string;
            /** Format: int64 */
            accountId?: number;
            /** Format: int64 */
            creditCardId?: number;
            /** Format: int32 */
            installments?: number;
        };
        AccountInfo: {
            /** Format: int64 */
            id?: number;
            name?: string;
        };
        CategoryInfo: {
            /** Format: int64 */
            id?: number;
            name?: string;
            color?: string;
            icon?: string;
        };
        CreditCardInfo: {
            /** Format: int64 */
            id?: number;
            name?: string;
        };
        InstallmentInfo: {
            groupId?: string;
            /** Format: int32 */
            number?: number;
            /** Format: int32 */
            total?: number;
        };
        TransactionResponse: {
            /** Format: int64 */
            id?: number;
            /** @enum {string} */
            type?: "INCOME" | "EXPENSE";
            amount?: number;
            /** Format: date */
            date?: string;
            description?: string;
            notes?: string;
            category?: components["schemas"]["CategoryInfo"];
            account?: components["schemas"]["AccountInfo"];
            creditCard?: components["schemas"]["CreditCardInfo"];
            invoiceReference?: string;
            installment?: components["schemas"]["InstallmentInfo"];
        };
        GoalRequest: {
            /** @enum {string} */
            type: "SAVINGS" | "INCOME" | "EXPENSE";
            name: string;
            description?: string;
            icon?: string;
            color?: string;
            targetAmount: number;
            /** Format: int64 */
            categoryId?: number;
            /** Format: date */
            startDate?: string;
            /** Format: date */
            endDate?: string;
        };
        CategorySimpleDto: {
            /** Format: int64 */
            id?: number;
            name?: string;
            color?: string;
            icon?: string;
        };
        GoalResponse: {
            /** Format: int64 */
            id?: number;
            /** @enum {string} */
            type?: "SAVINGS" | "INCOME" | "EXPENSE";
            name?: string;
            description?: string;
            icon?: string;
            color?: string;
            targetAmount?: number;
            currentAmount?: number;
            /** Format: date */
            startDate?: string;
            /** Format: date */
            endDate?: string;
            /** @enum {string} */
            status?: "ACTIVE" | "CANCELLED";
            /** @enum {string} */
            state?: "IN_PROGRESS" | "WARNING" | "EXCEEDED" | "ACHIEVED" | "EXPIRED";
            percentage?: number;
            monthlyNeeded?: number;
            category?: components["schemas"]["CategorySimpleDto"];
        };
        CreditCardRequest: {
            name: string;
            creditLimit: number;
            /** Format: int32 */
            closingDay: number;
            /** Format: int32 */
            dueDay: number;
            color?: string;
            icon?: string;
        };
        CreditCardResponse: {
            /** Format: int64 */
            id?: number;
            name?: string;
            creditLimit?: number;
            usedLimit?: number;
            availableLimit?: number;
            /** Format: int32 */
            closingDay?: number;
            /** Format: int32 */
            dueDay?: number;
            color?: string;
            icon?: string;
            archived?: boolean;
            currentInvoice?: components["schemas"]["InvoiceResponse"];
        };
        InvoiceResponse: {
            reference?: string;
            /** Format: date */
            closingDate?: string;
            /** Format: date */
            dueDate?: string;
            total?: number;
            paid?: number;
            /** @enum {string} */
            status?: "OPEN" | "CLOSED" | "PARTIALLY_PAID" | "PAID" | "OVERDUE";
        };
        CategoryUpdateRequest: {
            name: string;
            color?: string;
            icon?: string;
        };
        CategoryResponse: {
            /** Format: int64 */
            id?: number;
            name?: string;
            /** @enum {string} */
            type?: "INCOME" | "EXPENSE";
            color?: string;
            icon?: string;
        };
        AccountRequest: {
            name: string;
            /** @enum {string} */
            type: "BANK" | "CASH" | "DIGITAL_WALLET" | "OTHER";
            initialBalance?: number;
            color?: string;
            icon?: string;
        };
        AccountResponse: {
            /** Format: int64 */
            id?: number;
            name?: string;
            /** @enum {string} */
            type?: "BANK" | "CASH" | "DIGITAL_WALLET" | "OTHER";
            balance?: number;
            color?: string;
            icon?: string;
            archived?: boolean;
        };
        InvestmentSimulationRequest: {
            initialAmount: number;
            monthlyContribution: number;
            annualRate: number;
            /** Format: int32 */
            years: number;
        };
        InvestmentMonthlyBreakdownDTO: {
            /** Format: int32 */
            month?: number;
            currentInvested?: number;
            interestEarned?: number;
            totalBalance?: number;
        };
        InvestmentSimulationResponse: {
            totalInvested?: number;
            totalInterest?: number;
            finalAmount?: number;
            monthlyBreakdown?: components["schemas"]["InvestmentMonthlyBreakdownDTO"][];
            disclaimer?: string;
        };
        DebtPayoffSimulationRequest: {
            debtAmount: number;
            monthlyRate: number;
            monthlyPayment: number;
        };
        AmortizationScheduleDTO: {
            /** Format: int32 */
            month?: number;
            paymentAmount?: number;
            principalPaid?: number;
            interestPaid?: number;
            remainingBalance?: number;
        };
        DebtPayoffSimulationResponse: {
            /** Format: int32 */
            months?: number;
            totalPaid?: number;
            totalInterest?: number;
            schedule?: components["schemas"]["AmortizationScheduleDTO"][];
            disclaimer?: string;
        };
        GoalContributionRequest: {
            amount: number;
            /** Format: date */
            date: string;
            notes?: string;
        };
        InvoicePaymentRequest: {
            /** Format: int64 */
            accountId: number;
            amount: number;
            /** Format: date */
            date: string;
        };
        CategoryRequest: {
            name: string;
            /** @enum {string} */
            type: "INCOME" | "EXPENSE";
            color?: string;
            icon?: string;
        };
        RefreshRequest: {
            refreshToken: string;
        };
        TokenResponse: {
            accessToken?: string;
            refreshToken?: string;
            /** Format: int64 */
            expiresIn?: number;
        };
        LogoutRequest: {
            refreshToken: string;
        };
        GoogleLoginRequest: {
            idToken: string;
        };
        AuthResponse: {
            accessToken?: string;
            refreshToken?: string;
            /** Format: int64 */
            expiresIn?: number;
            user?: components["schemas"]["UserResponse"];
        };
        UserResponse: {
            /** Format: int64 */
            id?: number;
            name?: string;
            email?: string;
            pictureUrl?: string;
        };
        PageResponseTransferResponse: {
            content?: components["schemas"]["TransferResponse"][];
            /** Format: int32 */
            page?: number;
            /** Format: int32 */
            size?: number;
            /** Format: int64 */
            totalElements?: number;
            /** Format: int32 */
            totalPages?: number;
        };
        PageResponseTransactionResponse: {
            content?: components["schemas"]["TransactionResponse"][];
            /** Format: int32 */
            page?: number;
            /** Format: int32 */
            size?: number;
            /** Format: int64 */
            totalElements?: number;
            /** Format: int32 */
            totalPages?: number;
        };
        GoalContributionResponse: {
            /** Format: int64 */
            id?: number;
            amount?: number;
            /** Format: date */
            date?: string;
            notes?: string;
        };
        DashboardSummaryDTO: {
            /** @enum {string} */
            period?: "DAY" | "WEEK" | "FORTNIGHT" | "MONTH" | "QUARTER" | "SEMESTER" | "YEAR" | "CUSTOM";
            /** Format: date */
            from?: string;
            /** Format: date */
            to?: string;
            totalIncome?: number;
            totalExpense?: number;
            balance?: number;
            previous?: components["schemas"]["PreviousSummaryDTO"];
        };
        PreviousSummaryDTO: {
            /** Format: date */
            from?: string;
            /** Format: date */
            to?: string;
            incomeChangePct?: number;
            expenseChangePct?: number;
        };
        TransactionRecentDTO: {
            /** Format: int64 */
            id?: number;
            amount?: number;
            /** Format: date */
            date?: string;
            /** @enum {string} */
            type?: "INCOME" | "EXPENSE";
            categoryName?: string;
            accountName?: string;
            creditCardName?: string;
        };
        CategoryExpenseDTO: {
            /** Format: int64 */
            categoryId?: number;
            name?: string;
            color?: string;
            icon?: string;
            total?: number;
            percentage?: number;
            /** Format: int64 */
            count?: number;
        };
        EvolutionDTO: {
            /** @enum {string} */
            granularity?: "DAY" | "WEEK" | "MONTH";
            points?: components["schemas"]["EvolutionPointDTO"][];
        };
        EvolutionPointDTO: {
            label?: string;
            /** Format: date */
            from?: string;
            /** Format: date */
            to?: string;
            income?: number;
            expense?: number;
            balance?: number;
        };
        AccountListResponse: {
            accounts?: components["schemas"]["AccountResponse"][];
            totalBalance?: number;
            creditCardDebt?: number;
        };
        AccountDeleteResponse: {
            archived?: boolean;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    findById: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["TransferResponse"];
                };
            };
        };
    };
    update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TransferRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["TransferResponse"];
                };
            };
        };
    };
    delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description No Content */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    findById_1: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["TransactionResponse"];
                };
            };
        };
    };
    update_1: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TransactionRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["TransactionResponse"];
                };
            };
        };
    };
    delete_1: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description No Content */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    getGoal: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["GoalResponse"];
                };
            };
        };
    };
    updateGoal: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["GoalRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["GoalResponse"];
                };
            };
        };
    };
    deleteGoal: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    update_2: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreditCardRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["CreditCardResponse"];
                };
            };
        };
    };
    delete_2: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    update_3: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CategoryUpdateRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["CategoryResponse"];
                };
            };
        };
    };
    delete_3: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description No Content */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    getById: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["AccountResponse"];
                };
            };
        };
    };
    update_4: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AccountRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["AccountResponse"];
                };
            };
        };
    };
    delete_4: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["AccountDeleteResponse"];
                };
            };
        };
    };
    list: {
        parameters: {
            query?: {
                from?: string;
                to?: string;
                accountId?: number;
                /** @description Zero-based page index (0..N) */
                page?: number;
                /** @description The size of the page to be returned */
                size?: number;
                /** @description Sorting criteria in the format: property,(asc|desc). Default sort order is ascending. Multiple sort criteria are supported. */
                sort?: string[];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["PageResponseTransferResponse"];
                };
            };
        };
    };
    create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TransferRequest"];
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["TransferResponse"];
                };
            };
        };
    };
    list_1: {
        parameters: {
            query?: {
                from?: string;
                to?: string;
                type?: "INCOME" | "EXPENSE";
                categoryId?: number;
                accountId?: number;
                creditCardId?: number;
                q?: string;
                /** @description Zero-based page index (0..N) */
                page?: number;
                /** @description The size of the page to be returned */
                size?: number;
                /** @description Sorting criteria in the format: property,(asc|desc). Default sort order is ascending. Multiple sort criteria are supported. */
                sort?: string[];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["PageResponseTransactionResponse"];
                };
            };
        };
    };
    create_1: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TransactionRequest"];
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["TransactionResponse"];
                };
            };
        };
    };
    simulateInvestment: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["InvestmentSimulationRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["InvestmentSimulationResponse"];
                };
            };
        };
    };
    simulateDebtPayoff: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["DebtPayoffSimulationRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["DebtPayoffSimulationResponse"];
                };
            };
        };
    };
    listGoals: {
        parameters: {
            query?: {
                type?: "SAVINGS" | "INCOME" | "EXPENSE";
                status?: "ACTIVE" | "CANCELLED";
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["GoalResponse"][];
                };
            };
        };
    };
    createGoal: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["GoalRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["GoalResponse"];
                };
            };
        };
    };
    listContributions: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["GoalContributionResponse"][];
                };
            };
        };
    };
    addContribution: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["GoalContributionRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["GoalResponse"];
                };
            };
        };
    };
    list_2: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["CreditCardResponse"][];
                };
            };
        };
    };
    create_2: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreditCardRequest"];
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["CreditCardResponse"];
                };
            };
        };
    };
    payInvoice: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
                reference: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["InvoicePaymentRequest"];
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    list_3: {
        parameters: {
            query?: {
                type?: "INCOME" | "EXPENSE";
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["CategoryResponse"][];
                };
            };
        };
    };
    create_3: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CategoryRequest"];
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["CategoryResponse"];
                };
            };
        };
    };
    refresh: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RefreshRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["TokenResponse"];
                };
            };
        };
    };
    logout: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["LogoutRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    loginWithGoogle: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["GoogleLoginRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["AuthResponse"];
                };
            };
        };
    };
    list_4: {
        parameters: {
            query?: {
                includeArchived?: boolean;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["AccountListResponse"];
                };
            };
        };
    };
    create_4: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AccountRequest"];
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["AccountResponse"];
                };
            };
        };
    };
    cancelGoal: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    getMe: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["UserResponse"];
                };
            };
        };
    };
    deleteMe: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    getSummary: {
        parameters: {
            query?: {
                period?: "DAY" | "WEEK" | "FORTNIGHT" | "MONTH" | "QUARTER" | "SEMESTER" | "YEAR" | "CUSTOM";
                date?: string;
                from?: string;
                to?: string;
                accountId?: number;
                creditCardId?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["DashboardSummaryDTO"];
                };
            };
        };
    };
    getRecentTransactions: {
        parameters: {
            query?: {
                limit?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["TransactionRecentDTO"][];
                };
            };
        };
    };
    getExpensesByCategory: {
        parameters: {
            query?: {
                period?: "DAY" | "WEEK" | "FORTNIGHT" | "MONTH" | "QUARTER" | "SEMESTER" | "YEAR" | "CUSTOM";
                date?: string;
                from?: string;
                to?: string;
                accountId?: number;
                creditCardId?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["CategoryExpenseDTO"][];
                };
            };
        };
    };
    getEvolution: {
        parameters: {
            query?: {
                period?: "DAY" | "WEEK" | "FORTNIGHT" | "MONTH" | "QUARTER" | "SEMESTER" | "YEAR" | "CUSTOM";
                date?: string;
                from?: string;
                to?: string;
                accountId?: number;
                creditCardId?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["EvolutionDTO"];
                };
            };
        };
    };
    listInvoices: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["InvoiceResponse"][];
                };
            };
        };
    };
    deleteContribution: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
                contributionId: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    deletePayment: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
                reference: string;
                paymentId: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description No Content */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
}
