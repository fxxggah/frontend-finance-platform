# Autenticação (`/api/v1/auth`)

Módulo responsável pela autenticação via Google OAuth, renovação de tokens com rotação (`refresh token rotation`) e encerramento de sessão (`logout`).

Todas as rotas deste módulo são **públicas** (não exigem cabeçalho `Authorization`).

---

## 1. Login com Google

Valida o token de identidade emitido pelo Google Identity Services (`idToken`), registra o usuário se for o primeiro acesso ou atualiza seus dados, e retorna os tokens de acesso e de renovação.

- **Método HTTP:** `POST`
- **Rota:** `/api/v1/auth/google`
- **Autenticação Necessária:** Não

### Parâmetros
Não há Path Params nem Query Params.

### Request Body
```typescript
export interface GoogleLoginRequest {
  idToken: string; // Token JWT emitido pelo Google SDK no client-side
}
```

Exemplo:
```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjEyMzQ1NiJ9.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20i..."
}
```

### Response Body (`200 OK`)
```typescript
export interface UserResponse {
  id: number;
  name: string;
  email: string;
  pictureUrl: string | null;
}

export interface AuthResponse {
  accessToken: string;    // JWT válido por 15 minutos (900s)
  refreshToken: string;   // Token de rotação válido por 7 dias
  expiresIn: number;      // Tempo de expiração do access token em segundos (ex: 900)
  user: UserResponse;     // Dados básicos do usuário autenticado
}
```

Exemplo:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "4a7c8e9d-12b3-4f56-8a90-bcdef1234567",
  "expiresIn": 900,
  "user": {
    "id": 1,
    "name": "Maria Silva",
    "email": "maria.silva@gmail.com",
    "pictureUrl": "https://lh3.googleusercontent.com/a/ACg8ocI..."
  }
}
```

### Tratamento de Erros
- **`400 Bad Request`**: `idToken` em branco ou ausente.
  ```json
  {
    "type": "about:blank",
    "title": "Validation failed",
    "status": 400,
    "detail": "Erro de validação nos campos informados",
    "errors": [
      {
        "field": "idToken",
        "message": "não deve estar em branco"
      }
    ]
  }
  ```
- **`401 Unauthorized`**: Token do Google inválido, expirado ou com audiência/emissor incorretos.
  ```json
  {
    "type": "about:blank",
    "title": "Unauthorized",
    "status": 401,
    "detail": "Token do Google inválido ou expirado"
  }
  ```

---

## 2. Renovar Token de Acesso (`Refresh`)

Gera um novo `accessToken` e um novo `refreshToken`. O refresh token anterior é imediatamente invalidado (estratégia de **rotação de tokens** para mitigar riscos de roubo de sessão).

- **Método HTTP:** `POST`
- **Rota:** `/api/v1/auth/refresh`
- **Autenticação Necessária:** Não

### Parâmetros
Não há Path Params nem Query Params.

### Request Body
```typescript
export interface RefreshRequest {
  refreshToken: string; // Token de renovação ativo
}
```

Exemplo:
```json
{
  "refreshToken": "4a7c8e9d-12b3-4f56-8a90-bcdef1234567"
}
```

### Response Body (`200 OK`)
```typescript
export interface TokenResponse {
  accessToken: string;    // Novo JWT válido por 15 minutos
  refreshToken: string;   // Novo Refresh Token gerado pela rotação
  expiresIn: number;      // 900 (segundos)
}
```

Exemplo:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "9f8e7d6c-54a3-2b10-fe98-dcba76543210",
  "expiresIn": 900
}
```

### Tratamento de Erros
- **`400 Bad Request`**: Campo `refreshToken` ausente ou em branco.
- **`401 Unauthorized`**: Refresh token expirado, inválido ou reutilizado após rotação. O frontend deve limpar o estado de autenticação e redirecionar para a tela de login.
  ```json
  {
    "type": "about:blank",
    "title": "Unauthorized",
    "status": 401,
    "detail": "Refresh token expirado ou inválido"
  }
  ```

---

## 3. Logout

Revoga o refresh token informado no banco de dados, encerrando a validade da sessão remota.

- **Método HTTP:** `POST`
- **Rota:** `/api/v1/auth/logout`
- **Autenticação Necessária:** Não

### Parâmetros
Não há Path Params nem Query Params.

### Request Body
```typescript
export interface LogoutRequest {
  refreshToken: string; // Token a ser revogado
}
```

Exemplo:
```json
{
  "refreshToken": "9f8e7d6c-54a3-2b10-fe98-dcba76543210"
}
```

### Response Body (`200 OK`)
Não há payload no corpo da resposta (`null`/vazio).

### Tratamento de Erros
- **`400 Bad Request`**: Campo `refreshToken` nulo ou vazio.
- **`401 Unauthorized`**: Token inválido.

