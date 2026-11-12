# Rotas, Layouts e Shell Responsivo

Este documento detalha o sistema de navegação e layouts do **FIN**, abrangendo a estrutura de rotas do Next.js App Router, o shell responsivo para desktop e mobile, o componente de seletor de período e a padronização de estados de desenvolvimento via URL.

---

## 1. Mapeamento Geral de Rotas

```
app/
├── (public)/
│   └── login/
│       └── page.tsx              # /login - Tela pública de autenticação
│
└── (app)/                        # Protegido por middleware de sessão
    ├── layout.tsx                # Shell responsivo (Sidebar / Topbar / BottomNav)
    ├── dashboard/
    │   └── page.tsx              # /dashboard - "Início" (Visão geral)
    ├── transactions/
    │   ├── page.tsx              # /transactions - Lista e filtros de transações
    │   └── new/
    │       └── page.tsx          # /transactions/new - Cadastro de transação
    ├── accounts/
    │   └── page.tsx              # /accounts - Contas bancárias e carteiras
    ├── cards/
    │   ├── page.tsx              # /cards - Lista de cartões e limites
    │   └── [id]/
    │       └── invoices/
    │           └── [ym]/
    │               └── page.tsx  # /cards/[id]/invoices/[ym] - Detalhe de fatura
    ├── goals/
    │   ├── page.tsx              # /goals - Metas e orçamentos
    │   └── [id]/
    │       └── page.tsx          # /goals/[id] - Detalhe e contribuições
    ├── reports/
    │   └── page.tsx              # /reports - Análises e taxa de poupança
    ├── categories/
    │   └── page.tsx              # /categories - Gerenciamento de categorias
    ├── simulations/
    │   ├── investment/
    │   │   └── page.tsx          # /simulations/investment - Juros compostos
    │   └── debt/
    │       └── page.tsx          # /simulations/debt - Quitação de dívidas
    └── settings/
        └── page.tsx              # /settings - Preferências e perfil
```

---

## 2. Shell Desktop (`viewport >= 1024px`)

Todas as rotas seguem a linguagem visual consolidada da dashboard. O shell fornece o padding externo; `PageContainer` limita o conteúdo a 1440px (ou 768px para composições de formulário). Sidebar e Topbar usam superfícies sólidas, sem blur. A sidebar permanece escura nos dois temas. A BottomNav usa vidro de até 12px com fallback sólido e padding para a área segura do dispositivo.

Projetado para telas amplas com navegação intuitiva e estável:

### 2.1 Sidebar Fixa à Esquerda (`w-64`)
- **Fundo:** Cor fixa semântica `bg-sidebar` (`#0E1230`) com textos em `#C9CDEB`.
- **Cabeçalho:** Marca **FIN** (wordmark elegante acompanhado de símbolo geométrico em gradiente violeta-azul).
- **Lista de Navegação:**
  1. **Início** (ícone `LayoutDashboard`, rota `/dashboard`)
  2. **Transações** (ícone `ArrowLeftRight`, rota `/transactions`)
  3. **Contas** (ícone `Landmark`, rota `/accounts`)
  4. **Cartões** (ícone `CreditCard`, rota `/cards`)
  5. **Metas** (ícone `Target`, rota `/goals`)
  6. **Relatórios** (ícone `BarChart3`, rota `/reports`)
  7. **Categorias** (ícone `Tags`, rota `/categories`)
  8. **Simulações** (ícone `Calculator`, rota `/simulations/investment`)
  9. **Configurações** (ícone `Settings`, rota `/settings`)
- **Estilo do Item Ativo:** Pílula destacada com fundo em gradiente violeta, ícone e texto brancos.
- **Card de Base:** Card estilizado "Defina um objetivo" com botão CTA "Nova meta".

### 2.2 Topbar Superior
- **Saudação Contextual:** Baseada no horário do dia (*"Bom dia"*, *"Boa tarde"*, *"Boa noite"*, acompanhada pelo nome da usuária).
- **Controles:**
  - Seletor de Tema (ícone `Sun` / `Moon`).
  - Avatar da usuária com dropdown de perfil e logout.

---

## 3. Shell Mobile (`viewport < 1024px`)

Adaptado para uso rápido com uma mão (ergonomia mobile-first):

