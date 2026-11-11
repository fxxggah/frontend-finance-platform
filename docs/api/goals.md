# Metas Financeiras (`/api/v1/goals`)

Módulo responsável pela gestão de objetivos de poupança (`SAVINGS`), orçamentos de despesas (`EXPENSE`) e metas de receitas (`INCOME`), além do controle de aportes/resgates em metas de economia.

Todas as rotas exigem autenticação via cabeçalho `Authorization: Bearer <accessToken>`.

---

## Tipos e Enums

```typescript
export type GoalType = 'SAVINGS' | 'INCOME' | 'EXPENSE';
export type GoalStatus = 'ACTIVE' | 'CANCELLED';
export type GoalState = 'IN_PROGRESS' | 'WARNING' | 'EXCEEDED' | 'ACHIEVED' | 'EXPIRED';

export interface CategorySimpleDto {
  id: number;
  name: string;
  color: string;
  icon: string;
}

export interface GoalContributionResponse {
  id: number;
  amount: number;           // Valor do aporte (positivo) ou retirada (negativo)
  date: string;             // ISO: "YYYY-MM-DD"
  notes: string | null;     // Observações
}

export interface GoalResponse {
  id: number;
  type: GoalType;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  targetAmount: number;     // Valor alvo estipulado
  currentAmount: number;    // Valor acumulado atual
  startDate: string | null; // ISO: "YYYY-MM-DD"
  endDate: string | null;   // ISO: "YYYY-MM-DD"
  status: GoalStatus;       // 'ACTIVE' | 'CANCELLED' (persistido)
  state: GoalState;         // 'IN_PROGRESS' | 'WARNING' | 'EXCEEDED' | 'ACHIEVED' | 'EXPIRED' (calculado)
  percentage: number;       // Percentual atingido (pode ultrapassar 100)
  monthlyNeeded: number | null; // Aporte mensal sugerido para atingir o alvo até a data final (só SAVINGS)
  category: CategorySimpleDto | null; // Presente em metas vinculadas a categoria (EXPENSE/INCOME)
}

export interface GoalRequest {
  type: GoalType;           // Obrigatório: 'SAVINGS' | 'INCOME' | 'EXPENSE'
  name: string;             // Obrigatório: máx. 100 caracteres
  targetAmount: number;     // Obrigatório: positivo
  description?: string;     // Máx. 255 caracteres
  icon?: string;            // Identificador do ícone (máx. 40 caracteres)
  color?: string;           // Hexadecimal (máx. 7 caracteres, ex: "#3B82F6")
  categoryId?: number;      // Requerido para metas de categoria (EXPENSE / INCOME)
  startDate?: string;       // "YYYY-MM-DD"
  endDate?: string;         // "YYYY-MM-DD"
}

export interface GoalContributionRequest {
  amount: number;           // Valor do aporte/retirada (duas casas decimais)
  date: string;             // Data do aporte: "YYYY-MM-DD"
  notes?: string;           // Máx. 255 caracteres
}
```

---

## 1. Listar Metas

Retorna a lista de metas do usuário, permitindo filtros combinados por tipo e status.

- **Método HTTP:** `GET`
- **Rota:** `/api/v1/goals`
- **Autenticação Necessária:** Sim (`Bearer Token`)

### Parâmetros
#### Query Parameters
| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `type` | `GoalType` | Não | Filtra por `'SAVINGS'`, `'INCOME'` ou `'EXPENSE'`. |
| `status` | `GoalStatus` | Não | Filtra por `'ACTIVE'` ou `'CANCELLED'`. Se omitido, retorna todas. |

### Request Body
Não se aplica (`GET`).

### Response Body (`200 OK`)
```json
[
  {
    "id": 1,
    "type": "SAVINGS",
    "name": "Reserva de Emergência",
    "description": "6 meses de despesas fixas",
    "icon": "shield-check",
    "color": "#10B981",
    "targetAmount": 30000.00,
    "currentAmount": 15000.00,
    "startDate": "2026-01-01",
    "endDate": "2027-12-31",
    "status": "ACTIVE",
    "state": "IN_PROGRESS",
    "percentage": 50.0,
    "monthlyNeeded": 1071.43,
    "category": null
  },
  {
    "id": 2,
    "type": "EXPENSE",
    "name": "Limite para Restaurantes",
    "description": "Teto mensal para alimentação fora de casa",
    "icon": "utensils",
    "color": "#EF4444",
    "targetAmount": 800.00,
    "currentAmount": 650.00,
    "startDate": "2026-10-01",
    "endDate": "2026-10-31",
    "status": "ACTIVE",
    "state": "WARNING",
    "percentage": 81.25,
    "monthlyNeeded": null,
    "category": {
      "id": 3,
      "name": "Alimentação",
      "color": "#EF4444",
      "icon": "utensils"
    }
  }
]
```

---

## 2. Buscar Meta por ID

Retorna os dados detalhados de uma meta específica.

- **Método HTTP:** `GET`
- **Rota:** `/api/v1/goals/{id}`
- **Autenticação Necessária:** Sim (`Bearer Token`)

