'use client';

import {
  useEffect,
  useRef,
  useId,
  createContext,
  useContext,
  useCallback,
  type ReactNode,
} from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Context ──────────────────────────────────────────────────────────────────

interface SheetCtx {
  titleId: string;
  onClose: () => void;
}
const SheetContext = createContext<SheetCtx | null>(null);

function useSheetContext() {
  const ctx = useContext(SheetContext);
  if (!ctx) throw new Error('Sheet sub-component used outside <Sheet>');
  return ctx;
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Bottom sheet para mobile.
 * - Desliza de baixo para cima.
 * - Cantos superiores `rounded-t-[2rem]`.
 * - Fecha com ESC ou clique no overlay.
 */
export function Sheet({ open, onClose, children }: SheetProps) {
  const id = useId();
  const titleId = `${id}-title`;

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <SheetContext.Provider value={{ titleId, onClose }}>
      {/* Overlay */}
      <div
        className={cn(
          'fixed inset-0 z-50 flex items-end',
          'bg-black/50 backdrop-blur-sm',
          'animate-in fade-in duration-200 motion-reduce:animate-none',
        )}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        aria-hidden="true"
      >
        {/* Painel */}
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className={cn(
            'relative z-10 w-full bg-surface',
            'rounded-t-[2rem]',
            'shadow-[0_-8px_40px_-8px_rgba(20,23,46,0.22)]',
            'animate-in slide-in-from-bottom duration-300 motion-reduce:animate-none',
            'max-h-[90dvh] overflow-y-auto',
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle visual de arrastar */}
          <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-border" aria-hidden="true" />
          {children}
        </div>
      </div>
    </SheetContext.Provider>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

export function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const { onClose } = useSheetContext();
  return (
    <div
      className={cn('flex items-start justify-between gap-3 px-5 pt-4 pb-2', className)}
      {...props}
    >
      {props.children}
      <button
        onClick={onClose}
        aria-label="Fechar"
        className={cn(
          'ml-auto flex size-8 items-center justify-center rounded-xl',
          'text-text-muted hover:bg-surface-soft hover:text-text',
          'transition-colors duration-150',
        )}
      >
        <X size={18} aria-hidden="true" />
      </button>
    </div>
  );
}

export function SheetTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  const { titleId } = useSheetContext();
  return (
    <h2
      id={titleId}
      className={cn('text-base font-semibold text-text', className)}
      {...props}
    />
  );
}

export function SheetBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-5 py-4', className)} {...props} />;
}

export function SheetFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 px-5 pb-6 pt-2',
        className,
      )}
      {...props}
    />
  );
}

