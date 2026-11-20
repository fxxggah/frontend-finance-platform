"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { SessionLoading } from "@/components/auth/session-loading";
import { Button } from "@/components/ui/button";
import { ensureAccessToken, onSessionChanged, SESSION_CHANGED, SESSION_REAUTH_REQUIRED, setAccessToken } from "@/lib/api/client";
import { logout } from "@/lib/api/endpoints/auth";
import { ApiError } from "@/lib/api/errors";

type SessionState = "verifying" | "authenticated" | "anonymous" | "error" | "reauth-required" | "signing-out" | "changed";

interface SessionBoundaryProps {
  children: ReactNode;
  mode: "private" | "login";
  hasSessionCookie: boolean;
}

/** O shell e suas consultas só são montados depois da recuperação do access token. */
export function SessionBoundary({ children, mode, hasSessionCookie }: SessionBoundaryProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [state, setState] = useState<SessionState>(mode === "login" && !hasSessionCookie ? "anonymous" : "verifying");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    const unsubscribe = onSessionChanged(() => {
      active = false;
      setState("changed");
      void queryClient.cancelQueries();
      queryClient.clear();
    });
    const cleanup = () => { active = false; unsubscribe(); };
    if (!active) return cleanup;
    if (!hasSessionCookie) {
      setState("anonymous");
      if (mode === "private") router.replace("/login");
      return cleanup;
    }

    void ensureAccessToken().then(() => {
      if (!active) return;
      setState("authenticated");
      if (mode === "login") router.replace("/dashboard");
    }).catch(async (error: unknown) => {
      if (!active) return;
      if (error instanceof ApiError && error.code === SESSION_CHANGED) return;
      if (error instanceof ApiError && error.status === 401) {
        setAccessToken(null);
        await queryClient.cancelQueries();
        queryClient.clear();
        if (!active) return;
        if (error.code === SESSION_REAUTH_REQUIRED) {
          setState("reauth-required");
          return;
        }
        setState("anonymous");
        if (mode === "private") router.replace("/login");
      } else {
        setState("error");
      }
    });

    return cleanup;
  }, [mode, hasSessionCookie, attempt, router, queryClient]);

  async function signInAgain(): Promise<void> {
    setState("signing-out");
    try {
      await logout();
      await queryClient.cancelQueries();
      queryClient.clear();
      setState("anonymous");
      if (mode === "private") router.replace("/login");
      router.refresh();
    } catch {
      setState("error");
    }
  }

  if (state === "changed") {
    return (
      <main className="grid min-h-screen place-items-center bg-bg p-6 text-text">
        <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-6 text-center">
          <p role="alert" className="mb-6 text-sm">A sessão mudou em outra aba. Continue para abrir a sessão atual.</p>
          <Button onClick={() => window.location.assign("/login")}>Continuar com a sessão atual</Button>
        </div>
      </main>
    );
  }

  if ((mode === "private" && state === "authenticated") || (mode === "login" && state === "anonymous")) {
    return children;
  }

  if (state !== "error" && state !== "reauth-required") {
    return (
      <SessionLoading
        key={`${state === "signing-out" ? "signing-out" : "verifying"}-${attempt}`}
        signingOut={state === "signing-out"}
        complete={state === "authenticated" || state === "anonymous"}
      />
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-4 py-8 text-text">
      <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-6 text-center sm:p-8">
        <p role="alert" className="text-sm text-text-muted">{state === "reauth-required"
          ? "Este navegador não consegue renovar sua sessão com segurança. Entre novamente."
          : "Não foi possível validar sua sessão. Tente novamente."}</p>
        <div className="mt-6 flex flex-col gap-3">
          {state === "error" && (
            <Button onClick={() => { setState("verifying"); setAttempt(value => value + 1); }}>Tentar novamente</Button>
          )}
          <Button variant="outline" onClick={() => void signInAgain()}>Entrar novamente</Button>
        </div>
      </div>
    </main>
  );
}
