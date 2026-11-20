import Link from "next/link";
import type { ReactNode } from "react";

export default function InstitutionalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-bg px-5 py-8 text-text sm:px-8">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <Link href="/sobre" className="text-xl font-bold">FIN</Link>
          <Link href="/login" className="rounded-xl border border-border bg-surface px-4 py-2 text-sm font-medium">Entrar</Link>
        </header>
        <main className="space-y-5 rounded-3xl border border-border bg-surface p-6 text-sm leading-relaxed sm:p-10">
          {children}
        </main>
        <nav aria-label="Informações do FIN" className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm text-text-muted">
          <Link className="underline" href="/sobre">Sobre</Link>
          <Link className="underline" href="/termos">Termos de uso</Link>
          <Link className="underline" href="/privacidade">Privacidade</Link>
        </nav>
      </div>
    </div>
  );
}
