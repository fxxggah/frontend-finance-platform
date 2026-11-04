# Simulações Financeiras (`/api/v1/simulations`)

Módulo de ferramentas de cálculo e projeção financeira para tomada de decisão. As simulações são puramente computacionais e **não geram persistência** de dados no banco.

Por convenção de regras do domínio, os endpoints de simulação utilizam o verbo `POST` (devido à transmissão de parâmetros no corpo da requisição) e retornam o status **`200 OK`**.

Todas as rotas exigem autenticação via cabeçalho `Authorization: Bearer <accessToken>`.

---

## 1. Simulação de Investimento (Juros Compostos)

Projeta o patrimônio acumulado ao longo dos anos a partir de um valor inicial e aportes mensais com taxa de juros anual composta.

- **Método HTTP:** `POST`
- **Rota:** `/api/v1/simulations/investment`
- **Autenticação Necessária:** Sim (`Bearer Token`)

### Parâmetros
Não há Path Params nem Query Params.

### Request Body
```typescript
export interface InvestmentSimulationRequest {
  initialAmount: number;        // Obrigatório: valor inicial (>= 0)
  monthlyContribution: number;  // Obrigatório: aporte mensal (>= 0)
  annualRate: number;           // Obrigatório: taxa anual de juros em % (0 a 100)
  years: number;                // Obrigatório: período em anos (1 a 50)
}
```

Exemplo:
```json
{
  "initialAmount": 5000.00,
  "monthlyContribution": 500.00,
  "annualRate": 12.0,
  "years": 2
}
```

### Response Body (`200 OK`)
```typescript
export interface InvestmentMonthlyBreakdown {
  month: number;
  currentInvested: number;  // Total aportado do próprio bolso até o mês
  interestEarned: number;   // Juros gerados no mês
  totalBalance: number;     // Saldo total acumulado no mês
}

export interface InvestmentSimulationResponse {
  totalInvested: number;    // Soma total dos aportes
  totalInterest: number;    // Soma total dos juros ganhos
  finalAmount: number;      // Saldo líquido final (totalInvested + totalInterest)
  monthlyBreakdown: InvestmentMonthlyBreakdown[]; // Evolução mês a mês
  disclaimer: string;       // "Simulação ilustrativa, não é recomendação financeira."
}
```

Exemplo:
```json
{
  "totalInvested": 17000.00,
  "totalInterest": 2185.40,
  "finalAmount": 19185.40,
  "monthlyBreakdown": [
    {
      "month": 1,
      "currentInvested": 5500.00,
      "interestEarned": 47.44,
      "totalBalance": 5547.44
    },
    {
      "month": 2,
      "currentInvested": 6000.00,
      "interestEarned": 52.64,
      "totalBalance": 6100.08
    }
  ],
  "disclaimer": "Simulação ilustrativa, não é recomendação financeira."
}
```

### Tratamento de Erros
- **`400 Bad Request`**: Parâmetros fora dos limites permitidos (`years` < 1 ou > 50, `annualRate` < 0 ou > 100, ou valores monetários negativos).

---

## 2. Simulação de Quitação de Dívida (Amortização)

Calcula a quantidade de meses, juros totais e o cronograma de amortização para quitar um saldo devedor com pagamento mensal fixo e juros mensais.

- **Método HTTP:** `POST`
- **Rota:** `/api/v1/simulations/debt-payoff`
- **Autenticação Necessária:** Sim (`Bearer Token`)

### Parâmetros
Não há Path Params nem Query Params.

### Request Body
```typescript
export interface DebtPayoffSimulationRequest {
  debtAmount: number;       // Obrigatório: valor total da dívida (> 0)
  monthlyRate: number;      // Obrigatório: taxa mensal de juros em % (>= 0)
  monthlyPayment: number;   // Obrigatório: parcela mensal proposta (> 0)
}
```

Exemplo:
```json
{
  "debtAmount": 10000.00,
  "monthlyRate": 2.5,
  "monthlyPayment": 600.00
}
```

### Response Body (`200 OK`)
```typescript
export interface AmortizationScheduleItem {
  month: number;
  paymentAmount: number;    // Parcela paga no mês
  principalPaid: number;    // Parcela que amortizou o saldo devedor principal
  interestPaid: number;     // Parcela consumida pelos juros
  remainingBalance: number; // Saldo devedor restante
}

export interface DebtPayoffSimulationResponse {
  months: number;           // Meses necessários para quitação total
  totalPaid: number;        // Valor total desembolsado
  totalInterest: number;    // Total pago exclusivamente em juros
  schedule: AmortizationScheduleItem[]; // Tabela de amortização mês a mês
  disclaimer: string;       // "Simulação ilustrativa, não é recomendação financeira."
}
```

Exemplo:
```json
{
  "months": 22,
  "totalPaid": 12850.40,
  "totalInterest": 2850.40,
  "schedule": [
    {
      "month": 1,
      "paymentAmount": 600.00,
      "principalPaid": 350.00,
      "interestPaid": 250.00,
      "remainingBalance": 9650.00
    },
    {
      "month": 2,
      "paymentAmount": 600.00,
      "principalPaid": 358.75,
      "interestPaid": 241.25,
      "remainingBalance": 9291.25
    }
  ],
  "disclaimer": "Simulação ilustrativa, não é recomendação financeira."
}
```

### Tratamento de Erros
- **`400 Bad Request`**: Dados de entrada inválidos ou negativos.
- **`422 Unprocessable Content`**: A parcela mensal é menor ou igual aos juros mensais da dívida (`monthlyPayment <= debtAmount * (monthlyRate / 100)`), o que tornaria a dívida impagável (amortização nula ou negativa).
  ```json
  {
    "type": "about:blank",
    "title": "Unprocessable Content",
    "status": 422,
    "detail": "O pagamento mensal é insuficiente para cobrir os juros da dívida e ela nunca seria quitada"
  }
  ```

