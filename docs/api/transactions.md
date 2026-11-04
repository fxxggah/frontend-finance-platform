# Transações (`/api/v1/transactions`)

Módulo principal de gestão de lançamentos financeiros: receitas (`INCOME`) e despesas (`EXPENSE`), tanto em contas bancárias quanto em cartões de crédito (com suporte a compras parceladas em até 24 vezes).

Todas as rotas exigem autenticação via cabeçalho `Authorization: Bearer <accessToken>`.

---

## Tipos e Modelos

```typescript
export type TransactionType = 'INCOME' | 'EXPENSE';

export interface CategoryInfo {
  id: number;
  name: string;
  color: string;
  icon: string;
}

export interface AccountInfo {
  id: number;
  name: string;
}

export interface CreditCardInfo {
  id: number;
  name: string;
}

export interface InstallmentInfo {
  groupId: string;          // UUID agrupador da compra parcelada
  number: number;           // Número da parcela atual (ex: 1)
  total: number;            // Quantidade total de parcelas (ex: 10)
}

export interface TransactionResponse {
  id: number;
  type: TransactionType;
  amount: number;
  date: string;                     // ISO-8601: "YYYY-MM-DD"
  description: string | null;
  notes: string | null;
  category: CategoryInfo;
  account: AccountInfo | null;      // Presente em transações de conta bancária
  creditCard: CreditCardInfo | null;// Presente em compras no cartão
  invoiceReference: string | null;  // Competência da fatura (ex: "2026-11"), presente em compras no cartão
  installment: InstallmentInfo | null; // Informações de parcelamento (se aplicável)
}

export interface TransactionRequest {
  type: TransactionType;    // Obrigatório: 'INCOME' | 'EXPENSE'
  amount: number;           // Obrigatório: min 0.01, max 999999999.99 (2 casas decimais)
  categoryId: number;       // Obrigatório: ID da categoria
  date: string;             // Obrigatório: ISO-8601 "YYYY-MM-DD"
  description?: string;     // Opcional: máx. 255 caracteres
  notes?: string;           // Opcional: máx. 500 caracteres
  accountId?: number;       // ID da conta bancária (mutuamente exclusivo com creditCardId)
  creditCardId?: number;    // ID do cartão de crédito (mutuamente exclusivo com accountId)
  installments?: number;    // Opcional: 1 a 24 (permitido apenas com creditCardId; default: 1)
}
```

---

## 1. Listar Transações Paginadas

Retorna os lançamentos financeiros do usuário logado de forma paginada e com múltiplos filtros acumulativos.

- **Método HTTP:** `GET`
- **Rota:** `/api/v1/transactions`
- **Autenticação Necessária:** Sim (`Bearer Token`)

### Parâmetros
#### Query Parameters
| Parâmetro | Tipo | Obrigatório | Padrão | Descrição |
|---|---|---|---|---|
| `from` | `string` (`YYYY-MM-DD`) | Não | - | Data de início do período. |
| `to` | `string` (`YYYY-MM-DD`) | Não | - | Data final do período. |
| `type` | `TransactionType` | Não | - | Filtro por `'INCOME'` ou `'EXPENSE'`. |
| `categoryId` | `number` | Não | - | Filtrar por uma categoria específica. |
| `accountId` | `number` | Não | - | Filtrar lançamentos de uma conta específica. |
| `creditCardId`| `number` | Não | - | Filtrar compras de um cartão específico. |
| `q` | `string` | Não | - | Termo de busca textual na descrição da transação. |
| `page` | `number` | Não | `0` | Índice da página (base 0). |
| `size` | `number` | Não | `20` | Quantidade de itens por página (máx. 100). |
| `sort` | `string` | Não | `date,desc` | Campo e direção de ordenação. |

### Request Body
Não se aplica (`GET`).

### Response Body (`200 OK`)
Objeto envelopado no padrão `PageResponse<TransactionResponse>`:

```json
{
  "content": [
    {
      "id": 101,
      "type": "EXPENSE",
      "amount": 250.00,
      "date": "2026-10-20",
      "description": "Supermercado Mensal",
      "notes": "Compras do mês",
      "category": {
        "id": 3,
        "name": "Alimentação",
        "color": "#EF4444",
        "icon": "shopping-cart"
      },
      "account": {
        "id": 1,
        "name": "Nubank Conta"
      },
      "creditCard": null,
      "invoiceReference": null,
      "installment": null
    },
    {
      "id": 102,
      "type": "EXPENSE",
      "amount": 120.00,
      "date": "2026-10-18",
      "description": "Fone de Ouvido Bluetooth",
      "notes": null,
      "category": {
        "id": 5,
        "name": "Eletrônicos",
        "color": "#3B82F6",
        "icon": "headphones"
      },
      "account": null,
      "creditCard": {
        "id": 2,
        "name": "Nubank Ultravioleta"
      },
      "invoiceReference": "2026-11",
      "installment": {
        "groupId": "d4e5f6a7-b8c9-40d1-a2e3-4f5a6b7c8d9e",
        "number": 1,
        "total": 3
      }
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 2,
  "totalPages": 1
}
```

### Tratamento de Erros
- **`401 Unauthorized`**: Não autenticado.

---

## 2. Buscar Transação por ID

Retorna os detalhes completos de um lançamento específico.

