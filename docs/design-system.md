# Design System e Estilização

Este documento padroniza a linguagem visual do **FIN**, detalhando a configuração do Tailwind CSS v4, tokens de cores, raios de curvatura, sombras, formatação de valores, acessibilidade e catálogo de ícones.

---

## 1. Princípios Visuais & Identidade

- **Tema Padrão:** Tema **CLARO suave** (não branco puro estourado), com paleta elegante baseada em violeta e azul profundo.
- **Tema Escuro:** Alternável via atributo `data-theme="dark"` no elemento `<html>`, com preferência salva em `localStorage` e carregada via script inline para evitar FOUC (*flash of unstyled content*).
- **Gradiente de marca:** `bg-gradient-hero` usa um gradiente fixo definido em `@theme`, idêntico nos temas claro e escuro; o cartão Hero e o botão central da navegação usam essa classe.
- **Superfícies:** Linguagem visual aprovada no Início, aplicada ao app inteiro: conteúdo sólido, bordas sutis, tipografia com peso moderado e reflexos estáticos. Desfoque de fundo restrito às barras compactas de ações e à navegação inferior mobile.
- **Tipografia:** Fonte **Inter** (`next/font/google`), com uso mandatário de números tabulares (`tabular-nums`) para todos os valores numéricos e monetários.

---

## 2. Tokens de Design (Tailwind CSS v4 `@theme`)

Configurados em `app/globals.css`. **Nunca use valores hexadecimais arbitrários nos componentes.** Utilize sempre as variáveis semânticas.

### Tabela de Tokens de Cores

| Token CSS | Variável Tailwind | Modo Claro | Modo Escuro | Finalidade / Semântica |
|---|---|---|---|---|
| `--color-bg` | `bg-bg` | `#EDEFFA` | `#0B0E24` | Fundo principal da aplicação |
| `--color-surface` | `bg-surface` | `#FFFFFF` | `#141834` | Fundo de cartões, modais e containers |
| `--color-surface-soft` | `bg-surface-soft` | `#F6F7FD` | `#1B2043` | Superfícies secundárias, inputs e hover |
| `--color-border` | `border-border` | `#E3E6F5` | `rgba(255,255,255,0.08)` | Bordas e divisores sutis |
| `--color-text` | `text-text` | `#14172E` | `#F4F5FF` | Texto principal com alto contraste |
| `--color-text-muted` | `text-text-muted` | `#6B7194` | `#9AA0C7` | Legendas, placeholders e textos de apoio |
| `--color-primary` | `bg-primary`, `text-primary` | `#5B3DF5` | `#7C62FF` | Cor da marca, botões de ação e estados ativos |
| `--color-primary-soft` | `bg-primary-soft` | `#EFEAFF` | `#262354` | Badges primárias e fundos de destaque suave |
| `--color-accent` | `bg-accent` | `#4F7BFF` | `#6B8EFF` | Cor secundária de destaque |
| `--color-income` | `text-income` | `#0E9F6E` | `#31C48D` | Receitas, lucros, metas atingidas |
| `--color-income-soft` | `bg-income-soft` | `#E6F8F0` | `#0E3D30` | Fundo de badges e tags de receitas |
| `--color-expense` | `text-expense` | `#E11D48` | `#F05252` | Despesas, débitos, estouro de orçamento |
| `--color-expense-soft`| `bg-expense-soft` | `#FFE9EE` | `#451622` | Fundo de badges de despesas |
| `--color-warning` | `text-warning` | `#F59E0B` | `#FBBF24` | Alertas, metas em atenção |
| `--color-warning-soft`| `bg-warning-soft` | `#FFF3DD` | `#47320D` | Fundo de alertas |
| `--color-sidebar` | `bg-sidebar` | `#0E1230` | `#0E1230` | Fundo fixo da barra lateral (Dark Navy) |
| `--background-image-gradient-hero` | `bg-gradient-hero` | `linear-gradient(135deg, #3B1FA8 0%, #5B3DF5 55%, #4F7BFF 100%)` | Mesmo gradiente nos dois temas; cartão principal de saldo (Hero) |

---

## 3. Raios de Borda e Sombras

Para manter a consistência orgânica e suave:

- **Cartões Hero / Containers Grandes:** `rounded-3xl` (`24px` a `32px`).
- **Cartões Comuns, Modais, Bottom Sheets:** `rounded-2xl` (`16px`).
- **Botões, Inputs, Badges:** `rounded-xl` ou `rounded-2xl`.
- **Pílulas de Status e Filtros:** `rounded-full`.
- **Sombra Padrão de Cartões:** `shadow-[0_8px_30px_-12px_rgba(20,23,46,0.18)]` (ou token configurado `shadow-card`).

---

## 4. Superfícies e liquid glass

A linguagem aprovada na dashboard é a referência global. A implementação compartilhada fica em `components/ui/surfaces.module.css`; o CSS Module do dashboard contém apenas a altura específica do seu Hero.

| Variante de `Card` | Uso |
|---|---|
| `solid` | Listas, conteúdo e formulários: fundo opaco, borda sutil, sem sombra elevada |
| `panel` | Painéis com reflexo estático, incluindo resumos, login e modais; fundo sólido, sem blur |
| `metric` | Indicadores com borda e realce interno discreto |
| `chart` | Gráficos com padding, largura mínima zero e tipografia definida pelo componente |
| `brand` | Resumos de destaque com gradiente fixo e arcos decorativos idênticos nos dois temas |
| `glass` | Apenas barras compactas de ações; blur de 12px a partir de 640px |

