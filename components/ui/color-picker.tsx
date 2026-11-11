'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export const PRESET_COLORS = [
  '#5B3DF5', // Violeta Marca
  '#4F7BFF', // Azul Elétrico
  '#0E9F6E', // Verde Floresta
  '#10B981', // Verde Esmeralda
  '#F59E0B', // Âmbar
  '#F97316', // Laranja
  '#E11D48', // Vermelho Rubro
  '#EC4899', // Rosa
  '#820AD1', // Roxo Profundo
  '#111827', // Grafite Noturno
  '#64748B', // Cinza Ardósia
  '#06B6D4', // Ciano
];

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  className?: string;
}

export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
  return (
    <div className={cn('flex flex-wrap gap-2.5', className)}>
      {PRESET_COLORS.map((c) => {
        const isSelected = value.toLowerCase() === c.toLowerCase();
        return (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            style={{ backgroundColor: c }}
            aria-label={`Cor ${c}`}
            className={cn(
              'size-8 rounded-full transition-transform active:scale-95 flex items-center justify-center text-white shadow-sm',
              isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-surface scale-110' : 'hover:scale-105'
            )}
          >
            {isSelected && <Check size={14} className="drop-shadow" />}
          </button>
        );
      })}
    </div>
  );
}