- **Método HTTP:** `GET`
- **Rota:** `/api/v1/transactions/{id}`
- **Autenticação Necessária:** Sim (`Bearer Token`)

### Parâmetros
#### Path Parameters
| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | `number` | Sim | Identificador numérico da transação. |

### Request Body
Não se aplica (`GET`).

### Response Body (`200 OK`)
Retorna o objeto `TransactionResponse`.

### Tratamento de Erros
- **`401 Unauthorized`**: Token ausente ou inválido.
- **`404 Not Found`**: Lançamento não encontrado ou pertencente a outro usuário.

---

## 3. Criar Transação

Registra uma receita ou despesa.

> [!IMPORTANT]
> **Regras Cruciais de Validação:**
> 1. É obrigatório informar exatamente um destino: `accountId` **OU** `creditCardId`. Enviar ambos ou omitir ambos resultará em erro `422`.
> 2. Cartões de crédito aceitam apenas despesas (`EXPENSE`). Tentar criar uma receita (`INCOME`) vinculada a `creditCardId` resultará em erro `422`.
> 3. O parâmetro `installments` (1 a 24) só é aceito quando `creditCardId` é informado.

- **Método HTTP:** `POST`
- **Rota:** `/api/v1/transactions`
- **Autenticação Necessária:** Sim (`Bearer Token`)

### Parâmetros
Não há Path Params nem Query Params.

### Request Body
#### Exemplo 1: Despesa em Conta Bancária
```json
{
  "type": "EXPENSE",
  "amount": 89.90,
  "categoryId": 3,
  "date": "2026-10-21",
  "description": "Almoço de Trabalho",
  "notes": "Restaurante Central",
  "accountId": 1
}
```

#### Exemplo 2: Despesa Parcelada no Cartão de Crédito
```json
{
  "type": "EXPENSE",
  "amount": 600.00,
  "categoryId": 5,
  "date": "2026-10-21",
  "description": "Monitor 27 polegadas",
  "notes": "Home office",
  "creditCardId": 2,
  "installments": 3
}
```

### Response Body (`201 Created`)
Retorna a transação criada (no caso de parcelamento, retorna o primeiro lançamento gerado).

```json
{
  "id": 105,
  "type": "EXPENSE",
  "amount": 200.00,
  "date": "2026-10-21",
  "description": "Monitor 27 polegadas (1/3)",
  "notes": "Home office",
  "category": {
    "id": 5,
    "name": "Eletrônicos",
    "color": "#3B82F6",
    "icon": "monitor"
  },
  "account": null,
  "creditCard": {
    "id": 2,
    "name": "Nubank Ultravioleta"
  },
  "invoiceReference": "2026-11",
  "installment": {
    "groupId": "3b2c1a0f-9e8d-4c7b-a6f5-e4d3c2b1a098",
    "number": 1,
    "total": 3
  }
}
```

### Tratamento de Erros
- **`400 Bad Request`**: Campos obrigatórios ausentes ou valores fora dos limites (ex: `amount <= 0`).
- **`422 Unprocessable Content`**:
  - Tanto `accountId` quanto `creditCardId` foram informados simultaneamente.
  - Nenhum entre `accountId` e `creditCardId` foi informado.
  - Tentativa de registrar `INCOME` em cartão de crédito.
  ```json
  {
    "type": "about:blank",
    "title": "Unprocessable Content",
    "status": 422,
    "detail": "Informe uma conta ou um cartão de crédito, nunca ambos"
  }
  ```

---

## 4. Atualizar Transação

Atualiza os dados de um lançamento existente.

> [!NOTE]
> Em transações parceladas no cartão de crédito, os campos de valor (`amount`) e quantidade de parcelas (`installments`) são bloqueados para edição individual, garantindo a integridade do plano de parcelas.

- **Método HTTP:** `PUT`
- **Rota:** `/api/v1/transactions/{id}`
- **Autenticação Necessária:** Sim (`Bearer Token`)

### Parâmetros
#### Path Parameters
| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | `number` | Sim | Identificador numérico da transação. |

### Request Body
Estrutura idêntica a `TransactionRequest`.

```json
{
  "type": "EXPENSE",
  "amount": 95.00,
  "categoryId": 3,
  "date": "2026-10-21",
  "description": "Almoço de Trabalho com Equipe",
  "notes": "Comprovante anexado",
  "accountId": 1
}
```

### Response Body (`200 OK`)
Retorna o objeto `TransactionResponse` atualizado.

### Tratamento de Erros
- **`400 Bad Request`**: Dados inválidos.
- **`404 Not Found`**: Transação não encontrada.
- **`422 Unprocessable Content`**: Regra de negócio violada.

---

## 5. Excluir Transação

Exclui uma transação (soft delete). Se a transação pertencer a uma compra parcelada, o backend **exclui automaticamente todas as parcelas** pertencentes àquele grupo (`installmentGroupId`).

- **Método HTTP:** `DELETE`
- **Rota:** `/api/v1/transactions/{id}`
- **Autenticação Necessária:** Sim (`Bearer Token`)

### Parâmetros
#### Path Parameters
| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | `number` | Sim | Identificador numérico da transação. |

### Request Body
Não se aplica (`DELETE`).

### Response Body (`204 No Content`)
Não há conteúdo no corpo da resposta (`null`/vazio).

### Tratamento de Erros
- **`401 Unauthorized`**: Não autenticado.
- **`404 Not Found`**: Transação não encontrada.

