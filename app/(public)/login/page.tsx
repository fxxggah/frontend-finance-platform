"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { loginWithGoogle } from "@/lib/api/endpoints/auth";
import { USE_MOCK } from "@/lib/config";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/dashboard";

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /**
   * Dispara o fluxo de autenticação.
   *
   * NOTA TÉCNICA (PRODUÇÃO):
   * -------------------------------------------------------------
   * Em produção, carregue o script oficial do Google Identity Services:
   * `<Script src="https://accounts.google.com/gsi/client" async defer />`
   * Em seguida, inicialize a biblioteca com:
   * ```ts
   * window.google.accounts.id.initialize({
   *   client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
   *   callback: async (response) => {
   *     // response.credential contém o Google idToken
   *     const authData = await loginWithGoogle({ idToken: response.credential });
   *     await fetch('/api/auth/session', {
   *       method: 'POST',
   *       headers: { 'Content-Type': 'application/json' },
   *       body: JSON.stringify(authData),
   *     });
   *     router.push(from);
   *   }
   * });
   * ```
   * -------------------------------------------------------------
   */
  async function handleGoogleLogin() {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      // 1. Obtém autenticação (com mock ou via endpoint /auth/google)
      const authResponse = await loginWithGoogle({
        idToken: USE_MOCK ? "mock-google-id-token" : "real-google-id-token",
      });

      // 2. Grava o cookie seguro `fin_session` via Route Handler interno
      const sessionRes = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: authResponse.accessToken,
          user: authResponse.user,
        }),
      });

      if (!sessionRes.ok) {
        throw new Error("Falha ao registrar sessão local.");
      }

      // 3. Redireciona para o destino ou dashboard
      router.push(from);
      router.refresh();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Ocorreu um erro ao entrar. Tente novamente.";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="relative z-10 w-full max-w-md rounded-3xl border border-border bg-surface p-8 shadow-default md:p-10">
      {/* Marca FIN com símbolo geométrico */}
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="mb-3 flex items-center gap-2.5">
          <div
            className="flex size-10 items-center justify-center rounded-2xl bg-gradient-hero shadow-md shadow-primary/20"
            aria-hidden="true"
          >
            <div className="size-4 rotate-45 rounded-sm bg-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-text">FIN</span>
        </div>

        <h1 className="text-xl font-bold tracking-tight text-text sm:text-2xl">
          Suas finanças, num só lugar
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          Acompanhe gastos, contas, metas e investimentos com simplicidade e clareza.
        </p>
      </div>

      {/* Mensagem de Erro Visual */}
      {errorMessage && (
        <div
          role="alert"
          className="mb-6 rounded-2xl border border-expense/20 bg-expense-soft px-4 py-3 text-sm text-expense"
        >
          {errorMessage}
        </div>
      )}

      {/* Botão "Entrar com Google" */}
      <div className="space-y-4">
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="flex h-12 w-full items-center justify-center gap-3 rounded-2xl border border-border bg-surface text-sm font-semibold text-text shadow-sm transition-all hover:bg-surface-soft hover:shadow active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60"
        >
          {isLoading ? (
            <Loader2 className="size-5 animate-spin text-primary" aria-hidden="true" />
          ) : (
            <svg className="size-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.94 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
          )}
          <span>{isLoading ? "Entrando..." : "Entrar com Google"}</span>
        </button>
      </div>

      {/* Rodapé do Card com Texto de Privacidade */}
      <p className="mt-8 text-center text-xs leading-relaxed text-text-muted">
        Ao continuar, você concorda com nossos{" "}
        <span className="cursor-pointer text-text hover:underline">Termos de Uso</span> e{" "}
        <span className="cursor-pointer text-text hover:underline">Política de Privacidade</span>.
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden px-4 py-8">
      {/* Blobs decorativos de fundo com gradiente suave */}
      <div
        className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-gradient-hero opacity-20 blur-3xl dark:opacity-15"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-accent opacity-20 blur-3xl dark:opacity-15"
        aria-hidden="true"
      />

      {/* Suspense Boundary para useSearchParams */}
      <Suspense
        fallback={
          <div className="relative z-10 flex h-96 w-full max-w-md items-center justify-center rounded-3xl border border-border bg-surface p-8 shadow-default">
            <Loader2 className="size-8 animate-spin text-primary" aria-hidden="true" />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </main>
  );
}
