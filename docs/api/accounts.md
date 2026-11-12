# Contas Bancárias e Carteiras (`/api/v1/accounts`)

Módulo responsável pela gestão de contas correntes, contas poupança, carteiras físicas de dinheiro e carteiras digitais.

Todas as rotas exigem autenticação via cabeçalho `Authorization: Bearer <accessToken>`.

---

## Tipos e Enums

```typescript
export type AccountType = 'BANK' | 'CASH' | 'DIGITAL_WALLET' | 'OTHER';

export interface AccountResponse {
  id: number;
  name: string;
  type: AccountType;
  balance: number;          // Saldo atual consolidado (calculado dinamicamente)
  color: string;            // Código hexadecimal da cor (ex: "#3B82F6")
  icon: string;             // Identificador do ícone Lucide (ex: "wallet", "landmark")
  archived: boolean;        // Se a conta está arquivada ou ativa
}

export interface AccountListResponse {
  accounts: AccountResponse[];
  totalBalance: number;     // Soma dos saldos de todas as contas ativas
  creditCardDebt: number;   // Soma de todas as faturas de cartão em aberto no período
}

export interface AccountDeleteResponse {
  archived: boolean;        // true se foi feito soft-delete (arquivada); false se foi excluída fisicamente
}
```

---

## 1. Listar Contas

Retorna a lista de contas pertencentes ao usuário autenticado, acompanhadas do Saldo total (`totalBalance`) e da dívida total em cartões de crédito (`creditCardDebt`).

- **Método HTTP:** `GET`
- **Rota:** `/api/v1/accounts`
- **Autenticação Necessária:** Sim (`Bearer Token`)

### Parâmetros
#### Query Parameters
| Parâmetro | Tipo | Obrigatório | Padrão | Descrição |
|---|---|---|---|---|
| `includeArchived` | `boolean` | Não | `true` | Se `true`, retorna também as contas arquivadas pelo usuário. |

### Request Body
Não se aplica (`GET`).

### Response Body (`200 OK`)
```json
{
  "accounts": [
    {
      "id": 1,
      "name": "Nubank Conta",
      "type": "BANK",
      "balance": 4850.32,
      "color": "#820AD1",
      "icon": "landmark",
      "archived": false
    },
    {
      "id": 2,
      "name": "Carteira Física",
      "type": "CASH",
      "balance": 230.00,
      "color": "#10B981",
      "icon": "banknote",
      "archived": false
    }
  ],
  "totalBalance": 5080.32,
  "creditCardDebt": 1420.50
}
```

### Tratamento de Erros
- **`401 Unauthorized`**: Token ausente ou inválido.

---

## 2. Buscar Conta por ID

Retorna os detalhes de uma conta específica do usuário logado, com seu saldo atualizado em tempo real.

- **Método HTTP:** `GET`
- **Rota:** `/api/v1/accounts/{id}`
- **Autenticação Necessária:** Sim (`Bearer Token`)

### Parâmetros
#### Path Parameters
| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | `number` (Long) | Sim | Identificador numérico único da conta. |

### Request Body
Não se aplica (`GET`).

### Response Body (`200 OK`)
```json
{
  "id": 1,
  "name": "Nubank Conta",
  "type": "BANK",
  "balance": 4850.32,
  "color": "#820AD1",
  "icon": "landmark",
  "archived": false
}
```

### Tratamento de Erros
- **`401 Unauthorized`**: Não autenticado.
- **`404 Not Found`**: Conta não encontrada ou pertencente a outro usuário.
  ```json
  {
    "type": "about:blank",
    "title": "Not Found",
    "status": 404,
    "detail": "Conta não encontrada"
  }
  ```

---

## 3. Criar Conta

Registra uma nova conta financeira para o usuário.

- **Método HTTP:** `POST`
- **Rota:** `/api/v1/accounts`
- **Autenticação Necessária:** Sim (`Bearer Token`)

### Parâmetros
Não há Path Params nem Query Params.

