# Usuários (`/api/v1/users`)

Módulo responsável pela consulta do perfil do usuário autenticado e pela exclusão definitiva da conta (conformidade com a LGPD).

Todas as rotas exigem autenticação via cabeçalho `Authorization: Bearer <accessToken>`.

---

## 1. Obter Perfil do Usuário Logado

Retorna os dados cadastrais básicos da conta do usuário autenticado no sistema.

- **Método HTTP:** `GET`
- **Rota:** `/api/v1/users/me`
- **Autenticação Necessária:** Sim (`Bearer Token`)

### Parâmetros
Não há Path Params nem Query Params.

### Request Body
Não se aplica (`GET`).

### Response Body (`200 OK`)
```typescript
export interface UserResponse {
  id: number;
  name: string;
  email: string;
  pictureUrl: string | null;
}
```

Exemplo:
```json
{
  "id": 1,
  "name": "Maria Silva",
  "email": "maria.silva@gmail.com",
  "pictureUrl": "https://lh3.googleusercontent.com/a/ACg8ocI6zQ..."
}
```

### Tratamento de Erros
- **`401 Unauthorized`**: Token de autenticação ausente, malformado ou expirado.
- **`404 Not Found`**: Registro de usuário não encontrado no banco de dados.
  ```json
  {
    "type": "about:blank",
    "title": "Not Found",
    "status": 404,
    "detail": "Usuário não encontrado"
  }
  ```

---

## 2. Excluir Conta (LGPD)

Exclui permanentemente o usuário e todos os seus registros associados (contas bancárias, transações, transferências, cartões de crédito, metas e faturas) em cascata.

> [!CAUTION]
> Esta operação é irreversível. O frontend deve apresentar um modal de confirmação explícito antes de invocar este endpoint e, após o retorno de sucesso, deslogar o usuário e redirecioná-lo para a tela inicial.

- **Método HTTP:** `DELETE`
- **Rota:** `/api/v1/users/me`
- **Autenticação Necessária:** Sim (`Bearer Token`)

### Parâmetros
Não há Path Params nem Query Params.

### Request Body
Não se aplica (`DELETE`).

### Response Body (`200 OK`)
Não há conteúdo no corpo da resposta (`null`/vazio).

### Tratamento de Erros
- **`401 Unauthorized`**: Token ausente ou inválido.
- **`404 Not Found`**: Usuário inexistente.

