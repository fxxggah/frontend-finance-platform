'use client';

import {
  createContext,
  useContext,
  useState,
  useId,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/utils';

// ─── Context ──────────────────────────────────────────────────────────────────

interface TabsCtx {
  value: string;
  onChange: (value: string) => void;
  listId: string;
}

const TabsContext = createContext<TabsCtx | null>(null);

function useTabsContext() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('Tabs sub-component used outside <Tabs>');
  return ctx;
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export interface TabsProps {
  /** Aba selecionada (valor controlado) */
  value: string;
  /** Callback ao mudar de aba */
  onValueChange: (value: string) => void;
  children: ReactNode;
  className?: string;
}

export function Tabs({ value, onValueChange, children, className }: TabsProps) {
  const listId = useId();
  return (
    <TabsContext.Provider value={{ value, onChange: onValueChange, listId }}>
      <div className={cn('flex flex-col', className)}>{children}</div>
    </TabsContext.Provider>
  );
}

// ─── List ─────────────────────────────────────────────────────────────────────

export interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {
  /** `'pill'` = fundo surface-soft com pílula deslizante (padrão); `'underline'` = linha inferior */
  variant?: 'pill' | 'underline';
}

export function TabsList({ className, variant = 'pill', children, ...props }: TabsListProps) {
  const { listId } = useTabsContext();
  return (
    <div
      id={listId}
      role="tablist"
      className={cn(
        'flex gap-1',
        variant === 'pill' && 'rounded-2xl bg-surface-soft p-1',
        variant === 'underline' && 'border-b border-border',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// ─── Trigger ─────────────────────────────────────────────────────────────────

export interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  variant?: 'pill' | 'underline';
}

export function TabsTrigger({
  className,
  value,
  variant = 'pill',
  children,
  ...props
}: TabsTriggerProps) {
  const { value: selected, onChange, listId } = useTabsContext();
  const isActive = selected === value;

  return (
    <button
      role="tab"
      type="button"
      aria-selected={isActive}
      aria-controls={`panel-${value}`}
      id={`tab-${listId}-${value}`}
      tabIndex={isActive ? 0 : -1}
      onClick={() => onChange(value)}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 px-4 text-sm font-medium',
        'h-9 min-w-[80px] rounded-xl',
        'transition-all duration-200 motion-reduce:transition-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
        // pill variant
        variant === 'pill' && [
          isActive
            ? 'bg-surface text-text shadow-sm'
            : 'text-text-muted hover:text-text',
        ],
        // underline variant
        variant === 'underline' && [
          'rounded-none border-b-2 pb-2',
          isActive
            ? 'border-primary text-primary'
            : 'border-transparent text-text-muted hover:text-text hover:border-border',
        ],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

// ─── Content ─────────────────────────────────────────────────────────────────

export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export function TabsContent({ value, className, children, ...props }: TabsContentProps) {
  const { value: selected, listId } = useTabsContext();
  if (selected !== value) return null;
  return (
    <div
      role="tabpanel"
      id={`panel-${value}`}
      aria-labelledby={`tab-${listId}-${value}`}
      tabIndex={0}
      className={cn('focus:outline-none', className)}
      {...props}
    >
      {children}
    </div>
  );
}

