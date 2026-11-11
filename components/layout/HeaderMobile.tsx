"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { UserAvatar } from "./UserAvatar";
import { useTheme } from "@/hooks/use-theme";

export function HeaderMobile() {
  const { data: currentUser, isPending } = useCurrentUser();
  const [greeting, setGreeting] = useState("Olá");
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      setGreeting("Bom dia");
    } else if (hour >= 12 && hour < 18) {
      setGreeting("Boa tarde");
    } else {
      setGreeting("Boa noite");
    }
  }, []);


  return (
    <header className="lg:hidden relative overflow-hidden bg-gradient-hero text-white rounded-b-[2rem] px-5 pt-6 pb-8 shadow-lg shadow-primary/20">
      {/* Detalhe estético em overlay radial */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15)_0%,transparent_70%)]"
        aria-hidden="true"
      />

      <div className="relative z-10 flex items-center justify-between">
        {/* Identificação e Saudação */}
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-white/15 text-sm font-bold text-white shadow-sm border border-white/20">
            <UserAvatar user={currentUser} />
          </div>
          <div>
            <span className="text-xs font-medium text-white/80">
              {greeting},
            </span>
            <p className="text-base font-semibold tracking-tight text-white leading-tight">
              {currentUser?.name ?? (isPending ? 'Carregando perfil...' : 'Perfil indisponível')}
            </p>
          </div>
        </div>

        {/* Alternador de Tema Mobile */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === "light" ? "Ativar modo escuro" : "Ativar modo claro"}
          className="flex size-11 items-center justify-center rounded-2xl bg-white/15 text-white border border-white/20 transition-all active:scale-95"
        >
          {theme === "light" ? (
            <Moon className="size-4" aria-hidden="true" />
          ) : (
            <Sun className="size-4 text-warning" aria-hidden="true" />
          )}
        </button>
      </div>
    </header>
  );
}

