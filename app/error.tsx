'use client';

import Link from 'next/link';
import { AlertOctagon, RefreshCw, Home } from 'lucide-react';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Error Boundary global do Next.js App Router.
 * Captura erros de renderização na árvore de componentes filha.
 * DEVE ser um Client Component (precisa do botão reset()).
 */
export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <div className="flex min-h-svh items-center justify-center bg-bg p-6">
      <div className="mx-auto flex max-w-md flex-col items-center gap-6 text-center">
        {/* Ícone */}
        <div className="flex size-24 items-center justify-center rounded-3xl bg-expense-soft">
          <AlertOctagon size={48} className="text-expense" aria-hidden="true" />
        </div>

        {/* Mensagem principal */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-text">Ops! Algo deu errado</h1>
          <p className="text-sm leading-relaxed text-text-muted">
            Ocorreu um erro inesperado ao exibir esta página. Você pode tentar novamente ou
            retornar à tela inicial.
          </p>
        </div>

        {/* Detalhe técnico (somente em desenvolvimento) */}
        {process.env.NODE_ENV === 'development' && error?.message && (
          <div className="w-full rounded-2xl border border-expense/20 bg-expense-soft px-4 py-3 text-left">
            <p className="text-xs font-mono text-expense break-all">{error.message}</p>
            {error.digest && (
              <p className="mt-1 text-xs text-text-muted font-mono">digest: {error.digest}</p>
            )}
          </div>
        )}

        {/* Ações */}
        <div className="flex flex-col gap-3 w-full sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-6 text-sm font-medium text-white shadow-sm transition-opacity duration-200 hover:opacity-90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 motion-reduce:transition-none"
          >
            <RefreshCw size={16} aria-hidden="true" />
            Tentar novamente
          </button>

          <Link
            href="/dashboard"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-transparent px-6 text-sm font-medium text-text transition-colors duration-200 hover:bg-surface-soft active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 motion-reduce:transition-none"
          >
            <Home size={16} aria-hidden="true" />
            Ir ao Início
          </Link>
        </div>
      </div>
    </div>
  );
}

