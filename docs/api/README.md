# FIN API - Contrato Oficial de Integração Frontend

Esta pasta reúne a documentação técnica oficial de integração da API RESTful do aplicativo **FIN**. Estes documentos servem como fonte de verdade para o desenvolvimento do frontend (Next.js App Router, TypeScript, Tailwind CSS, TanStack Query e Zustand).

Em divergências, prevalece o OpenAPI de `/v3/api-docs` do backend em execução.
`pnpm api:types` atualiza `openapi.json` e `types/api.generated.ts`. As adaptações
e limitações conhecidas estão em [api-integration.md](../api-integration.md).

---

## 1. Convenções Globais

- **URL Base:** `/api/v1` (em desenvolvimento local: tipicamente `http://localhost:8080/api/v1`).
- **Autenticação:** Todas as rotas (com exceção do módulo `/auth/**`) exigem o cabeçalho HTTP:
  ```http
  Authorization: Bearer <accessToken>
  ```
- **Identificação do Usuário:** O `userId` é extraído exclusivamente pelo token JWT no backend (`sub`). Nunca envie `userId` em payloads, query params ou URLs.
- **Formato de Datas:**
  - Datas padrão em formato ISO-8601: `YYYY-MM-DD` (ex: `2026-10-21`).
  - Referências de fatura de cartão de crédito no formato: `yyyy-MM` (ex: `2026-10`).
- **Valores Monetários:**
  - Representados como número decimal (`number` em TypeScript / `BigDecimal` em Java, ex: `1250.75`).
  - Duas casas decimais.
- **Enums e Identificadores:** Chaves, enums e identificadores de código sempre em **inglês**. Textos de interface, mensagens de validação e descrições de negócio em **português (pt-BR)**.

---

## 2. Paginação Padrão (`PageResponse<T>`)

Endpoints paginados (ex: `/transactions`, `/transfers`) recebem parâmetros de paginação e ordenação via query string:

### Query Parameters Comuns
| Parâmetro | Tipo | Padrão | Descrição |
|---|---|---|---|
| `page` | `integer` | `0` | Índice da página (base 0). |
| `size` | `integer` | `20` | Quantidade de itens por página (máx. 100). |
| `sort` | `string` | `date,desc` | Campo e direção de ordenação (ex: `date,desc`, `amount,asc`). |

### Estrutura de Resposta Paginada (`PageResponse<T>`)
```typescript
export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
```

Exemplo JSON:
```json
{
  "content": [],
  "page": 0,
  "size": 20,
  "totalElements": 48,
  "totalPages": 3
}
```

---

## 3. Padrão de Erros (`ProblemDetail` - RFC 7807)

Todos os erros retornados pela API seguem a especificação RFC 7807 (`application/problem+json`).

### Tipagem TypeScript do Erro
```typescript
export interface ValidationErrorDetail {
  field: string;
  message: string;
}

export interface ProblemDetail {
  type: string;             // Geralmente "about:blank"
  title: string;            // Título descritivo do status HTTP
  status: number;           // Código de status HTTP (ex: 400, 401, 404, 422)
  detail: string;           // Mensagem legível explicando o motivo do erro
  instance?: string;        // URI da requisição (opcional)
  errors?: ValidationErrorDetail[]; // Lista de erros de validação (status 400)
}
```

### Exemplo de Erro de Validação de Campos (`400 Bad Request`)
```json
{
  "type": "about:blank",
  "title": "Validation failed",
  "status": 400,
  "detail": "Erro de validação nos campos informados",
  "errors": [
    {
      "field": "amount",
      "message": "deve ser maior que zero"
    },
    {
      "field": "categoryId",
      "message": "é obrigatório"
    }
  ]
}
```

### Exemplo de Erro de Regra de Negócio (`422 Unprocessable Content`)
```json
{
  "type": "about:blank",
  "title": "Unprocessable Content",
  "status": 422,
  "detail": "Não é possível excluir a última conta ativa do usuário"
}
```

### Tabela de Status HTTP Utilizados
| Status | Significado | Quando ocorre |
|---|---|---|
| `200 OK` | Sucesso | Requisição processada com retorno de dados. |
| `201 Created` | Criado | Recurso criado com sucesso. |
| `204 No Content` | Sem Conteúdo | Exclusão ou operação com sucesso sem corpo de resposta. |
| `400 Bad Request` | Requisição Inválida | Falha na validação dos campos do formulário/payload (`errors[]`). |
| `401 Unauthorized` | Não Autorizado | Token ausente, expirado ou inválido; Refresh token revogado. |
| `403 Forbidden` | Proibido | Usuário autenticado não tem permissão para a ação. |
| `404 Not Found` | Não Encontrado | Recurso não existe ou pertence a outro usuário. |
| `409 Conflict` | Conflito | Violação de duplicidade (ex: nome de conta ou categoria repetido). |
| `422 Unprocessable Content` | Regra de Negócio Violada | Dados válidos sintaticamente, mas que violam regras de domínio. |
| `500 Internal Server Error` | Erro no Servidor | Falha inesperada não tratada no backend. |

---

## 4. Índice de Módulos da API

| Módulo | Arquivo de Contrato | Descrição |
|---|---|---|
| **Autenticação** | [`auth.md`](./auth.md) | Login Google, Renovação com Refresh Token e Logout |
| **Usuário** | [`users.md`](./users.md) | Perfil do usuário e exclusão de conta (LGPD) |
| **Contas** | [`accounts.md`](./accounts.md) | Contas correntes, carteiras físicas, saldos e patrimônio |
| **Categorias** | [`categories.md`](./categories.md) | Categorias de receitas e despesas com cores e ícones |
| **Transações** | [`transactions.md`](./transactions.md) | Receitas e despesas simples ou parceladas com filtros dinâmicos |
| **Transferências** | [`transfers.md`](./transfers.md) | Movimentações financeiras entre contas internas |
| **Cartões de Crédito** | [`credit-cards.md`](./credit-cards.md) | Cartões, faturas (`invoices`), limites e pagamentos |
| **Dashboard** | [`dashboard.md`](./dashboard.md) | Métricas resumidas, evolução temporal e gráfico de categorias |
| **Metas** | [`goals.md`](./goals.md) | Metas de economia (`SAVINGS`), orçamentos e contribuições |
| **Simulações** | [`simulations.md`](./simulations.md) | Calculadoras de juros compostos e quitação de dívidas |

