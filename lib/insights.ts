import { formatMoney } from "@/lib/format/money";
import type { DashboardSummary, EvolutionResponse, ExpenseByCategory } from "@/types";

export interface FinancialInsight {
  id: string;
  title: string;
  description: string;
  type: "positive" | "negative" | "warning" | "neutral";
}

/**
 * Função pura que gera 3 insights concisos exclusivamente a partir dos dados do período.
 */
export function generateInsights(
  summary?: DashboardSummary | null,
  expensesByCategory: ExpenseByCategory[] = [],
  evolution?: EvolutionResponse | null
): FinancialInsight[] {
  const insights: FinancialInsight[] = [];

  // Insight 1: Variação de despesas vs período anterior
  if (summary?.previous?.expenseChangePct !== undefined && summary.previous.expenseChangePct !== null) {
    const pct = summary.previous.expenseChangePct;
    const absPct = Math.abs(pct).toFixed(1);
    if (pct < 0) {
      insights.push({
        id: "expense-variation",
        title: "Redução de gastos",
        description: `Suas despesas caíram ${absPct}% em relação ao período anterior. Excelente economia!`,
        type: "positive",
      });
    } else if (pct > 0) {
      insights.push({
        id: "expense-variation",
        title: "Aumento de despesas",
        description: `Suas despesas subiram ${absPct}% em relação ao período anterior. Vale revisar despesas variáveis.`,
        type: "warning",
      });
    } else {
      insights.push({
        id: "expense-variation",
        title: "Estabilidade de gastos",
        description: "Suas despesas mantiveram o mesmo patamar do período anterior.",
        type: "neutral",
      });
    }
  } else {
    insights.push({
      id: "expense-variation",
      title: "Controle financeiro",
      description: "Acompanhe seus lançamentos diários para manter o equilíbrio orçamentário.",
      type: "neutral",
    });
  }

  // Insight 2: Maior categoria de despesas
  if (expensesByCategory.length > 0) {
    const top = expensesByCategory[0];
    insights.push({
      id: "top-category",
      title: `Maior concentração: ${top.name}`,
      description: `${top.name} representa ${top.percentage.toFixed(1)}% do seu consumo no período (${formatMoney(top.total)}).`,
      type: "neutral",
    });
  } else {
    insights.push({
      id: "top-category",
      title: "Sem despesas registradas",
      description: "Nenhuma categoria de despesa acumulada no período selecionado.",
      type: "neutral",
    });
  }

  // Insight 3: Pico de despesas da série temporal
  const points = evolution?.points ?? [];
  if (points.length > 0) {
    let peak = points[0];
    for (const p of points) {
      if (p.expense > peak.expense) {
        peak = p;
      }
    }

    if (peak.expense > 0) {
      insights.push({
        id: "peak-day",
        title: `Pico em ${peak.label}`,
        description: `O maior volume de saída ocorreu em ${peak.label}, totalizando ${formatMoney(peak.expense)}.`,
        type: "warning",
      });
    } else {
      insights.push({
        id: "peak-day",
        title: "Sem saídas atípicas",
        description: "Nenhum pico relevante de gastos registrado neste intervalo de tempo.",
        type: "positive",
      });
    }
  } else {
    insights.push({
      id: "peak-day",
      title: "Evolução do período",
      description: "Monitore os dias com mais saídas para antecipar períodos de maior pressão.",
      type: "neutral",
    });
  }

  return insights.slice(0, 3);
}

