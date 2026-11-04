# Cartões de Crédito (`/api/v1/credit-cards`)

Módulo responsável pelo gerenciamento de cartões de crédito, limites de crédito, faturas mensais (`invoices`), status de fechamento/vencimento e pagamentos parciais ou totais de faturas.

Todas as rotas exigem autenticação via cabeçalho `Authorization: Bearer <accessToken>`.

---

## Tipos e Enums

```typescript
export type InvoiceStatus = 'OPEN' | 'CLOSED' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE';

export interface InvoiceResponse {
  reference: string;        // Formato "yyyy-MM" (ex: "2026-10")
  closingDate: string;      // ISO: "YYYY-MM-DD"
  dueDate: string;          // ISO: "YYYY-MM-DD"
  total: number;            // Valor total consumido na fatura
  paid: number;             // Valor já pago nesta fatura
  status: InvoiceStatus;    // Status atual da fatura
}

export interface CreditCardResponse {
  id: number;
  name: string;
  creditLimit: number;      // Limite total concedido
  usedLimit: number;        // Limite comprometido somando todas as faturas abertas e futuras
  availableLimit: number;   // Limite disponível (pode ser negativo em caso de estouro)
  closingDay: number;       // Dia de fechamento da fatura (1 a 28)
  dueDay: number;           // Dia de vencimento da fatura (1 a 28)
  color: string;            // Ex: "#820AD1"
  icon: string;             // Ex: "credit-card"
  archived: boolean;        // Se o cartão está arquivado
  currentInvoice: InvoiceResponse; // Fatura do mês corrente
}

export interface CreditCardRequest {
  name: string;             // Obrigatório
  creditLimit: number;      // Obrigatório: valor positivo
  closingDay: number;       // Obrigatório: 1 a 28
  dueDay: number;           // Obrigatório: 1 a 28
  color?: string;           // Hexadecimal válido
  icon?: string;            // Identificador do ícone
}

export interface InvoicePaymentRequest {
  accountId: number;        // ID da conta bancária de onde sairá o dinheiro
  amount: number;           // Valor pago (positivo)
  date: string;             // Data do pagamento: "YYYY-MM-DD"
}
```

---

## 1. Listar Cartões de Crédito

Retorna todos os cartões cadastrados pelo usuário, contendo cálculo dinâmico de limites e o resumo da fatura atual.

- **Método HTTP:** `GET`
- **Rota:** `/api/v1/credit-cards`
- **Autenticação Necessária:** Sim (`Bearer Token`)

### Parâmetros
Não há Path Params nem Query Params.

### Request Body
Não se aplica (`GET`).

### Response Body (`200 OK`)
```json
[
  {
    "id": 1,
    "name": "Nubank Ultravioleta",
    "creditLimit": 15000.00,
    "usedLimit": 3450.80,
    "availableLimit": 11549.20,
    "closingDay": 10,
    "dueDay": 17,
    "color": "#820AD1",
    "icon": "credit-card",
    "archived": false,
    "currentInvoice": {
      "reference": "2026-10",
      "closingDate": "2026-10-10",
      "dueDate": "2026-10-17",
      "total": 1280.50,
      "paid": 0.00,
      "status": "CLOSED"
    }
  }
]
```

### Tratamento de Erros
- **`401 Unauthorized`**: Não autenticado.

---

## 2. Criar Cartão de Crédito

Registra um novo cartão de crédito para o usuário.

- **Método HTTP:** `POST`
- **Rota:** `/api/v1/credit-cards`
- **Autenticação Necessária:** Sim (`Bearer Token`)

### Parâmetros
Não há Path Params nem Query Params.

### Request Body
```json
{
  "name": "XP Visa Infinite",
  "creditLimit": 20000.00,
  "closingDay": 5,
  "dueDay": 12,
  "color": "#111827",
  "icon": "credit-card"
}
```

### Response Body (`201 Created`)
Retorna o objeto `CreditCardResponse` criado.

### Tratamento de Erros
- **`400 Bad Request`**: Dias de fechamento/vencimento fora da faixa 1-28 ou limite negativo.
  ```json
  {
    "type": "about:blank",
    "title": "Validation failed",
    "status": 400,
    "detail": "Erro de validação nos campos informados",
    "errors": [
      {
        "field": "closingDay",
        "message": "deve ser entre 1 e 28"
      }
    ]
  }
  ```

---

## 3. Atualizar Cartão de Crédito

Atualiza configurações do cartão como nome, limite total e dias de vencimento/fechamento.

- **Método HTTP:** `PUT`
- **Rota:** `/api/v1/credit-cards/{id}`
- **Autenticação Necessária:** Sim (`Bearer Token`)

