'use client';

import { useSearchParams } from 'next/navigation';

export type DevState = 'loading' | 'empty' | 'error' | null;

/**
 * Hook que lê o parâmetro ?state=loading|empty|error da URL para simular estados visuais.
 * Usado em TODAS as telas para validar skeletons, estados vazios e de erro sem precisar
 * de dados reais.
 */
export function useDevState(): DevState {
  const searchParams = useSearchParams();
  const state = searchParams.get('state');
  if (state === 'loading' || state === 'empty' || state === 'error') {
    return state;
  }
  return null;
}