### 3.1 Cabeçalho Mobile
- Fundo em `gradient-hero` com cantos inferiores arredondados `rounded-b-[2rem]`.
- Contém o avatar da usuária, saudação compacta e seletor de tema.

### 3.2 Barra Inferior Fixa com Efeito Vidro (`BottomNav`)
- Fixada no rodapé da tela com `backdrop-blur-md` e fundo branco translúcido (`rgba(255,255,255,0.85)` no modo claro).
- **5 Posições de Acesso Rápido:**
  1. **Início** (`/dashboard`)
  2. **Transações** (`/transactions`)
  3. **Botão Central Flutuante `+` (`FabAction`):** Botão circular elevado, ampliado, em gradiente violeta vibrante. Abre o menu rápido de ações (Nova receita, Nova despesa, Transferir).
  4. **Relatórios** (`/reports`)
  5. **Mais:** Abre o Bottom Sheet com acesso aos demais módulos.

### 3.3 Bottom Sheets Móveis
- **Sheet "Mais":** Apresenta grade com Contas, Cartões, Metas, Categorias, Simulações e Configurações.
- **Sheet "Ação Rápida (+)"**: Acesso instantâneo com um toque para:
  - 🟢 **Nova Receita:** Abre formulário com tipo predefinido `INCOME`.
  - 🔴 **Nova Despesa:** Abre formulário com tipo predefinido `EXPENSE`.
  - 🔵 **Transferência:** Abre formulário entre contas.

---

## 4. Seletor de Período Reutilizável (`PeriodSelector`)

Componente presente no topo das telas analíticas (Dashboard, Relatórios, Transações):

- **Opções Suportadas:**
  - `DAY` (Dia)
  - `WEEK` (Semana - Segunda a Domingo)
  - `MONTH` (Mês - Padrão)
  - `YEAR` (Ano)
  - `CUSTOM` (Intervalo Personalizado com `from` e `to`)
- O tipo `Period` e as opções da interface ficam restritos a esses cinco valores.
  Valores removidos ou inválidos na URL são normalizados para `MONTH`.
  O OpenAPI e seus tipos gerados continuam descrevendo todos os valores do backend.
- **Exibição do Intervalo Resolvido:** O componente sempre exibe ao lado do seletor o texto com as datas resolvidas (ex.: `"1 a 31 de out. de 2026"`), **extraídas diretamente dos campos `from` e `to` da resposta da API**. O frontend nunca recalcula calendários complexos.
- **Controles no Início:** `DAY` usa calendário de dia, `MONTH` usa seleção nativa de mês/ano, `WEEK` usa seleção nativa de semana ISO (segunda a domingo) e `YEAR` aceita apenas o ano, aplicado ao sair do campo ou pressionar Enter. `CUSTOM` mantém as datas De/Até. Mês, semana e ano são serializados em uma data de referência `date`, sem alterar o contrato da API; o intervalo exibido continua vindo de `from`/`to` da resposta.
- **Sincronização via URL:**
  ```
  /dashboard?period=MONTH&date=2026-10-31
  /dashboard?period=CUSTOM&from=2026-09-01&to=2026-10-31
  ```
- **Limite de Consulta:** Até 24 meses de intervalo (exibe alerta se o usuário tentar exceder).

---

## 5. Controle de Estados de Desenvolvimento (`?state=`)

Para garantir que todas as telas possuam tratamento visual perfeito para carregamento, ausência de dados e falhas de rede, cada tela deve suportar o parâmetro de query string `?state=`:

```typescript
// hooks/use-dev-state.ts
import { useSearchParams } from 'next/navigation';

export type DevState = 'loading' | 'empty' | 'error' | null;

export function useDevState(): DevState {
  const searchParams = useSearchParams();
  const state = searchParams.get('state');
  if (state === 'loading' || state === 'empty' || state === 'error') {
    return state;
  }
  return null;
}
```

### Comportamento em Telas:
- **`?state=loading`:** Força a exibição dos componentes de **Skeleton** (mesmo com dados já carregados no cache do React Query).
- **`?state=empty`:** Força a renderização do componente **EmptyState** estilizado (ex: lista vazia de transações ou metas com botão de criação).
- **`?state=error`:** Força a renderização do estado de erro com botão de tentativa de reconexão ("Tentar novamente").

