'use client';

import { AlertTriangle } from 'lucide-react';
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  /** Callback executado quando o usuário confirma */
  onConfirm: () => void;
  title: string;
  /** Mensagem descrevendo o impacto da ação */
  description: string;
  /** Texto do botão de confirmação (padrão: "Confirmar") */
  confirmLabel?: string;
  /** Texto do botão de cancelamento (padrão: "Cancelar") */
  cancelLabel?: string;
  /** Estado de carregamento do botão de confirmação */
  isLoading?: boolean;
}

/**
 * Diálogo de confirmação para ações destrutivas.
 * Ex: excluir conta, categoria ou transação.
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  isLoading = false,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="max-w-md">
      <DialogHeader>
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-expense-soft"
          >
            <AlertTriangle size={20} className="text-expense" />
          </span>
          <DialogTitle>{title}</DialogTitle>
        </div>
      </DialogHeader>

      <DialogBody>
        <p className="text-sm text-text-muted leading-relaxed">{description}</p>
      </DialogBody>

      <DialogFooter>
        <Button variant="outline" size="md" onClick={onClose} disabled={isLoading}>
          {cancelLabel}
        </Button>
        <Button
          variant="danger"
          size="md"
          onClick={onConfirm}
          isLoading={isLoading}
          loadingText="Excluindo…"
        >
          {confirmLabel}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

