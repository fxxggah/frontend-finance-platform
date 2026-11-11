import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { FileQuestion, Home } from 'lucide-react';

/**
 * Página 404 customizada do Next.js App Router.
 * Exibida automaticamente para rotas inexistentes.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-bg p-6">
      <Card variant="panel" className="mx-auto flex w-full max-w-lg flex-col items-center gap-6 p-6 text-center sm:p-10">
        {/* Ícone ilustrativo */}
        <div className="flex size-24 items-center justify-center rounded-3xl bg-primary-soft">
          <FileQuestion size={48} className="text-primary" aria-hidden="true" />
        </div>

        {/* Código de erro */}
        <p className="text-7xl font-black tabular-nums text-primary/20 leading-none select-none">
          404
        </p>

        {/* Mensagem */}
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-text">Página não encontrada</h1>
          <p className="text-sm leading-relaxed text-text-muted">
            A página que você está procurando não existe ou foi movida. Verifique o endereço ou
            volte para o início.
          </p>
        </div>

        {/* Botão de retorno */}
        <Link
          href="/dashboard"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-6 text-sm font-medium text-white shadow-sm transition-opacity duration-200 hover:opacity-90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 motion-reduce:transition-none"
        >
          <Home size={16} aria-hidden="true" />
          Voltar ao Início
        </Link>
      </Card>
    </div>
  );
}