### Request Body
```typescript
export interface AccountRequest {
  name: string;             // Obrigatório, máx. 60 caracteres
  type: AccountType;        // Obrigatório: 'BANK' | 'CASH' | 'DIGITAL_WALLET' | 'OTHER'
  initialBalance?: number;  // Opcional, decimal com até 2 casas (padrão: 0.00)
  color?: string;           // Hexadecimal válido (ex: "#3B82F6")
  icon?: string;            // Identificador de ícone (ex: "wallet", max 40 chars)
}
```

Exemplo:
```json
{
  "name": "Banco Inter",
  "type": "BANK",
  "initialBalance": 1000.00,
  "color": "#FF7A00",
  "icon": "building-2"
}
```

### Response Body (`201 Created`)
```json
{
  "id": 3,
  "name": "Banco Inter",
  "type": "BANK",
  "balance": 1000.00,
  "color": "#FF7A00",
  "icon": "building-2",
  "archived": false
}
```

### Tratamento de Erros
- **`400 Bad Request`**: Nome em branco, tipo inválido ou cor com formato incorreto.
  ```json
  {
    "type": "about:blank",
    "title": "Validation failed",
    "status": 400,
    "detail": "Erro de validação nos campos informados",
    "errors": [
      {
        "field": "name",
        "message": "nome é obrigatório"
      },
      {
        "field": "color",
        "message": "cor deve ser um hex válido (ex.: #3B82F6)"
      }
    ]
  }
  ```
- **`409 Conflict`**: O usuário já possui uma conta com esse mesmo nome.
  ```json
  {
    "type": "about:blank",
    "title": "Conflict",
    "status": 409,
    "detail": "Já existe uma conta com o nome informado"
  }
  ```

---

## 4. Atualizar Conta

Altera as propriedades de uma conta existente. Caso o `initialBalance` seja alterado, o saldo atual (`balance`) é recalculado automaticamente pelo backend.

- **Método HTTP:** `PUT`
- **Rota:** `/api/v1/accounts/{id}`
- **Autenticação Necessária:** Sim (`Bearer Token`)

### Parâmetros
#### Path Parameters
| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | `number` | Sim | Identificador numérico da conta. |

### Request Body
Mesma estrutura de `AccountRequest`.

```json
{
  "name": "Banco Inter Principal",
  "type": "BANK",
  "initialBalance": 1500.00,
  "color": "#FF7A00",
  "icon": "building-2"
}
```

### Response Body (`200 OK`)
Retorna o objeto `AccountResponse` atualizado.

```json
{
  "id": 3,
  "name": "Banco Inter Principal",
  "type": "BANK",
  "balance": 1500.00,
  "color": "#FF7A00",
  "icon": "building-2",
  "archived": false
}
```

### Tratamento de Erros
- **`400 Bad Request`**: Dados de entrada inválidos.
- **`404 Not Found`**: Conta não localizada.
- **`409 Conflict`**: Nome já em uso por outra conta do mesmo usuário.

---

## 5. Excluir ou Arquivar Conta

Aplica exclusão segura na conta.
- Se a conta **possui transações ou transferências**, ela será arquivada (`soft delete`), retornando `{ "archived": true }`.
- Se a conta **nunca teve movimentação**, ela sofrerá exclusão física definitiva (`hard delete`), retornando `{ "archived": false }`.

> [!IMPORTANT]
> Regra de Integridade: O sistema **não permite** arquivar ou excluir a **última conta ativa** do usuário.

- **Método HTTP:** `DELETE`
- **Rota:** `/api/v1/accounts/{id}`
- **Autenticação Necessária:** Sim (`Bearer Token`)

### Parâmetros
#### Path Parameters
| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | `number` | Sim | Identificador numérico da conta a ser removida. |

### Request Body
Não se aplica (`DELETE`).

### Response Body (`200 OK`)
```json
{
  "archived": true
}
```

### Tratamento de Erros
- **`401 Unauthorized`**: Não autenticado.
- **`404 Not Found`**: Conta não encontrada.
- **`422 Unprocessable Content`**: Tentativa de excluir a última conta ativa do usuário.
  ```json
  {
    "type": "about:blank",
    "title": "Unprocessable Content",
    "status": 422,
    "detail": "Não é possível excluir a última conta ativa do usuário"
  }
  ```

