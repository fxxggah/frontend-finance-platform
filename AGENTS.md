# FIN Frontend · Contexto e Regras do Agente

Frontend da aplicação web de **gerenciamento financeiro pessoal FIN**. O backend REST (Java 25 + Spring Boot 4 + MySQL) fica no repositório irmão (`../fin-backend`) e é desenvolvido pelo Gabriel, com os contratos de integração documentados na pasta `api/`. Este repositório é o **frontend em Next.js App Router**, desenvolvido pelo Gabriel.

---

## Idioma e tom

Responda ao Gabriel em **português do Brasil, de forma direta, técnica e um pouco informal**. Dê recomendações concretas com conclusão clara, sem "depende" solto. Quando houver alternativas, analise, **escolha a melhor** e justifique em poucas linhas.

---

## Stack

- **Framework:** Next.js 16+ (App Router, divisão Server vs. Client Components) · React 19 · TypeScript 5.7+ (estrito)
- **Gerenciador de Pacotes:** `pnpm`
- **Estilização:** Tailwind CSS v4 (tokens via `@theme` e CSS Variables em `app/globals.css`) · shadcn/ui
- **Data Fetching & Cache:** `@tanstack/react-query` v5 (cache de dados remotos, staleTime, refetch)
- **Estado de UI:** `zustand` (exclusivo para UI: sidebar, visibilidade de saldo `"••••"`, modais efêmeros)
- **Formulários & Validação:** `react-hook-form` + `zod` (espelhando os contratos de request da API)
- **Gráficos:** `recharts` (declarativo, estilizado com as variáveis CSS de tema)
- **Ícones:** `lucide-react` (mapeados via dicionário tipado em `CategoryIcon`, sem emojis soltos)
- **Notificações:** `sonner` (toasts padronizados)

---

## Documentação (leia antes de implementar)

| Arquivo | Quando ler |
|---|---|
| `docs/implementation-guide.md` | **No início de qualquer tarefa:** para confirmar a fase atual, arquivos e dependências |
| `docs/architecture.md` | Sempre que criar rota, client HTTP, middleware, lidar com cookies ou sessão |
| `docs/design-system.md` | Sempre que estilizar telas, criar componentes visuais, formatar moedas ou usar ícones |
| `docs/state-and-data.md` | Sempre que usar React Query, criar hooks, mock data, store Zustand ou formulário Zod |
| `docs/routing-and-layouts.md` | Sempre que mexer no Shell (Sidebar, Topbar, BottomNav), seletor de período ou `?state=` |
| `docs/screens-and-features.md` | Sempre que implementar ou ajustar regras de uma tela específica |
| `api/*.md` | Sempre que consumir ou integrar um endpoint do backend (contratos oficiais de request/response) |

Se a documentação e o código divergirem, **não escolha em silêncio**: avise e pergunte.

---

## Antes de escrever qualquer código

1. Leia `docs/implementation-guide.md` e confirme **em qual fase estamos** e quais arquivos devem ser criados/alterados.
2. Leia os documentos pertinentes à tarefa (`docs/screens-and-features.md`, `docs/design-system.md` e o respectivo `api/<modulo>.md`).
3. Inspecione os componentes e hooks existentes na pasta correspondente (`components/`, `hooks/`, `lib/`) e **siga o padrão adotado**.

---

## Regras inegociáveis

