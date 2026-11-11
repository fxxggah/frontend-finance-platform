"use client";

import { useEffect, useState } from "react";
import { Bell, Sun, Moon } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { UserAvatar } from "./UserAvatar";

export function HeaderMobile() {
  const { data: currentUser, isPending } = useCurrentUser();
  const [greeting, setGreeting] = useState("Olá");
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      setGreeting("Bom dia");
    } else if (hour >= 12 && hour < 18) {
      setGreeting("Boa tarde");
    } else {
      setGreeting("Boa noite");
    }

    const isDark =
      document.documentElement.classList.contains("dark") ||
      document.documentElement.getAttribute("data-theme") === "dark";
    setTheme(isDark ? "dark" : "light");
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("fin_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.setAttribute("data-theme", "light");
      localStorage.setItem("fin_theme", "light");
    }
  }

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
            <h1 className="text-base font-bold tracking-tight text-white leading-tight">
              {currentUser?.name ?? (isPending ? 'Carregando perfil...' : 'Perfil indisponível')}
            </h1>
          </div>
        </div>

        {/* Ações Rápidas no Header Mobile */}
        <div className="flex items-center gap-2">
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

          {/* Notificações Mobile */}
          <button
            type="button"
            aria-label="Notificações"
            className="relative flex size-11 items-center justify-center rounded-2xl bg-white/15 text-white border border-white/20 transition-all active:scale-95"
          >
            <Bell className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}