### Parâmetros
#### Path Parameters
| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | `number` | Sim | Identificador numérico do cartão. |

### Request Body
Mesma estrutura de `CreditCardRequest`.

### Response Body (`200 OK`)
Retorna o objeto `CreditCardResponse` atualizado.

### Tratamento de Erros
- **`400 Bad Request`**: Dados inválidos.
- **`404 Not Found`**: Cartão não encontrado.

---

## 4. Excluir ou Arquivar Cartão

Remove ou arquiva o cartão de crédito.

- **Método HTTP:** `DELETE`
- **Rota:** `/api/v1/credit-cards/{id}`
- **Autenticação Necessária:** Sim (`Bearer Token`)

### Parâmetros
#### Path Parameters
| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | `number` | Sim | Identificador numérico do cartão. |

### Request Body
Não se aplica (`DELETE`).

### Response Body (`204 No Content` ou `200 OK`)
Confirmação da exclusão/arquivamento.

### Tratamento de Erros
- **`401 Unauthorized`**: Não autenticado.
- **`404 Not Found`**: Cartão inexistente.

---

## 5. Listar Faturas do Cartão

Retorna o histórico de todas as faturas geradas para o cartão informado (passadas, atual e futuras com compras parceladas).

- **Método HTTP:** `GET`
- **Rota:** `/api/v1/credit-cards/{id}/invoices`
- **Autenticação Necessária:** Sim (`Bearer Token`)

### Parâmetros
#### Path Parameters
| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | `number` | Sim | Identificador numérico do cartão. |

### Request Body
Não se aplica (`GET`).

### Response Body (`200 OK`)
```json
[
  {
    "reference": "2026-10",
    "closingDate": "2026-10-10",
    "dueDate": "2026-10-17",
    "total": 1280.50,
    "paid": 1280.50,
    "status": "PAID"
  },
  {
    "reference": "2026-11",
    "closingDate": "2026-11-10",
    "dueDate": "2026-11-17",
    "total": 850.00,
    "paid": 0.00,
    "status": "OPEN"
  }
]
```

---

## 6. Realizar Pagamento de Fatura

Registra o pagamento (total ou parcial) de uma fatura fechada ou vencida, debitando o valor da conta bancária informada.

> [!WARNING]
> Regras de Negócio de Pagamento:
> 1. Não é permitido pagar faturas com status `OPEN` (em aberto antes do fechamento).
> 2. O valor do pagamento somado aos pagamentos anteriores não pode ultrapassar o total da fatura.

- **Método HTTP:** `POST`
- **Rota:** `/api/v1/credit-cards/{id}/invoices/{reference}/payments`
- **Autenticação Necessária:** Sim (`Bearer Token`)

### Parâmetros
#### Path Parameters
| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | `number` | Sim | Identificador numérico do cartão. |
| `reference` | `string` | Sim | Mês de referência no formato `yyyy-MM` (ex: `2026-10`). |

### Request Body
```json
{
  "accountId": 1,
  "amount": 1280.50,
  "date": "2026-10-15"
}
```

### Response Body (`201 Created`)
Não há conteúdo no corpo da resposta (`null`/vazio).

### Tratamento de Erros
- **`400 Bad Request`**: Valor inválido ou conta ausente.
- **`404 Not Found`**: Cartão ou conta não localizados.
- **`422 Unprocessable Content`**: Fatura ainda aberta (`OPEN`) ou pagamento que excede o total da fatura.
  ```json
  {
    "type": "about:blank",
    "title": "Unprocessable Content",
    "status": 422,
    "detail": "Não é possível registrar pagamento em fatura aberta ou valor excede o saldo da fatura"
  }
  ```

---

## 7. Excluir / Estornar Pagamento de Fatura

Cancela um pagamento efetuado em uma fatura, revertendo o débito correspondente na conta bancária e recalculando o status da fatura.

- **Método HTTP:** `DELETE`
- **Rota:** `/api/v1/credit-cards/{id}/invoices/{reference}/payments/{paymentId}`
- **Autenticação Necessária:** Sim (`Bearer Token`)

### Parâmetros
#### Path Parameters
| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | `number` | Sim | Identificador do cartão. |
| `reference` | `string` | Sim | Competência `yyyy-MM` da fatura. |
| `paymentId` | `number` | Sim | Identificador do pagamento a estornar. |

### Request Body
Não se aplica (`DELETE`).

### Response Body (`204 No Content`)
Não há payload no corpo da resposta (`null`/vazio).

### Tratamento de Erros
- **`401 Unauthorized`**: Não autenticado.
- **`404 Not Found`**: Cartão ou pagamento não encontrado.