`PageContainer`, `PageHeader`, `SectionHeader` e `MetricCard` padronizam a composição. Páginas usam largura máxima de 1440px; formulários independentes e Configurações, 768px. O shell fornece o padding externo, evitando espaçamento duplicado nas páginas. A sidebar permanece escura nos dois temas.

Os tokens derivados `--glass-edge`, `--surface-reflection` e `--shadow-panel` referenciam a paleta existente. Cores base, fonte e raios não foram alterados. Regras universais de borda e foco ficam em `@layer base`, permitindo sobrescrita local sem `!important`.

Somente barras compactas e a BottomNav usam `backdrop-filter`. Barras de ações ficam sólidas abaixo de 640px; a BottomNav mantém o vidro e respeita a área segura do dispositivo. Ambas oferecem fallback sólido sem suporte ao filtro ou com `prefers-reduced-transparency: reduce`. Não aplicar blur em sidebar, Topbar, gráficos, formulários ou overlays de tela inteira. Reflexos e arcos usam gradientes e sombras estáticos, sem eventos de mouse ou filtros SVG.

Transições novas são de até 200ms e respeitam `prefers-reduced-motion`. Controles interativos têm área mínima de 44px, foco visível e indicação textual de estado. Dialogs e sheets contêm o foco, fecham com Escape e restauram o foco ao acionador quando ele continua montado.

Dialogs e sheets usam portal no `document.body` após a hidratação, evitando que o contexto visual das páginas prenda o overlay abaixo da Topbar ou BottomNav. O alvo do portal tem snapshot SSR estável; a camada estática das páginas continua sem providers adicionais.

### Validação visual local

Com o app rodando e um Chrome headless isolado com depuração na porta 9334, executar `node scripts/design-smoke.cjs`. O script intercepta chamadas ao backend com fixtures de `lib/mock-data.ts`, rejeita mutações com ProblemDetail de teste e grava capturas/relatório na pasta temporária `fin-design-review`. Não executa operações em dados reais. `QA_BASE_URL`, `QA_CDP_URL` e `QA_WIDTHS` permitem selecionar a instância e as larguras. O build e os testes de contrato continuam sendo `pnpm build` e `pnpm test:api`.

---

## 5. Formatação Unificada de Moeda e Datas (`lib/format/`)

Todos os valores monetários e temporais devem ser formatados via funções utilitárias unificadas:

### 5.1 Moeda (`lib/format/money.ts`)
```typescript
/**
 * Formata um valor numérico para o padrão monetário BRL com classes tabulares
 * @example formatMoney(1234.56) => "R$ 1.234,56"
 * @example formatMoney(1234.56, { showSign: true }) => "+ R$ 1.234,56"
 */
export function formatMoney(
  value: number,
  options?: { showSign?: boolean; signDisplay?: 'always' | 'auto' | 'never' }
): string {
  const formatted = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(value));

  if (options?.showSign) {
    const sign = value > 0 ? '+ ' : value < 0 ? '− ' : '';
    return `${sign}${formatted}`;
  }

  return value < 0 ? `− ${formatted}` : formatted;
}
```

### 5.2 Datas (`lib/format/date.ts`)
- **Data por extenso:** `"31 de outubro de 2026"`
- **Data curta:** `"31/10/2026"` ou `"31 de out."`
- **Mês e ano:** `"Outubro de 2026"` ou `"out/2026"`
- **Competência de fatura:** `"2026-10"` -> `"Outubro/2026"`

---

## 6. Acessibilidade (a11y)

1. **Informação Nunca Exclusiva por Cor:**
   - Despesas sempre acompanham o sinal negativo `−` ou tag textual "Despesa".
   - Receitas sempre acompanham o sinal positivo `+` ou tag textual "Receita".
2. **Contraste de Cores:** Mínimo de 4.5:1 para textos normais e 3:1 para elementos de interface e botões.
3. **Áreas de Toque Móveis:** Mínimo de `44px × 44px` para botões e links clicáveis em telas touch.
4. **Respeito a Movimento Reduzido:** Transições limitadas a `200ms - 300ms`, condicionadas à media query `motion-reduce:transition-none`.

---

## 7. Catálogo e Mapeamento de Ícones (`components/icons/CategoryIcon.tsx`)

A aplicação utiliza exclusivamente ícones da biblioteca `lucide-react`. O componente `CategoryIcon` mapeia as chaves cadastradas no backend:

```typescript
import {
  Utensils, Home, Car, Film, Briefcase, HeartPulse, GraduationCap,
  ShoppingBag, Landmark, Wallet, Smartphone, ShieldCheck, Plane,
  HelpCircle, CreditCard, Sparkles, Building2, Ticket
} from 'lucide-react';

const ICON_MAP = {
  'utensils': Utensils,
  'home': Home,
  'car': Car,
  'film': Film,
  'briefcase': Briefcase,
  'heart-pulse': HeartPulse,
  'graduation-cap': GraduationCap,
  'shopping-bag': ShoppingBag,
  'landmark': Landmark,
  'wallet': Wallet,
  'smartphone': Smartphone,
  'shield-check': ShieldCheck,
  'plane': Plane,
  'credit-card': CreditCard,
  'sparkles': Sparkles,
  'building-2': Building2,
  'ticket': Ticket,
} as const;

export function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const IconComponent = ICON_MAP[name as keyof typeof ICON_MAP] || HelpCircle;
  return <IconComponent className={className} />;
}
```

