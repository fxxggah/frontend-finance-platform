# Categorias (`/api/v1/categories`)

Módulo responsável pela gestão de categorias de receitas e despesas com suporte a cores e ícones customizados.

Todas as rotas exigem autenticação via cabeçalho `Authorization: Bearer <accessToken>`.

---

## Tipos e Enums

```typescript
export type TransactionType = 'INCOME' | 'EXPENSE';

export interface CategoryResponse {
  id: number;
  name: string;
  type: TransactionType;
  color: string;            // Ex: "#3B82F6"
  icon: string;             // Ex: "shopping-cart"
}

export interface CategoryRequest {
  name: string;             // Obrigatório, máx. 60 caracteres
  type: TransactionType;    // Obrigatório: 'INCOME' | 'EXPENSE'
  color?: string;           // Hexadecimal válido (ex: "#3B82F6")
  icon?: string;            // Identificador do ícone (ex: "utensils")
}

export interface CategoryUpdateRequest {
  name: string;             // Obrigatório, máx. 60 caracteres
  color?: string;           // Hexadecimal válido (ex: "#3B82F6")
  icon?: string;            // Identificador do ícone (ex: "utensils")
}
```

---

## 1. Listar Categorias

Retorna a lista de categorias do usuário autenticado. Permite filtrar apenas categorias de receita (`INCOME`) ou de despesa (`EXPENSE`).

- **Método HTTP:** `GET`
- **Rota:** `/api/v1/categories`
- **Autenticação Necessária:** Sim (`Bearer Token`)

### Parâmetros
#### Query Parameters
| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `type` | `TransactionType` (`'INCOME'` \| `'EXPENSE'`) | Não | Filtra as categorias pelo tipo. Se omitido, retorna todas. |

### Request Body
Não se aplica (`GET`).

### Response Body (`200 OK`)
```json
[
  {
    "id": 1,
    "name": "Alimentação",
    "type": "EXPENSE",
    "color": "#EF4444",
    "icon": "utensils"
  },
  {
    "id": 2,
    "name": "Salário",
    "type": "INCOME",
    "color": "#10B981",
    "icon": "briefcase"
  }
]
```

### Tratamento de Erros
- **`401 Unauthorized`**: Não autenticado.

---

## 2. Criar Categoria

Cria uma nova categoria associada ao usuário. O nome deve ser único por tipo para o mesmo usuário.

- **Método HTTP:** `POST`
- **Rota:** `/api/v1/categories`
- **Autenticação Necessária:** Sim (`Bearer Token`)

### Parâmetros
Não há Path Params nem Query Params.

### Request Body
```json
{
  "name": "Lazer e Cultura",
  "type": "EXPENSE",
  "color": "#8B5CF6",
  "icon": "film"
}
```

### Response Body (`201 Created`)
```json
{
  "id": 3,
  "name": "Lazer e Cultura",
  "type": "EXPENSE",
  "color": "#8B5CF6",
  "icon": "film"
}
```

### Tratamento de Erros
- **`400 Bad Request`**: Nome em branco, tipo inválido ou formatação de cor inválida.
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
      }
    ]
  }
  ```
- **`409 Conflict`**: O usuário já possui uma categoria com esse mesmo nome dentro do tipo informado.
  ```json
  {
    "type": "about:blank",
    "title": "Conflict",
    "status": 409,
    "detail": "Já existe uma categoria com este nome para o tipo selecionado"
  }
  ```

---

## 3. Atualizar Categoria

Atualiza os dados de uma categoria existente.

> [!NOTE]
> O campo `type` (`INCOME`/`EXPENSE`) **não é editável** via `PUT` para preservar o histórico e a consistência das transações já associadas.

- **Método HTTP:** `PUT`
- **Rota:** `/api/v1/categories/{id}`
- **Autenticação Necessária:** Sim (`Bearer Token`)

### Parâmetros
#### Path Parameters
| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | `number` | Sim | Identificador numérico da categoria. |

### Request Body
```json
{
  "name": "Cinema e Entretenimento",
  "color": "#7C3AED",
  "icon": "ticket"
}
```

### Response Body (`200 OK`)
```json
{
  "id": 3,
  "name": "Cinema e Entretenimento",
  "type": "EXPENSE",
  "color": "#7C3AED",
  "icon": "ticket"
}
```

### Tratamento de Erros
- **`400 Bad Request`**: Validação de campos.
- **`404 Not Found`**: Categoria não encontrada.
- **`409 Conflict`**: Nome duplicado para o mesmo tipo.

---

## 4. Excluir Categoria

Remove a categoria informada. Se houver transações vinculadas, o backend aplica exclusão lógica (`soft delete`), impedindo sua seleção em novos lançamentos mas mantendo o histórico intacto. Caso não possua transações, é feita a exclusão física (`hard delete`).

- **Método HTTP:** `DELETE`
- **Rota:** `/api/v1/categories/{id}`
- **Autenticação Necessária:** Sim (`Bearer Token`)

### Parâmetros
#### Path Parameters
| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | `number` | Sim | Identificador da categoria a excluir. |

### Request Body
Não se aplica (`DELETE`).

### Response Body (`204 No Content`)
Não há conteúdo no corpo da resposta (`null`/vazio).

### Tratamento de Erros
- **`401 Unauthorized`**: Não autenticado.
- **`404 Not Found`**: Categoria não encontrada ou pertencente a outro usuário.