1. **Zero Hardcoded Data em Telas:** Nenhuma tela ou página deve embutir arrays ou dados mockados estáticos no JSX. Toda tela consome hooks customizados do TanStack Query integrados a `lib/services/` ou `lib/api/endpoints/`.
2. **Flag `USE_MOCK` Centralizada:** A alternância entre o backend real e a base determinística de mock é feita exclusivamente pela constante `USE_MOCK` em `lib/config.ts`.
3. **O Frontend Exibe o que o Backend Calcula:** Saldo consolidado, fatura de cartão, limites disponíveis, progresso de meta e calendário de períodos (`from`/`to`) vêm calculados da API. O front nunca recalcula regras de domínio.
4. **Dinheiro e Formatação BRL:** Sempre utilize a função utilitária `formatMoney()` com `Intl.NumberFormat pt-BR` e classes `tabular-nums`. Nunca faça concatenação manual de string como `"R$ " + valor`.
5. **Tokens de Cores Semânticos:** Nunca use valores hexadecimais soltos nas classes do Tailwind (`bg-[#5B3DF5]`). Utilize sempre os tokens configurados (`bg-bg`, `bg-surface`, `bg-primary`, `text-income`, `text-expense`, etc.).
6. **Glassmorphism Restrito:** Efeito vidro (`backdrop-blur` com fundo translúcido) é restrito à pílula de atalhos rápidos do Hero e à barra inferior `BottomNav` mobile. O restante da interface deve ser sólido.
7. **Acessibilidade Mandatória:** Cores nunca transmitem informação sozinhas. Lançamentos sempre possuem sinal explícito (`+` ou `−`) e texto indicativo. Contraste mínimo de 4.5:1 e áreas de toque mínimas de 44px.
8. **Tratamento de Erros:** Erros de API seguem o padrão `ProblemDetail` (RFC 7807) encapsulados em `ApiError`. Erros de validação (status 400) com lista `errors: [{ field, message }]` devem ser refletidos nos campos correspondentes do formulário via `react-hook-form`.
9. **Estados de UI via URL (`?state=`):** Todas as páginas principais devem aceitar `?state=loading|empty|error` através do hook `useDevState` para validação visual imediata de skeletons, telas vazias e falhas.
10. **Idioma:** Toda a interface visível ao usuário e mensagens de validação estão em **português (pt-BR)** (ex: o dashboard chama-se **"Início"**). Nomes de arquivos, funções, componentes, tipos e identificadores de código ficam em **inglês**.
11. **Multiusuário:** O frontend **nunca envia `userId`** em payloads, queries ou URLs. A identificação do usuário é feita exclusivamente pelo token JWT no backend.
12. **Segredos:** Variáveis expostas no client exigem prefixo `NEXT_PUBLIC_`. Nunca commite chaves de API sensíveis ou credenciais em `.env`.

---

## Como trabalhar

- Faça a **menor mudança suficiente** para cumprir a tarefa com excelência.
- **Não invente** dependências no `package.json`, bibliotecas de componentes concorrentes ou rotas fora do planejado sem alinhar antes.
- Mantenha os componentes pequenos e modulares, dividindo entre Server Components (casca e layouts) e Client Components (interatividade e hooks).
- Uma tarefa por vez. Ideias adicionais e melhorias futuras devem ser anotadas no final da resposta, sem alterar o escopo atual.
- Se o contrato da API em `api/*.md` conflitar com o frontend ou se houver dúvida de payload, **pare e pergunte**.

---

## Formato das respostas

**Ao implementar uma feature ou tela:**
1. Resuma em 2–3 linhas o que será feito.
2. Apresente o código completo e devidamente tipado.
3. Finalize com a lista de arquivos criados/alterados e a instrução clara de como testar em tela (incluindo teste com `?state=`).

**Ao depurar um erro:**
1. **Causa:** O que está falhando (tipo incorreto, re-render infinito, quebra de hidratação, etc.).
2. **Por quê:** Motivo técnico do problema.
3. **Correção:** O que mudar no código.
4. **Local Exato:** Arquivo e linhas envolvidas.
5. **Código Pronto:** Bloco de código para substituição direta.
6. **Como Validar:** Passo a passo para testar a correção.

**Ao revisar código:** Aponte problemas do mais grave ao menos grave, priorizando: vazamento de dados, quebra de contrato com a API, re-renders desnecessários no React Query, acessibilidade e responsividade mobile quebrada.

---

## Quando terminar uma tarefa

Rode os comandos de verificação e relate o resultado:

```bash
pnpm build
```

Confira a **definição de pronto** abaixo:

### Definição de Pronto
- [ ] Compila sem erros de TypeScript (`pnpm build`)
- [ ] Sem dados mockados hardcoded embutidos nas páginas (usa hooks e serviços)
- [ ] Responsividade testada em viewport mobile (< 1024px) e desktop (>= 1024px)
- [ ] Estados de `loading` (Skeleton), `empty` e `error` validados (funciona com `?state=`)
- [ ] Formatação monetária com BRL e `tabular-nums`
- [ ] Contratos de `api/*.md` respeitados
- [ ] Documentação em `docs/` atualizada caso tenha havido ajuste de escopo

---

## Limites

- Cuide **só do frontend**. O backend é do Biel e do Breno; se precisar de endpoint novo ou alteração de DTO, reporte a necessidade para alinhamento e atualização em `api/`.
- Não instale novas bibliotecas de UI sem aprovação prévia do João.
- Não altere o Design System base (tokens de cores primárias, background, raios de curvatura e fontes) sem alinhamento.
- Nunca execute comandos destrutivos (`git reset --hard`, `git clean -fd`, deleção de arquivos em massa) sem confirmação explícita.

---

## Comandos úteis

```bash
pnpm dev              # Inicia o servidor Next.js em modo desenvolvimento
pnpm build            # Executa a compilação de produção e checagem de tipos TS
pnpm start            # Inicia o servidor com o build gerado
pnpm lint             # Executa o linter do projeto
```

