# Dashboard Financeiro (`/api/v1/dashboard`)

Módulo que consolida as visões gerenciais, totalizadores, evolução histórica de receitas/despesas e despesas categorizadas com percentuais para exibição em gráficos e cartões informativos.

Todas as rotas exigem autenticação via cabeçalho `Authorization: Bearer <accessToken>`.

---

## Tipos e Enums

```typescript
export type Period = 'DAY' | 'WEEK' | 'FORTNIGHT' | 'MONTH' | 'QUARTER' | 'SEMESTER' | 'YEAR' | 'CUSTOM';
export type Granularity = 'DAY' | 'WEEK' | 'MONTH';
export type TransactionType = 'INCOME' | 'EXPENSE';

export interface PreviousSummary {
  from: string;               // Início do período anterior equivalente
  to: string;                 // Fim do período anterior equivalente
  incomeChangePct: number | null;  // Percentual de variação de receita (+12.5%, null se período anterior foi zero)
  expenseChangePct: number | null; // Percentual de variação de despesa (-3.1%, null se período anterior foi zero)
}

export interface DashboardSummaryResponse {
  period: Period;
  from: string;               // ISO: "YYYY-MM-DD"
  to: string;                 // ISO: "YYYY-MM-DD"
  totalIncome: number;        // Total de receitas no período
  totalExpense: number;       // Total de despesas no período
  balance: number;            // Saldo líquido (totalIncome - totalExpense)
  previous: PreviousSummary;  // Comparativo com período imediatamente anterior
}

export interface CategoryExpenseResponse {
  categoryId: number;
  name: string;
  color: string;
  icon: string;
  total: number;              // Valor total gasto na categoria
  percentage: number;         // Percentual em relação ao total de despesas (ex: 35.5)
  count: number;              // Quantidade de transações nesta categoria
}

export interface EvolutionPoint {
  label: string;              // Rótulo legível (ex: "Jan", "Semana 1", "21/10")
  from: string;               // "YYYY-MM-DD"
  to: string;                 // "YYYY-MM-DD"
  income: number;             // Total receitas no ponto temporal
  expense: number;            // Total despesas no ponto temporal
  balance: number;            // Saldo líquido no ponto
}

export interface EvolutionResponse {
  granularity: Granularity;   // 'DAY' | 'WEEK' | 'MONTH'
  points: EvolutionPoint[];   // Baldes temporais ordenados
}

export interface TransactionRecentResponse {
  id: number;
  amount: number;
  date: string;               // "YYYY-MM-DD"
  type: TransactionType;
  categoryName: string;
  accountName: string | null;
  creditCardName: string | null;
}
```

---

## 1. Resumo do Período (`Summary`)

Retorna os totalizadores de receitas, despesas, saldo líquido e o comparativo percentual em relação ao período anterior homólogo.

> [!NOTE]
> O frontend **não precisa calcular o calendário**: a resposta fornece exatamente as datas `from` e `to` calculadas pelo backend.

- **Método HTTP:** `GET`
- **Rota:** `/api/v1/dashboard/summary`
- **Autenticação Necessária:** Sim (`Bearer Token`)

### Parâmetros
#### Query Parameters
| Parâmetro | Tipo | Obrigatório | Padrão | Descrição |
|---|---|---|---|---|
| `period` | `Period` | Não | `MONTH` | Janela temporal (`DAY`, `WEEK`, `FORTNIGHT`, `MONTH`, `QUARTER`, `SEMESTER`, `YEAR`, `CUSTOM`). |
| `date` | `string` (`YYYY-MM-DD`) | Não | Hoje | Data base de referência. |
| `from` | `string` (`YYYY-MM-DD`) | Não | - | Obrigatório apenas se `period=CUSTOM`. |
| `to` | `string` (`YYYY-MM-DD`) | Não | - | Obrigatório apenas se `period=CUSTOM`. Intervalo máximo: 24 meses. |
| `accountId` | `number` | Não | - | Filtro opcional por conta bancária. |
| `creditCardId`| `number` | Não | - | Filtro opcional por cartão de crédito. |

### Request Body
Não se aplica (`GET`).

