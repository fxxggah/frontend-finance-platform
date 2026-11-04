# Documentação Técnica do Frontend - FIN

Bem-vindo à documentação técnica oficial da aplicação web de finanças pessoais **FIN**. Este repositório de documentos é a **fonte única da verdade** (*single source of truth*) para guiar tanto desenvolvedores quanto agentes de IA na implementação autônoma, consistente e de alta qualidade do frontend da aplicação.

---

## 1. Visão Geral do Projeto

O **FIN** é um web app moderno de finanças pessoais voltado para controle orçamentário, gestão de contas bancárias, controle de faturas de cartão de crédito, planejamento de metas financeiras e simulações de investimentos e dívidas.

- **Filosofia do Frontend:** O frontend **exibe** com precisão o que o backend calcula. Regras como saldos consolidados, limites de cartão, faturas, status de metas e intervalos de datas vêm calculados da API.
- **Idioma da Interface:** Todo o texto visível ao usuário final está em **Português do Brasil (pt-BR)**. Exemplo: o dashboard chama-se **"Início"**.
- **Idioma do Código:** Todos os arquivos, nomes de componentes, variáveis, tipos, commits e comentários de código devem estar em **Inglês**.

---

## 2. Stack Tecnológica

| Camada | Tecnologia | Versão / Padrão |
|---|---|---|
| **Framework Web** | [Next.js](https://nextjs.org/) | 16+ (App Router, Server & Client Components) |
| **Linguagem** | [TypeScript](https://www.typescriptlang.org/) | 5.7+ (Modo estrito ativado) |
| **Estilização** | [Tailwind CSS](https://tailwindcss.com/) v4 | Baseado em tokens CSS e `@theme` |
| **Componentes Base** | [shadcn/ui](https://ui.shadcn.com/) + Radix / Base UI | Primitivos acessíveis customizados |
| **Data Fetching & Cache** | [@tanstack/react-query](https://tanstack.com/query) | v5 (Cache server-state, retry, refetch) |
| **Estado Local de UI** | [Zustand](https://github.com/pmndrs/zustand) | Exclusivo para UI (sidebar, modais, tema) |
| **Formulários & Validação** | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) | Espelhando os contratos de validação da API |
| **Visualização de Dados** | [Recharts](https://recharts.org/) | Declarativo com variáveis CSS de tema |
| **Ícones** | [Lucide React](https://lucide.dev/) | Dicionário fixo e tipado (sem emojis soltos) |
| **Notificações** | [Sonner](https://sonner.emilkowal.ski/) | Toasts de feedback |

---

## 3. Mapa da Documentação Técnica

Para facilitar a leitura autônoma de qualquer agente de IA ou desenvolvedor, a documentação está dividida em módulos especializados:

```
fin-frontend/
├── api/                           # Contratos formais da API REST do backend
│   ├── README.md                  # Convenções globais, ProblemDetail, paginação
│   ├── auth.md                    # Autenticação Google e sessões
│   ├── users.md                   # Perfil do usuário e LGPD
│   ├── accounts.md                # Contas correntes, saldos e carteiras
│   ├── categories.md              # Categorias de receitas e despesas
│   ├── transactions.md            # Transações e compras parceladas
│   ├── transfers.md               # Transferências entre contas
│   ├── credit-cards.md            # Cartões de crédito, faturas e limites
│   ├── dashboard.md               # Métricas e consolidados do Início
│   ├── goals.md                   # Metas e contribuições
│   └── simulations.md             # Calculadoras de juros e amortizações
│
└── docs/                          # Documentação técnica do Frontend
    ├── README.md                  # Este arquivo (Índice geral e princípios)
    ├── architecture.md            # Arquitetura, autenticação, cliente API e erros
    ├── design-system.md           # Tokens Tailwind v4, cores, layout, formatação BRL
    ├── state-and-data.md          # React Query, chaves de cache, mock data e Zustand
    ├── routing-and-layouts.md     # Rotas App Router, Shell responsivo e controles de dev
    ├── screens-and-features.md    # Especificações detalhadas de todas as telas
    └── implementation-guide.md    # Passo a passo sequencial por fases (Fase 1 à 7)
```

---

## 4. Regras Inegociáveis de Desenvolvimento

1. **Zero Hardcoded Data em Telas:** Nenhuma tela deve embutir dados fictícios diretamente no JSX. Toda tela consome hooks customizados do TanStack Query vinculados aos serviços em `lib/services/` ou `lib/api/endpoints/`.
2. **Flag `USE_MOCK` Centralizada:** A alternância entre a API REST real e a base determinística de mock é feita por uma única variável de configuração (`USE_MOCK = true/false` em `lib/config.ts`).
3. **Formatação Monetária Centralizada:** Sempre utilize a função utilitária `formatMoney(value)` de `lib/format.ts` (ou `lib/format/money.ts`), que aplica `Intl.NumberFormat pt-BR` com classes `tabular-nums`.
4. **Respeito aos Tokens de Design:** Nunca utilize cores hexadecimais soltas nas classes Tailwind (`bg-[#...]`); utilize sempre os tokens semânticos declarados (`bg`, `surface`, `primary`, `income`, `expense`, etc.).
5. **Acessibilidade:** Cores nunca devem ser o único indicativo de estado; transações sempre possuem prefixo de sinal (`+` ou `−`) e rótulos textuais. Contraste mínimo de 4.5:1.
6. **Estados de UI via URL (`?state=`):** Todas as páginas principais devem aceitar `?state=loading|empty|error` para permitir validação visual de skeletons, empty states e tratamento de falhas.

