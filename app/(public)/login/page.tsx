"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { Loader2 } from "lucide-react";
import { loginWithGoogle } from "@/lib/api/endpoints/auth";
import { setAccessToken } from "@/lib/api/client";
import { USE_MOCK } from "@/lib/config";
import { ApiError } from "@/lib/api/errors";

interface GoogleCredentialResponse { credential?: string }
interface GoogleIdentity {
  initialize(config: { client_id: string; callback: (response: GoogleCredentialResponse) => void }): void;
  renderButton(element: HTMLElement, options: { type: "standard"; theme: "outline"; size: "large"; text: "signin_with"; width: number; locale: "pt-BR" }): void;
}
declare global {
  interface Window { google?: { accounts: { id: GoogleIdentity } } }
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export default function LoginPage() {
  const router = useRouter();
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const pendingRef = useRef(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const finishLogin = useCallback(async (idToken: string) => {
    if (pendingRef.current) return;
    pendingRef.current = true;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const auth = await loginWithGoogle({ idToken });
      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: auth.refreshToken, user: auth.user }),
      });
      if (!response.ok) throw new Error("Não foi possível criar sua sessão. Tente novamente.");
      const session: { accessToken?: string } = await response.json();
      if (!session.accessToken) throw new Error("A sessão retornou dados incompletos.");
      setAccessToken(session.accessToken);
      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      setAccessToken(null);
      setErrorMessage(error instanceof ApiError && error.status === 401
        ? "Sua autenticação com o Google expirou. Tente novamente."
        : error instanceof Error && !(error instanceof ApiError)
          ? error.message
          : "Não foi possível entrar agora. Tente novamente.");
      setIsLoading(false);
      pendingRef.current = false;
    }
  }, [router]);

  useEffect(() => {
    if (USE_MOCK || !scriptReady || !GOOGLE_CLIENT_ID || !googleButtonRef.current || !window.google) return;
    const element = googleButtonRef.current;
    element.replaceChildren();
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response) => {
        if (!response.credential) {
          setErrorMessage("O Google não retornou uma credencial. Tente novamente.");
          return;
        }
        void finishLogin(response.credential);
      },
    });
    window.google.accounts.id.renderButton(element, {
      type: "standard", theme: "outline", size: "large", text: "signin_with",
      width: Math.min(element.clientWidth, 360), locale: "pt-BR",
    });
  }, [scriptReady, finishLogin]);

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden px-4 py-8">
      <div className="pointer-events-none absolute -left-32 -top-32 size-96 rounded-full bg-gradient-hero opacity-20 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 size-96 rounded-full bg-accent opacity-20 blur-3xl" aria-hidden="true" />
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-border bg-surface p-8 shadow-default md:p-10">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex items-center gap-2.5">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-gradient-hero" aria-hidden="true">
              <div className="size-4 rotate-45 rounded-sm bg-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-text">FIN</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-text sm:text-2xl">Suas finanças, num só lugar</h1>
          <p className="mt-2 text-sm text-text-muted">Acompanhe gastos, contas e metas com simplicidade.</p>
        </div>

        {errorMessage && <p role="alert" className="mb-6 rounded-2xl border border-expense/20 bg-expense-soft px-4 py-3 text-sm text-expense">{errorMessage}</p>}

        {USE_MOCK ? (
          <button type="button" disabled={isLoading} onClick={() => void finishLogin("mock-google-id-token")}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-4 font-semibold text-text hover:bg-surface-soft disabled:opacity-60">
            {isLoading && <Loader2 className="size-5 animate-spin" aria-hidden="true" />}
            {isLoading ? "Entrando..." : "Entrar com Google (demonstração)"}
          </button>
        ) : (
          <div className="flex min-h-12 w-full flex-col items-center justify-center gap-3" aria-busy={isLoading}>
            {isLoading ? <p role="status" className="flex items-center gap-2 text-sm text-text-muted"><Loader2 className="size-5 animate-spin" aria-hidden="true" />Entrando...</p> : null}
            <div ref={googleButtonRef} className={isLoading ? "pointer-events-none opacity-50" : "w-full text-center"} aria-label="Entrar com Google" />
            {GOOGLE_CLIENT_ID && !scriptReady && !errorMessage && <p role="status" className="text-sm text-text-muted">Carregando botão do Google...</p>}
            {!GOOGLE_CLIENT_ID && <p role="alert" className="text-sm text-expense">Configure NEXT_PUBLIC_GOOGLE_CLIENT_ID para entrar.</p>}
          </div>
        )}

        <p className="mt-8 text-center text-xs leading-relaxed text-text-muted">Ao continuar, você concorda com os termos de uso e a política de privacidade do FIN.</p>
      </div>
      {!USE_MOCK && GOOGLE_CLIENT_ID && <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive"
        onReady={() => setScriptReady(true)} onError={() => setErrorMessage("Não foi possível carregar o login do Google. Recarregue a página.")} />}
    </main>
  );
}
