# Transferências (`/api/v1/transfers`)

Módulo responsável pela gestão de movimentações de dinheiro entre duas contas pertencentes ao usuário (ex: transferência da Conta Corrente para a Conta Poupança ou Carteira).

Transferências afetam o saldo dinâmico das contas envolvidas sem impactar as métricas de receitas e despesas gerais.

Todas as rotas exigem autenticação via cabeçalho `Authorization: Bearer <accessToken>`.

---

## Tipos e Modelos

```typescript
export interface AccountSummary {
  id: number;
  name: string;
  color: string;
  icon: string;
}

export interface TransferResponse {
  id: number;
  fromAccount: AccountSummary;  // Dados resumidos da conta de origem (débito)
  toAccount: AccountSummary;    // Dados resumidos da conta de destino (crédito)
  amount: number;               // Valor monetário transferido
  date: string;                 // Data no formato ISO-8601: "YYYY-MM-DD"
  description: string | null;   // Descrição da transferência
}

export interface TransferRequest {
  fromAccountId: number;        // Obrigatório: ID da conta de débito
  toAccountId: number;          // Obrigatório: ID da conta de crédito
  amount: number;               // Obrigatório: valor maior que zero (duas casas decimais)
  date: string;                 // Obrigatório: data no formato "YYYY-MM-DD"
  description?: string;         // Opcional: máx. 255 caracteres
}
```

---

## 1. Listar Transferências

Retorna a lista paginada de transferências realizadas pelo usuário, com suporte a filtros por período e por conta.

- **Método HTTP:** `GET`
- **Rota:** `/api/v1/transfers`
- **Autenticação Necessária:** Sim (`Bearer Token`)

### Parâmetros
#### Query Parameters
| Parâmetro | Tipo | Obrigatório | Padrão | Descrição |
|---|---|---|---|---|
| `from` | `string` (`YYYY-MM-DD`) | Não | - | Data de início do período. |
| `to` | `string` (`YYYY-MM-DD`) | Não | - | Data de fim do período. |
| `accountId` | `number` | Não | - | Retorna transferências onde a conta é origem OU destino. |
| `page` | `number` | Não | `0` | Índice da página (base 0). |
| `size` | `number` | Não | `20` | Itens por página (máx. 100). |
| `sort` | `string` | Não | `date,desc` | Campo e direção da ordenação. |

### Request Body
Não se aplica (`GET`).

### Response Body (`200 OK`)
Padrão `PageResponse<TransferResponse>`:

```json
{
  "content": [
    {
      "id": 12,
      "fromAccount": {
        "id": 1,
        "name": "Nubank",
        "color": "#820AD1",
        "icon": "landmark"
      },
      "toAccount": {
        "id": 2,
        "name": "Carteira Física",
        "color": "#10B981",
        "icon": "banknote"
      },
      "amount": 200.00,
      "date": "2026-10-19",
      "description": "Saque para despesas do dia a dia"
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 1,
  "totalPages": 1
}
```

### Tratamento de Erros
- **`401 Unauthorized`**: Token ausente ou inválido.

---

## 2. Buscar Transferência por ID

Obtém os detalhes de uma transferência registrada.

- **Método HTTP:** `GET`
- **Rota:** `/api/v1/transfers/{id}`
- **Autenticação Necessária:** Sim (`Bearer Token`)

### Parâmetros
#### Path Parameters
| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | `number` | Sim | Identificador numérico da transferência. |

### Request Body
Não se aplica (`GET`).

### Response Body (`200 OK`)
Retorna o objeto `TransferResponse`.

### Tratamento de Erros
- **`401 Unauthorized`**: Não autenticado.
- **`404 Not Found`**: Transferência não encontrada.

---

## 3. Criar Transferência

Registra uma nova transferência entre duas contas do usuário e recalcula dinamicamente seus saldos.

> [!WARNING]
> Regra de Validação: As contas de origem e destino **devem ser distintas** (`fromAccountId != toAccountId`). Caso sejam idênticas, a requisição retornará `422 Unprocessable Content`.

- **Método HTTP:** `POST`
- **Rota:** `/api/v1/transfers`
- **Autenticação Necessária:** Sim (`Bearer Token`)

### Parâmetros
Não há Path Params nem Query Params.

### Request Body
```json
{
  "fromAccountId": 1,
  "toAccountId": 2,
  "amount": 350.00,
  "date": "2026-10-21",
  "description": "Transferência para reserva em espécie"
}
```

### Response Body (`201 Created`)
```json
{
  "id": 15,
  "fromAccount": {
    "id": 1,
    "name": "Nubank",
    "color": "#820AD1",
    "icon": "landmark"
  },
  "toAccount": {
    "id": 2,
    "name": "Carteira Física",
    "color": "#10B981",
    "icon": "banknote"
  },
  "amount": 350.00,
  "date": "2026-10-21",
  "description": "Transferência para reserva em espécie"
}
```

### Tratamento de Erros
- **`400 Bad Request`**: Campo obrigatório ausente ou valor não positivo (`amount <= 0`).
- **`404 Not Found`**: Uma das contas informadas não foi encontrada.
- **`422 Unprocessable Content`**: Contas de origem e destino são as mesmas.
  ```json
  {
    "type": "about:blank",
    "title": "Unprocessable Content",
    "status": 422,
    "detail": "A conta de origem e destino não podem ser iguais"
  }
  ```

---

## 4. Atualizar Transferência

Atualiza as informações de uma transferência existente e recalcula os saldos dinâmicos das contas (tanto as antigas quanto as novas selecionadas).

- **Método HTTP:** `PUT`
- **Rota:** `/api/v1/transfers/{id}`
- **Autenticação Necessária:** Sim (`Bearer Token`)

### Parâmetros
#### Path Parameters
| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | `number` | Sim | Identificador numérico da transferência. |

### Request Body
Mesma estrutura de `TransferRequest`.

```json
{
  "fromAccountId": 1,
  "toAccountId": 2,
  "amount": 400.00,
  "date": "2026-10-21",
  "description": "Ajuste de valor transferido"
}
```

### Response Body (`200 OK`)
Retorna o objeto `TransferResponse` atualizado.

### Tratamento de Erros
- **`400 Bad Request`**: Erro de validação.
- **`404 Not Found`**: Transferência ou contas não encontradas.
- **`422 Unprocessable Content`**: Contas iguais.

---

## 5. Excluir Transferência

Remove a transferência e reverte os saldos das contas envolvidas.

- **Método HTTP:** `DELETE`
- **Rota:** `/api/v1/transfers/{id}`
- **Autenticação Necessária:** Sim (`Bearer Token`)

### Parâmetros
#### Path Parameters
| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | `number` | Sim | Identificador da transferência a excluir. |

### Request Body
Não se aplica (`DELETE`).

### Response Body (`204 No Content`)
Não há conteúdo no corpo da resposta (`null`/vazio).

### Tratamento de Erros
- **`401 Unauthorized`**: Não autenticado.
- **`404 Not Found`**: Transferência não encontrada.

