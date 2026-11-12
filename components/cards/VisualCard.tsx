'use client';

import { CategoryIcon } from '@/components/icons/CategoryIcon';
import { cn } from '@/lib/utils';
import type { CreditCard } from '@/types';

interface VisualCardProps {
  card: Pick<CreditCard, 'name' | 'color' | 'icon'>;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function VisualCard({ card, className, size = 'md' }: VisualCardProps) {
  const baseColor = card.color || '#5B3DF5';

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-3xl text-white shadow-lg transition-transform duration-200 select-none flex flex-col justify-between',
        size === 'sm' && 'h-36 p-4',
        size === 'md' && 'h-48 p-6',
        size === 'lg' && 'h-56 p-7',
        'lg:mx-auto lg:aspect-[1.586/1] lg:h-auto lg:w-full lg:max-w-sm lg:shrink-0',
        className
      )}
      style={{
        background: `linear-gradient(135deg, ${baseColor} 0%, ${baseColor}dd 45%, #0B0E24 100%)`,
      }}
    >
      {/* Textura decorativa suave */}
      <div
        className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-white/10 blur-xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -left-10 -bottom-10 size-40 rounded-full bg-black/20 blur-xl"
        aria-hidden="true"
      />

      {/* Topo do cartão: Ícone e chip */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex size-11 items-center justify-center rounded-xl bg-white/20">
          <CategoryIcon name={card.icon} size={20} className="text-white" />
        </div>

        {/* Chip visual estilizado */}
        <div
          className="size-8 rounded-lg bg-amber-300/80 border border-amber-200/50 shadow-inner flex flex-col justify-around p-1 opacity-80"
          aria-hidden="true"
        >
          <div className="h-0.5 bg-amber-600/40 rounded-full w-full" />
          <div className="h-0.5 bg-amber-600/40 rounded-full w-3/4" />
        </div>
      </div>

      {/* Meio: Dígitos mascarados */}
      <div
        className="relative z-10 tracking-widest font-mono text-sm sm:text-base text-white/90"
        aria-hidden="true"
      >
        <span>•••• •••• •••• ••••</span>
      </div>

      {/* Base: Nome do titular / cartão */}
      <div className="relative z-10 flex items-end justify-between">
        <div className="min-w-0 pr-2">
          <p className="text-[10px] uppercase tracking-wider text-white/70">Cartão de Crédito</p>
          <p className="truncate text-sm sm:text-base font-semibold tracking-tight text-white drop-shadow-sm">
            {card.name}
          </p>
        </div>
        <div className="flex gap-1.5 opacity-80" aria-hidden="true">
          <div className="size-5 rounded-full bg-white/40" />
          <div className="size-5 -ml-3 rounded-full bg-white/25" />
        </div>
      </div>
    </div>
  );
}

