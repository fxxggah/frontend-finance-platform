# Especificação Detalhada de Telas e Funcionalidades

Este documento estabelece as especificações completas de interface, regras de interação, dados necessários e validações para cada uma das telas do **FIN**.

---

## 1. Tela de Login (`/login`)

- **Objetivo:** Autenticação via Google One-Tap / OAuth Popup.
- **Layout:**
  - Fundo limpo `bg-bg` com dois blobs decorativos suaves em tons azul e violeta.
  - Card sólido centralizado (`bg-surface`, `rounded-3xl`, `shadow-card`, sem bordas agressivas).
  - Marca **FIN** acompanhada do subtítulo: *"Suas finanças, num só lugar"*.
  - Botão oficial do Google com texto **"Continuar com o Google"**, formato de pílula e moldura sólida com tokens do FIN. A largura acompanha o espaço interno do card via `ResizeObserver`; o botão é ampliado proporcionalmente para atingir 44px de altura e mantém o estilo oficial do SDK.
  - Nota de rodapé sobre privacidade e criptografia de ponta a ponta.
- **Comportamento:**
  - Integração com o Google Identity Services. Ao receber o `idToken`, envia para `POST /api/v1/auth/google`.
  - Em modo mock (`USE_MOCK = true`), o clique simula a criação da sessão e redireciona imediatamente para `/dashboard`.

---

## 2. Tela de Início / Dashboard (`/dashboard`)

A tela principal do usuário reúne visão consolidada, atalhos rápidos e métricas do período selecionado.

**Referência visual global:** o Início utiliza composição com Hero e seletor de período lado a lado a partir de 1280px, barra independente de ações rápidas, quatro indicadores, gráficos, movimentações recentes e metas. Em telas menores, os painéis se empilham e os atalhos usam duas colunas abaixo de 640px. Seus padrões foram extraídos para a UI compartilhada e aplicados a todas as áreas, conforme `design-system.md`, preservando dados e contratos existentes.

### 2.1 Cartão de Saldo Principal (Hero)
- **Visual:** Fundo gradiente `gradient-hero` (violeta para azul elétrico), bordas `rounded-3xl`.
- **Conteúdo:**
  - Título "Patrimônio Total" ou "Saldo Geral".
  - Valor do saldo com botão de alternância de visibilidade (ícone `Eye` / `EyeOff`), permitindo ocultar como `"R$ •••••"`.
  - Duas pílulas secundárias internas:
    - 🟢 "Receitas do mês": Exibe total de entradas.
    - 🔴 "Despesas do mês": Exibe total de saídas.
    - 💳 "Faturas a vencer": Total comprometido em cartões.

### 2.2 Pílula de Atalhos Rápidos (Quick Actions)
- **Visual:** Estilo vidro (`backdrop-blur-md`, `bg-surface/85`, `rounded-2xl`), abaixo do cartão Hero com espaçamento de 16px (`gap-4`), sem sobreposição ou margens negativas.
- **4 Ações Principais:**
  1. 🟢 **Nova receita:** Abre modal/sheet com tipo `INCOME` selecionado.
  2. 🔴 **Nova despesa:** Abre modal/sheet com tipo `EXPENSE` selecionado.
  3. 🔵 **Transferir:** Abre modal de transferência entre contas.
  4. 💳 **Pagar fatura:** Redireciona diretamente para a aba de cartões (`/cards`).

### 2.3 Cards de Indicadores (KPIs)
Grade com 4 cartões com sparklines e percentual comparativo com o período anterior:
1. **Receitas:** Total do período + variação % (`incomeChangePct`).
2. **Despesas:** Total do período + variação % (`expenseChangePct`).
3. **Saldo Líquido:** Diferença do período (`totalIncome - totalExpense`).
4. **Faturas em Aberto:** Valor total acumulado de despesas de cartão pendentes (`creditCardDebt`).

### 2.4 Gráfico de Fluxo de Caixa (Recharts)
- No período **Dia** (`period=DAY`), exibe barras agrupadas de Receitas vs. Despesas, como em Relatórios, com tooltip sem destaque cinza de fundo. A escolha considera o período selecionado, não a granularidade da API; os demais períodos mantêm o gráfico de áreas suaves.
- Gráfico de área suave comparando a evolução acumulada de Receitas vs. Despesas ao longo dos dias do mês.
- Card com o mesmo gradiente roxo, arcos decorativos e estilo do gráfico de Relatórios; receitas em branco, despesas em rosa e preenchimentos suaves. Eixos e legenda claros para leitura sobre o fundo roxo nos dois temas.
- Tooltip customizado formatado em BRL, com superfície sólida e texto adaptado ao tema.

