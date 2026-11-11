# Integração com o backend real

## Fonte de verdade e geração

O contrato executável é o OpenAPI do Spring Boot em `/v3/api-docs`. `openapi.json`
registra o snapshot consultado. Quando houver divergência com os documentos em
`docs/api/`, o OpenAPI do backend em execução prevalece.

```bash
pnpm api:types
pnpm test:api
pnpm build
```

`api:types` lê `.env` e `.env.local`, consulta o backend e gera
`types/api.generated.ts` com `openapi-typescript`. A variável opcional `OPENAPI_URL`
permite indicar outro endereço do documento. Não edite o arquivo gerado.
`types/domain.ts` deriva aliases e modelos de apresentação desses tipos. Os DTOs
de resposta do Spring atualmente não anotam `required`/`nullable`; os modelos
explicam os campos que podem ser nulos na implementação atual.

O build verifica TypeScript. Os testes de serviços usam transporte controlado,
validam rotas, métodos, parâmetros e campos contra o snapshot e não gravam dados
no backend real.

Com um build rodando em `http://localhost:3005`, `node scripts/ui-smoke.mjs`
valida as telas em Chrome headless, nas larguras 390 e 1440 px, com respostas
controladas. `SMOKE_URL` e `CHROME_PATH` permitem alterar o servidor e o executável.
Essa verificação cobre telas, estados, navegação e envio das simulações; a
autenticação Google e os dados de uma conta real exigem a validação manual abaixo.

## Ambiente

```dotenv
NEXT_PUBLIC_USE_MOCK=false
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<client ID OAuth do Google>
```

Somente `NEXT_PUBLIC_USE_MOCK=true` ativa as fixtures de desenvolvimento. Ausência,
`false` e outros valores usam a API real. Não há fallback para fixtures em erros.
A URL aceita a origem ou o sufixo `/api/v1`, com ou sem barra final. Reinicie o
Next após alterar variáveis públicas e refaça o build de produção.

## Sessão e perfil

O access token fica em memória. Ao recarregar a página, o cliente chama o BFF
`POST /api/auth/refresh`, que lê o refresh token no cookie httpOnly `fin_session`,
rotaciona o token no Spring e devolve somente o access token. Consultas paralelas
compartilham uma renovação. Cada requisição privada envia `Authorization: Bearer`.
Um 401 permite uma repetição; indisponibilidade de rede não apaga o cookie.

Topbar, HeaderMobile e Configurações compartilham `useCurrentUser` para
`GET /users/me`, incluindo a foto de `pictureUrl`. Não exibem uma pessoa fictícia
durante carregamento ou erro. A Sidebar atual só contém navegação, sem perfil.
Login e logout limpam o cache do React Query para evitar dados da sessão anterior.

## Telas e consultas

- Início: resumo, evolução, categorias e transações recentes do dashboard,
  patrimônio de `/accounts` e metas ativas de `/goals`.
- Relatórios: reutiliza os endpoints de dashboard; não existe módulo `/reports`
  no OpenAPI. Filtros de conta, cartão e intervalo fazem parte da consulta e do cache.
- Transações: `/transactions` e `/transactions/new` reutilizam formulários,
  listas e tabela existentes. O intervalo do período vem de `/dashboard/summary`;
  a consulta de lançamentos recebe `from`, `to`, `q` e paginação.
- Categorias: `PUT /categories/{id}` envia apenas nome, cor e ícone. O tipo não é editável.
- Simulações: usam os dois POSTs de `/simulations`; cálculos locais só são usados
  quando o modo mock está explicitamente ligado.
- Configurações: perfil e exclusão de conta consultam `/users/me`; a exclusão só
  acontece após confirmação explícita no diálogo.

Datas iniciais de formulário e referência de período usam a data atual em
`America/Sao_Paulo`. Os intervalos e valores financeiros vêm das respostas da API.
Sparklines decorativas e previsões locais de competência/parcelas foram removidas.

## Limites do OpenAPI atual

- Não existem GETs de cartão por ID nem de detalhe de fatura. O cartão é obtido
  da lista de cartões ativos. A fatura usa o resumo retornado pela lista de faturas
  ou pela fatura atual do cartão. As compras vêm da lista paginada de transações,
  filtradas pela competência já retornada pelo backend.
- Não há consulta do histórico de pagamentos. O total pago vem do resumo, mas
  a lista detalhada é sinalizada como indisponível. Para habilitar a lista e o
  estorno por seleção, o backend precisa expor os pagamentos e seus IDs.
- `GET /credit-cards` retorna apenas cartões ativos e não aceita `includeArchived`.
  O acesso a detalhes de cartões arquivados precisa de suporte adicional do backend.
- DELETE de cartão, usuário e meta, POST de logout e algumas mutações de metas
  retornam 200 sem corpo. O cliente também aceita 201/204 sem tentar ler JSON vazio.

## Validação manual com uma sessão real

Inicie o Spring, configure o client ID OAuth e rode `pnpm dev`. Entre pelo Google
e confira nome, foto, saldo e lançamentos da conta autenticada. Recarregue a página
para validar recuperação do token e teste login com outra conta após logout.

Confira Início em mobile e desktop e os estados `/dashboard?state=loading`,
`?state=empty` e `?state=error`. Repita em `/transactions`, `/accounts`, `/cards`,
`/goals`, `/categories` e `/reports`. Desligar o backend deve exibir erro,
sem dados de demonstração. Teste cadastros e exclusões apenas com dados de teste.
