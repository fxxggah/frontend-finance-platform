'use client';

import {
  useRef,
  useCallback,
  useId,
  createContext,
  useContext,
  type ReactNode,
} from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { useModalFocus } from '@/hooks/use-modal-focus';
import { usePortalTarget } from '@/hooks/use-portal-target';
import styles from './surfaces.module.css';

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
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  /** Centraliza como dialog a partir de 1024px, mantendo o bottom sheet no mobile. */
  desktopDialog?: boolean;
  children: ReactNode;
}

/**
 * Bottom sheet para mobile.
 * - Desliza de baixo para cima.
 * - Cantos superiores `rounded-t-[2rem]`.
 * - Fecha com ESC ou clique no overlay.
 */
export function Sheet({ open, onClose, onOpenChange, title, desktopDialog = false, children }: SheetProps) {
  const id = useId();
  const titleId = `${id}-title`;
  const panelRef = useRef<HTMLDivElement>(null);
  const portalTarget = usePortalTarget();

  const handleClose = useCallback(() => {
    if (onClose) onClose();
    if (onOpenChange) onOpenChange(false);
  }, [onClose, onOpenChange]);

  useModalFocus(open && !!portalTarget, panelRef, handleClose);

  if (!open || !portalTarget) return null;

  return createPortal(
    <SheetContext.Provider value={{ titleId, onClose: handleClose }}>
      {/* Overlay */}
      <div
        className={cn(
          'fixed inset-0 z-50 flex items-end',
          desktopDialog && 'lg:items-center lg:justify-center lg:p-6',
          'bg-black/50',
          'animate-in fade-in duration-200 motion-reduce:animate-none',
        )}
        onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
      >
        {/* Painel */}
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
          aria-labelledby={titleId}
          className={cn(
            'relative z-10 mx-auto w-full max-w-3xl outline-none',
            styles.glass,
            'rounded-t-[2rem]',
            desktopDialog && 'lg:max-w-lg lg:rounded-2xl',
            'shadow-[0_-8px_40px_-8px_rgba(20,23,46,0.22)]',
            desktopDialog
              ? 'animate-in max-lg:slide-in-from-bottom lg:zoom-in-95 duration-200 motion-reduce:animate-none'
              : 'animate-in slide-in-from-bottom duration-300 motion-reduce:animate-none',
            'max-h-[90dvh] overflow-y-auto',
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle visual de arrastar */}
          <div className={cn('mx-auto mt-3 h-1 w-10 rounded-full bg-border', desktopDialog && 'lg:hidden')} aria-hidden="true" />
          {title && (
            <SheetHeader>
              <SheetTitle>{title}</SheetTitle>
            </SheetHeader>
          )}
          {title ? <SheetBody>{children}</SheetBody> : children}
        </div>
      </div>
    </SheetContext.Provider>, portalTarget
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
          'ml-auto flex size-11 items-center justify-center rounded-xl',
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

