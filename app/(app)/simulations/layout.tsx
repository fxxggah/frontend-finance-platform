import { type ReactNode } from 'react';
import { SimulationsNav } from '@/components/simulations/SimulationsNav';

interface SimulationsLayoutProps {
  children: ReactNode;
}

/**
 * Layout compartilhado do módulo de Simulações.
 * Renderiza a navegação por abas entre os simuladores.
 */
export default function SimulationsLayout({ children }: SimulationsLayoutProps) {
  return (
    <div className="flex flex-col gap-4">
      <SimulationsNav />
      {children}
    </div>
  );
}
