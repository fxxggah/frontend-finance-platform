"use client";

import { ArrowRight, Loader2, LogOut, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import styles from "@/components/layout/auth.module.css";

interface SessionLoadingProps {
  signingOut: boolean;
  complete: boolean;
}

export function SessionLoading({ signingOut, complete }: SessionLoadingProps) {
  const StatusIcon = complete ? ArrowRight : signingOut ? LogOut : ShieldCheck;

  return (
    <main className={`${styles.layout} flex min-h-svh items-center justify-center px-4 py-8 text-text sm:px-8`}>
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-2.5" aria-label="FIN">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-gradient-hero" aria-hidden="true">
            <span className="size-4 rotate-45 rounded-sm bg-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight">FIN</span>
        </div>

        <Card variant="panel" className="overflow-hidden">
          <div className="h-1.5 bg-gradient-hero" aria-hidden="true" />
          <div className="p-6 sm:p-8">
            <div className="mb-6 flex size-14 items-center justify-center rounded-2xl border border-primary/15 bg-primary-soft text-primary">
              <StatusIcon className="size-6" aria-hidden="true" />
            </div>

            <div role="status" aria-live="polite" aria-atomic="true">
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                {signingOut ? "Encerrando sessão..." : "Carregando sessão..."}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">
                {complete
                  ? "Tudo pronto. Redirecionando você."
                  : signingOut
                    ? "Estamos encerrando seu acesso com segurança."
                    : "Estamos validando seu acesso para abrir seu espaço financeiro."}
              </p>
            </div>

            {!complete && (
              <div className="mt-6 flex items-center gap-2 text-xs font-medium text-text-muted">
                <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                Aguarde um instante
              </div>
            )}
          </div>
        </Card>

        <p className="mt-6 text-center text-xs leading-relaxed text-text-muted">
          {signingOut ? "Até logo. Seu FIN continua aqui para você." : "Suas finanças, num só lugar."}
        </p>
      </div>
    </main>
  );
}