### Parâmetros
#### Path Parameters
| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | `number` | Sim | Identificador numérico da meta. |

### Request Body
Não se aplica (`GET`).

### Response Body (`200 OK`)
Retorna o objeto `GoalResponse`.

### Tratamento de Erros
- **`401 Unauthorized`**: Não autenticado.
- **`404 Not Found`**: Meta não encontrada.

---

## 3. Criar Meta

Cria uma meta de economia ou um limite orçamentário.

- **Método HTTP:** `POST`
- **Rota:** `/api/v1/goals`
- **Autenticação Necessária:** Sim (`Bearer Token`)

### Request Body
#### Exemplo 1: Meta de Poupança (`SAVINGS`)
```json
{
  "type": "SAVINGS",
  "name": "Viagem de Férias",
  "description": "Viagem para o Nordeste",
  "icon": "plane",
  "color": "#3B82F6",
  "targetAmount": 6000.00,
  "startDate": "2026-11-01",
  "endDate": "2027-07-31"
}
```

#### Exemplo 2: Orçamento de Despesa (`EXPENSE`)
```json
{
  "type": "EXPENSE",
  "name": "Teto para Compras",
  "targetAmount": 1000.00,
  "categoryId": 5,
  "startDate": "2026-10-01",
  "endDate": "2026-10-31"
}
```

### Response Body (`200 OK`)
Retorna o objeto `GoalResponse` criado.

### Tratamento de Erros
- **`400 Bad Request`**: Dados obrigatórios inválidos.
- **`422 Unprocessable Content`**: Meta de despesa sem categoria informada.

---

## 4. Atualizar Meta

Atualiza o nome, valor alvo ou datas da meta.

- **Método HTTP:** `PUT`
- **Rota:** `/api/v1/goals/{id}`
- **Autenticação Necessária:** Sim (`Bearer Token`)

### Parâmetros
#### Path Parameters
| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | `number` | Sim | Identificador numérico da meta. |

### Request Body
Mesma estrutura de `GoalRequest`.

### Response Body (`200 OK`)
Retorna o objeto `GoalResponse` atualizado.

---

## 5. Cancelar Meta

Altera o status da meta para `CANCELLED`, congelando o progresso sem deletar os dados históricos.

- **Método HTTP:** `PATCH`
- **Rota:** `/api/v1/goals/{id}/cancel`
- **Autenticação Necessária:** Sim (`Bearer Token`)

### Parâmetros
#### Path Parameters
| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | `number` | Sim | Identificador numérico da meta. |

### Request Body
Não se aplica (`PATCH` sem corpo).

### Response Body (`200 OK`)
Sem corpo (`null`/vazio).

---

## 6. Excluir Meta

Remove a meta e suas contribuições associadas permanentemente.

- **Método HTTP:** `DELETE`
- **Rota:** `/api/v1/goals/{id}`
- **Autenticação Necessária:** Sim (`Bearer Token`)

### Response Body (`200 OK`)
Vazio.

---

## 7. Listar Contribuições de uma Meta

Retorna o histórico de aportes e resgates vinculados a uma meta de poupança (`SAVINGS`).

- **Método HTTP:** `GET`
- **Rota:** `/api/v1/goals/{id}/contributions`
- **Autenticação Necessária:** Sim (`Bearer Token`)

### Response Body (`200 OK`)
```json
[
  {
    "id": 10,
    "amount": 500.00,
    "date": "2026-10-15",
    "notes": "Aporte mensal via PIX"
  },
  {
    "id": 11,
    "amount": -100.00,
    "date": "2026-10-20",
    "notes": "Resgate emergencial"
  }
]
```

---

## 8. Adicionar Contribuição em uma Meta

Registra um aporte (positivo) ou retirada (negativo) em uma meta de poupança ativa.

> [!WARNING]
> Regras de Negócio:
> 1. Apenas metas do tipo `SAVINGS` e com status `ACTIVE` aceitam contribuições.
> 2. O valor de uma retirada não pode fazer o `currentAmount` da meta se tornar menor do que zero (`422 Unprocessable Content`).

- **Método HTTP:** `POST`
- **Rota:** `/api/v1/goals/{id}/contributions`
- **Autenticação Necessária:** Sim (`Bearer Token`)

### Request Body
```json
{
  "amount": 850.00,
  "date": "2026-10-21",
  "notes": "Sobra salarial do mês"
}
```

### Response Body (`200 OK`)
Retorna o objeto `GoalResponse` com os novos valores acumulados e percentual recalculado.

### Tratamento de Erros
- **`400 Bad Request`**: Valor ausente ou data nula.
- **`422 Unprocessable Content`**: Retirada que torna o saldo negativo ou tentativa de registrar contribuição em meta de categoria ou cancelada.

---

## 9. Excluir Contribuição

Exclui o registro de uma contribuição e recalcula o progresso da meta.

- **Método HTTP:** `DELETE`
- **Rota:** `/api/v1/goals/{id}/contributions/{contributionId}`
- **Autenticação Necessária:** Sim (`Bearer Token`)

### Response Body (`200 OK`)
Vazio.

