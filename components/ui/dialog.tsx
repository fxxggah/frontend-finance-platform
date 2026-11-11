'use client';

import {
  useRef,
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

interface DialogCtx {
  titleId: string;
  descriptionId: string;
  onClose: () => void;
}
const DialogContext = createContext<DialogCtx | null>(null);

function useDialogContext() {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('Dialog sub-component used outside <Dialog>');
  return ctx;
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Largura máxima do painel (default: `max-w-lg`) */
  maxWidth?: string;
}

/**
 * Modal acessível para desktop.
 * - Fecha com ESC ou clique no overlay.
 * - Foco preso enquanto aberto (focus-trap simplificado).
 * - Animação de entrada/saída ≤ 300 ms.
 */
export function Dialog({ open, onClose, children, maxWidth = 'max-w-lg' }: DialogProps) {
  const id = useId();
  const titleId = `${id}-title`;
  const descriptionId = `${id}-desc`;
  const panelRef = useRef<HTMLDivElement>(null);
  const portalTarget = usePortalTarget();

  useModalFocus(open && !!portalTarget, panelRef, onClose);

  if (!open || !portalTarget) return null;

  return createPortal(
    <DialogContext.Provider value={{ titleId, descriptionId, onClose }}>
      {/* Overlay */}
      <div
        className={cn(
          'fixed inset-0 z-50 flex items-center justify-center p-4',
          'bg-black/50',
          'animate-in fade-in duration-200 motion-reduce:animate-none',
        )}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        {/* Painel */}
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          className={cn(
            'relative z-10 max-h-[90dvh] overflow-y-auto w-full rounded-3xl outline-none',
            styles.glass,
            'shadow-[0_24px_64px_-16px_rgba(20,23,46,0.32)]',
            'animate-in zoom-in-95 slide-in-from-bottom-4 duration-250 motion-reduce:animate-none',
            maxWidth,
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </DialogContext.Provider>, portalTarget
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const { onClose } = useDialogContext();
  return (
    <div
      className={cn('flex items-start justify-between gap-3 px-6 pt-6 pb-2', className)}
      {...props}
    >
      {props.children}
      <button
        onClick={onClose}
        aria-label="Fechar"
        className={cn(
          'ml-auto -mt-1 flex size-11 items-center justify-center rounded-xl',
          'text-text-muted hover:bg-surface-soft hover:text-text',
          'transition-colors duration-150',
        )}
      >
        <X size={18} aria-hidden="true" />
      </button>
    </div>
  );
}

export function DialogTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  const { titleId } = useDialogContext();
  return (
    <h2
      id={titleId}
      className={cn('text-lg font-semibold text-text leading-tight', className)}
      {...props}
    />
  );
}

export function DialogDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  const { descriptionId } = useDialogContext();
  return (
    <p
      id={descriptionId}
      className={cn('text-sm text-text-muted', className)}
      {...props}
    />
  );
}

export function DialogBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-6 py-4', className)} {...props} />;
}

export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex flex-col-reverse gap-2 px-6 pb-6 pt-2 sm:flex-row sm:justify-end',
        className,
      )}
      {...props}
    />
  );
}