### 2.5 Gráfico de Despesas por Categoria (Rosca / Donut)
- Gráfico em formato de rosca com o total de despesas centralizado no meio.
- Legenda lateral ou inferior com nome, cor, ícone (`CategoryIcon`), valor e percentual (`%`) de cada categoria.

### 2.6 Carrossel / Grid de Metas em Andamento
- Exibe as metas ativas da usuária com barra de progresso visual, percentual atingido e badge de estado em português:
  - `IN_PROGRESS`: "Em andamento" (Azul)
  - `WARNING`: "Atenção" (Laranja)
  - `ACHIEVED`: "Atingida" (Verde)
  - `EXCEEDED`: "Excedida" (Vermelho)

### 2.7 Transações Recentes
- Lista dos últimos 5 lançamentos com ícone da categoria, nome, data formatada, conta ou cartão utilizado e valor com sinal explícito (`+` ou `−`).

---

## 3. Tela de Transações (`/transactions`)

- **Estrutura por Abas:**
  - Aba 1: **Transações** (`?tab=transactions` ou padrão).
  - Aba 2: **Transferências** (`?tab=transfers`).

### 3.1 Filtros e Busca
- Barra de busca textual na descrição com *debounce* de 300 ms (`?q=`).
- Filtros por: Período, Tipo (`INCOME` / `EXPENSE`), Categoria, Conta ou Cartão de Crédito.
- Barra de totalizadores dinâmicos atualizados conforme os filtros selecionados (ex: *"Mostrando 14 transações: R$ 3.450,00 receitas \| R$ 1.200,00 despesas"*).

### 3.2 Visualização Adaptativa
- **Mobile:** Lista agrupada por dia (*"Hoje, 31 de out."*, *"Ontem, 30 de out."*).
- **Desktop:** Tabela de dados ordenável com colunas de Data, Descrição, Categoria, Origem/Destino e Valor.

### 3.3 Formulário de Cadastro e Edição (`/transactions/new` ou Modal)
- **Modal responsivo:** Cadastro e edição usam bottom sheet abaixo de 1024px e dialog centralizado a partir de 1024px (`lg`), com largura máxima de 512px, altura máxima de 90dvh e rolagem interna. A alça aparece apenas no mobile; redimensionar preserva os campos preenchidos.
- **Seleção Dinâmica:** Conta Bancária **OU** Cartão de Crédito.
  - Selecionar Cartão de Crédito força o tipo para `EXPENSE` (cartão não aceita receita).
  - Ao selecionar Cartão, habilita o seletor de parcelas (1x a 24x).
- **Simulador de Parcelas:**
  - Mostra prévia inteligente das parcelas (ex: `3x de R$ 200,00`).
  - Em divisões com dízima, ajusta os centavos restantes na última parcela.
  - Informa a competência da fatura prevista com base no dia de fechamento do cartão.

---

## 4. Tela de Contas Bancárias (`/accounts`)

- **Topo:** Card de destaque exibindo o Patrimônio Consolidado (`totalBalance`) e dívida em cartões.
- **Grade de Contas Ativas:**
  - Cada card exibe: Nome, Tipo (`BANK`, `CASH`, `DIGITAL_WALLET`), ícone customizado, cor e saldo atualizado.
  - Menu de ações (três pontos): "Editar conta", "Transferir desta conta", "Arquivar/Excluir".
- **Regra de Negócio Crítica:**
  - O sistema **bloqueia** a tentativa de arquivar ou excluir a **última conta ativa** do usuário, exibindo toast explicativo.
- **Seção de Contas Arquivadas:** Acordeão colapsável na base da página para visualizar e desarquivar contas antigas.

---

## 5. Módulo de Cartões de Crédito (`/cards`)

### 5.1 Visão Geral dos Cartões
- Renderização visual realista do cartão com cores personalizadas (sem logos de marcas terceiras).
- Barra de progresso de limite:
  - Limite Usado vs. Limite Disponível.
  - Alerta em vermelho caso o limite disponível seja negativo (estouro de limite).
