import { apiFetch } from '@/lib/api/client';
import { USE_MOCK } from '@/lib/config';
import type { InvestmentSimulationRequest, DebtSimulationRequest, InvestmentSimulationResponse, DebtSimulationResponse, InvestmentResult, DebtResult } from '@/types';

export async function simulateInvestment(data: InvestmentSimulationRequest): Promise<InvestmentResult> {
  if (USE_MOCK) return (await import('@/lib/simulations')).calculateInvestment(data);
  const response = await apiFetch<InvestmentSimulationResponse>('/simulations/investment', {
    method: 'POST', body: JSON.stringify(data),
  });
  return {
    totalInvested: response.totalInvested,
    totalInterest: response.totalInterest,
    finalAmount: response.finalAmount,
    monthlyBreakdown: response.monthlyBreakdown.map(item => ({
      month: item.month, invested: item.currentInvested,
      interest: item.interestEarned, balance: item.totalBalance,
    })),
  };
}

export async function simulateDebt(data: DebtSimulationRequest): Promise<DebtResult> {
  if (USE_MOCK) return (await import('@/lib/simulations')).calculateDebtPayoff({
    debtAmount: data.debtAmount, monthlyInterestRate: data.monthlyRate, monthlyPayment: data.monthlyPayment,
  });
  const response = await apiFetch<DebtSimulationResponse>('/simulations/debt-payoff', {
    method: 'POST', body: JSON.stringify(data),
  });
  return {
    months: response.months, totalPaid: response.totalPaid, totalInterest: response.totalInterest,
    schedule: response.schedule.map(item => ({
      month: item.month, payment: item.paymentAmount, interest: item.interestPaid,
      principal: item.principalPaid, balance: item.remainingBalance,
    })),
  };
}
