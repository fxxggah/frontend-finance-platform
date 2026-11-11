/**
 * Funções puras de cálculo financeiro para o módulo de simulações.
 * Sem efeitos colaterais, sem dependências de UI.
 */

import type { InvestmentResult, DebtResult } from '@/types';

// ─── Simulador de Investimentos ───────────────────────────────────────────────

export interface InvestmentParams {
  /** Valor inicial aportado (≥ 0) */
  initialAmount: number;
  /** Aporte mensal recorrente (≥ 0) */
  monthlyContribution: number;
  /** Rentabilidade anual em % (0 a 100) */
  annualRate: number;
  /** Prazo em anos (1 a 50) */
  years: number;
}

/**
 * Calcula a evolução de um investimento com aportes mensais e juros compostos.
 * Fórmula: M(n) = M(n-1) * (1 + r_mensal) + aporte_mensal
 */
export function calculateInvestment(params: InvestmentParams): InvestmentResult {
  const { initialAmount, monthlyContribution, annualRate, years } = params;

  const monthlyRate = annualRate / 100 / 12;
  const totalMonths = years * 12;

  const monthlyBreakdown: InvestmentResult['monthlyBreakdown'] = [];
  let balance = initialAmount;
  let totalInvested = initialAmount;

  for (let month = 1; month <= totalMonths; month++) {
    const interestThisMonth = balance * monthlyRate;
    balance = balance + interestThisMonth + monthlyContribution;
    totalInvested += monthlyContribution;

    monthlyBreakdown.push({
      month,
      invested: parseFloat(totalInvested.toFixed(2)),
      interest: parseFloat((balance - totalInvested).toFixed(2)),
      balance: parseFloat(balance.toFixed(2)),
    });
  }

  const finalAmount = parseFloat(balance.toFixed(2));
  const totalInterest = parseFloat((finalAmount - totalInvested).toFixed(2));

  return {
    totalInvested: parseFloat(totalInvested.toFixed(2)),
    totalInterest,
    finalAmount,
    monthlyBreakdown,
  };
}

// ─── Simulador de Quitação de Dívidas ─────────────────────────────────────────

export interface DebtParams {
  /** Saldo devedor atual (> 0) */
  debtAmount: number;
  /** Taxa de juros mensal em % (> 0) */
  monthlyInterestRate: number;
  /** Valor da parcela mensal proposta (> juros do primeiro mês) */
  monthlyPayment: number;
}

export class InsufficientPaymentError extends Error {
  constructor(minPayment: number) {
    super(
      `A parcela deve ser maior que os juros do primeiro mês (mínimo de R$ ${minPayment.toFixed(2)}).`,
    );
    this.name = 'InsufficientPaymentError';
  }
}

/**
 * Calcula o cronograma de amortização de uma dívida com SAC simplificado.
 * @throws {InsufficientPaymentError} Se a parcela não cobrir os juros mensais.
 */
export function calculateDebtPayoff(params: DebtParams): DebtResult {
  const { debtAmount, monthlyInterestRate, monthlyPayment } = params;

  const rate = monthlyInterestRate / 100;
  const firstMonthInterest = debtAmount * rate;

  if (monthlyPayment <= firstMonthInterest) {
    throw new InsufficientPaymentError(firstMonthInterest);
  }

  const schedule: DebtResult['schedule'] = [];
  let balance = debtAmount;
  let month = 0;
  const MAX_MONTHS = 1200; // proteção contra loops infinitos (100 anos)

  while (balance > 0.005 && month < MAX_MONTHS) {
    month++;
    const interest = parseFloat((balance * rate).toFixed(2));
    const payment = balance + interest < monthlyPayment ? balance + interest : monthlyPayment;
    const principal = parseFloat((payment - interest).toFixed(2));
    balance = parseFloat((balance - principal).toFixed(2));

    schedule.push({
      month,
      payment: parseFloat(payment.toFixed(2)),
      interest,
      principal,
      balance: Math.max(0, balance),
    });
  }

  const totalPaid = parseFloat(schedule.reduce((acc, s) => acc + s.payment, 0).toFixed(2));
  const totalInterest = parseFloat((totalPaid - debtAmount).toFixed(2));

  return {
    months: month,
    totalPaid,
    totalInterest,
    schedule,
  };
}