### Response Body (`200 OK`)
```json
{
  "period": "MONTH",
  "from": "2026-10-01",
  "to": "2026-10-31",
  "totalIncome": 6500.00,
  "totalExpense": 2850.40,
  "balance": 3649.60,
  "previous": {
    "from": "2026-09-01",
    "to": "2026-09-30",
    "incomeChangePct": 8.3,
    "expenseChangePct": -4.2
  }
}
```

### Tratamento de Erros
- **`400 Bad Request`**: Formato de data inválido ou período `CUSTOM` sem `from`/`to`.
- **`401 Unauthorized`**: Não autenticado.
- **`422 Unprocessable Content`**: Intervalo maior que 24 meses em períodos customizados.

---

## 2. Despesas por Categoria

Gera a distribuição de despesas por categoria no período selecionado, ideal para gráficos de pizza ou de rosca (Donut charts).

- **Método HTTP:** `GET`
- **Rota:** `/api/v1/dashboard/expenses-by-category`
- **Autenticação Necessária:** Sim (`Bearer Token`)

### Parâmetros
Aceita os mesmos filtros do endpoint de resumo (`period`, `date`, `from`, `to`, `accountId`, `creditCardId`).

### Request Body
Não se aplica (`GET`).

### Response Body (`200 OK`)
```json
[
  {
    "categoryId": 1,
    "name": "Alimentação",
    "color": "#EF4444",
    "icon": "utensils",
    "total": 1240.00,
    "percentage": 43.5,
    "count": 18
  },
  {
    "categoryId": 2,
    "name": "Moradia",
    "color": "#3B82F6",
    "icon": "home",
    "total": 950.00,
    "percentage": 33.3,
    "count": 3
  },
  {
    "categoryId": 3,
    "name": "Transporte",
    "color": "#F59E0B",
    "icon": "car",
    "total": 660.40,
    "percentage": 23.2,
    "count": 8
  }
]
```

---

## 3. Evolução Financeira Temporal

Retorna a série temporal de receitas, despesas e saldos agrupados automaticamente pela granularidade mais adequada (`DAY`, `WEEK` ou `MONTH`).

- **Método HTTP:** `GET`
- **Rota:** `/api/v1/dashboard/evolution`
- **Autenticação Necessária:** Sim (`Bearer Token`)

### Parâmetros
Aceita os mesmos filtros (`period`, `date`, `from`, `to`, `accountId`, `creditCardId`).

### Request Body
Não se aplica (`GET`).

### Response Body (`200 OK`)
```json
{
  "granularity": "WEEK",
  "points": [
    {
      "label": "Semana 1",
      "from": "2026-10-01",
      "to": "2026-10-07",
      "income": 3500.00,
      "expense": 950.00,
      "balance": 2550.00
    },
    {
      "label": "Semana 2",
      "from": "2026-10-08",
      "to": "2026-10-14",
      "income": 0.00,
      "expense": 620.40,
      "balance": -620.40
    }
  ]
}
```

---

## 4. Transações Recentes

Retorna os lançamentos mais recentes de forma resumida para exibição direta no feed da página inicial do dashboard.

- **Método HTTP:** `GET`
- **Rota:** `/api/v1/dashboard/recent-transactions`
- **Autenticação Necessária:** Sim (`Bearer Token`)

### Parâmetros
#### Query Parameters
| Parâmetro | Tipo | Obrigatório | Padrão | Descrição |
|---|---|---|---|---|
| `limit` | `number` | Não | `5` | Quantidade máxima de transações recentes retornadas (ex: 5 a 10). |

### Request Body
Não se aplica (`GET`).

### Response Body (`200 OK`)
```json
[
  {
    "id": 89,
    "amount": 42.50,
    "date": "2026-10-21",
    "type": "EXPENSE",
    "categoryName": "Alimentação",
    "accountName": "Nubank",
    "creditCardName": null
  },
  {
    "id": 88,
    "amount": 2500.00,
    "date": "2026-10-20",
    "type": "INCOME",
    "categoryName": "Salário",
    "accountName": "Banco Inter",
    "creditCardName": null
  }
]
```

