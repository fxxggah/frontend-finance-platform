'use client';

import { useMutation } from '@tanstack/react-query';
import { simulateInvestment, simulateDebt } from '@/lib/api/endpoints/simulations';

export function useInvestmentSimulation() {
  return useMutation({ mutationFn: simulateInvestment });
}

export function useDebtSimulation() {
  return useMutation({ mutationFn: simulateDebt });
}
