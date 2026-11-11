'use client';

import { Sparkles, TrendingDown, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { FinancialInsight } from '@/lib/insights';

interface InsightsSectionProps {
  insights: FinancialInsight[];
  isLoading?: boolean;
}

const TYPE_CONFIG = {
  positive: {
    icon: CheckCircle2,
    badgeClass: 'bg-income-soft text-income',
    borderClass: 'hover:border-income/40',
  },
  negative: {
    icon: AlertCircle,
    badgeClass: 'bg-expense-soft text-expense',
    borderClass: 'hover:border-expense/40',
  },
  warning: {
    icon: AlertCircle,
    badgeClass: 'bg-warning-soft text-warning',
    borderClass: 'hover:border-warning/40',
  },
  neutral: {
    icon: Sparkles,
    badgeClass: 'bg-primary-soft text-primary',
    borderClass: 'hover:border-primary/40',
  },
};

export function InsightsSection({ insights, isLoading }: InsightsSectionProps) {
  if (isLoading || insights.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles size={18} className="text-primary" />
        <h2 className="text-base font-bold text-text">Insights Inteligentes do Período</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {insights.map((insight) => {
          const config = TYPE_CONFIG[insight.type] || TYPE_CONFIG.neutral;
          const Icon = config.icon;

          return (
            <Card
              key={insight.id}
              className={cn(
                'p-4 sm:p-5 flex flex-col justify-between space-y-3 transition-all hover:shadow-md border',
                config.borderClass
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-xl',
                    config.badgeClass
                  )}
                >
                  <Icon size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text">{insight.title}</h3>
                  <p className="mt-1 text-xs text-text-muted leading-relaxed">
                    {insight.description}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

