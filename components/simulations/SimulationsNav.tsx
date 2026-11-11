'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

const SIMULATION_TABS = [
  { href: '/simulations/investment', label: 'Investimentos' },
  { href: '/simulations/debt', label: 'Quitação de Dívidas' },
] as const;

/**
 * Barra de navegação entre os simuladores, com aba ativa destacada.
 */
export function SimulationsNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Simuladores disponíveis"
      className="mx-auto w-full max-w-[1440px]"
    >
      <div className="min-w-0">
        <div className="flex flex-wrap gap-1 rounded-2xl bg-surface-soft p-1 w-fit max-w-full">
          {SIMULATION_TABS.map((tab) => {
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-medium',
                  'transition-all duration-200 motion-reduce:transition-none',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                  isActive
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-text-muted hover:text-text',
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

