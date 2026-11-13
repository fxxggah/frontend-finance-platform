import { type ReactNode } from 'react';
import { SimulationState } from '@/components/simulations/SimulationState';

interface SimulationsLayoutProps {
  children: ReactNode;
}

/**
 * Layout compartilhado do módulo de Simulações.
 * Aplica os estados de desenvolvimento aos simuladores.
 */
export default function SimulationsLayout({ children }: SimulationsLayoutProps) {
  return (
    <div className="flex flex-col gap-4">
      <SimulationState>{children}</SimulationState>
    </div>
  );
}
