'use client';

import { CategoryIcon } from '@/components/icons/CategoryIcon';
import { cn } from '@/lib/utils';

export const PRESET_ICONS = [
  'landmark',
  'wallet',
  'credit-card',
  'smartphone',
  'piggy-bank',
  'shield',
  'target',
  'trending-up',
  'briefcase',
  'plane',
  'home',
  'car',
  'shopping-bag',
  'shopping-cart',
  'gamepad-2',
  'heart-pulse',
  'graduation-cap',
  'gift',
  'coffee',
  'sparkles',
];

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
  color?: string;
  className?: string;
}

export function IconPicker({ value, onChange, color, className }: IconPickerProps) {
  return (
    <div className={cn('grid grid-cols-[repeat(auto-fit,minmax(44px,1fr))] gap-2', className)}>
      {PRESET_ICONS.map((iconName) => {
        const isSelected = value === iconName;
        return (
          <button
            key={iconName}
            type="button"
            onClick={() => onChange(iconName)}
            aria-label={`Ícone ${iconName}`}
            aria-pressed={isSelected}
            className={cn(
              'flex size-11 items-center justify-center rounded-xl border transition-colors active:scale-95 motion-reduce:transition-none',
              isSelected
                ? 'border-primary bg-primary-soft text-primary ring-2 ring-primary ring-offset-1 ring-offset-surface'
                : 'border-border bg-surface hover:bg-surface-soft text-text-muted hover:text-text'
            )}
            style={isSelected && color ? { color, borderColor: color } : undefined}
          >
            <CategoryIcon name={iconName} size={20} />
          </button>
        );
      })}
    </div>
  );
}