- Dados de fechamento e vencimento: *"Fecha dia 10 • Vence dia 17"*.

### 5.2 Detalhe de Fatura (`/cards/[id]/invoices/[ym]`)
- **Seletor de Mês de Referência:** Navegação horizontal entre meses (`2026-09`, `2026-10`, `2026-11`).
- **Status da Fatura:**
  - `OPEN` (Aberta): Compras em andamento.
  - `CLOSED` (Fechada): Fechada aguardando pagamento.
  - `PARTIALLY_PAID` (Parcialmente Paga): Pago valor parcial.
  - `PAID` (Paga): Totalmente quitada.
  - `OVERDUE` (Vencida): Fechada e com data de vencimento ultrapassada.
- **Botão "Pagar Fatura":**
  - Disponível também para faturas `OPEN`, até o saldo devedor atual. Bloqueado quando não há saldo restante.
  - Pagamento antecipado não fecha a fatura: ela permanece `OPEN` até o fechamento e aceita novas compras.
  - Abre modal solicitando a Conta de Origem do pagamento, valor e data.

---

## 6. Módulo de Metas Financeiras (`/goals`)

Suporta 3 categorias de metas essenciais:
1. **Economia (`SAVINGS`):** Ex: "Reserva de Emergência" (R$ 30.000,00). Aceita aportes e retiradas manuais. Calcula o valor mensal sugerido (`monthlyNeeded`) caso possua data final estipulada.
2. **Ganho (`INCOME`):** Ex: "Faturamento Freelance" (R$ 5.000,00). Monitora automaticamente entradas vinculadas à categoria selecionada.
3. **Teto de Gasto (`EXPENSE`):** Ex: "Orçamento de Restaurantes" (R$ 800,00). Alerta com status `WARNING` ao atingir 80% do limite e `EXCEEDED` se ultrapassar 100%.

### Criação em Dois Passos:
- **Passo 1:** Seleção do tipo de meta com cartões explicativos ilustrados.
- **Passo 2:** Preenchimento de dados (Nome, valor alvo, datas, cor, ícone e categoria vinculada).

---

## 7. Módulo de Relatórios Analíticos (`/reports`)

- **Taxa de Poupança do Período:** Cálculo automático `((saldoLíquido / receitas) * 100)` com termômetro visual.
- **Evolução Comparativa:** Gráfico de barras agrupadas (Receitas vs. Despesas) quando o período selecionado é **Dia** (`period=DAY`); nos demais períodos, usa áreas suaves, do mesmo tipo usado no fluxo de caixa do Início. A escolha do tipo depende do período selecionado, não da granularidade retornada pela API. Mantém o card com gradiente roxo, receitas em branco e despesas em rosa.
- **Insights Financeiros Automáticos:** Card gerado por lógica pura (`lib/insights.ts`), trazendo dicas contextuais (ex.: *"Você gastou 15% menos em Alimentação este mês em relação a setembro"*).

---

## 8. Módulo de Categorias (`/categories`)

- Organização por abas: **Despesas** e **Receitas**.
- Criação e edição com seletores visuais de paleta de cores (hexadecimal) e grade de ícones do `lucide-react`.
- **Proteção de Integridade:** Bloqueio da edição do campo `type` caso a categoria já tenha transações atreladas.

---

## 9. Módulo de Simulações (`/simulations`)

- **Aviso Obrigatório:** Todas as telas de simulação exibem no topo o *disclaimer*:
  > *"Simulação ilustrativa, não é recomendação financeira."*
- **Calculadora de Investimentos (`/simulations/investment`):**
  - Inputs: Valor inicial, aporte mensal, taxa anual (%) e prazo em anos.
  - Resultados: Total investido do bolso, total recebido em juros, montante final e tabela/gráfico com evolução mês a mês.
- **Calculadora de Quitação de Dívidas (`/simulations/debt`):**
  - Inputs: Saldo devedor, taxa mensal de juros (%) e parcela mensal proposta.
  - Validação: Erro imediato se a parcela não cobrir os juros mensais (`parcela <= divida * taxa`).
  - Resultados: Meses para quitação, total pago, total em juros e tabela de amortização.

