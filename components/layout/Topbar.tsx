"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sun, Moon, LogOut, User as UserIcon } from "lucide-react";
import { useCurrentUser, useLogout } from "@/hooks/use-current-user";
import { UserAvatar } from "./UserAvatar";
import { useTheme } from "@/hooks/use-theme";
import styles from "./navigation.module.css";

export function Topbar() {
  const router = useRouter();
  const { data: currentUser, isPending, isError } = useCurrentUser();
  const logout = useLogout();
  const [greeting, setGreeting] = useState("Olá");
  const { theme, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Saudação contextual dinâmica
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


  async function handleLogout() {
    await logout();
    router.push("/login");
    router.refresh();
  }

  // Primeiro nome para saudação limpa
  const firstName = currentUser?.name.trim().split(/\s+/)[0];

  return (
    <header className={`${styles.topbar} sticky top-0 z-20 hidden lg:flex h-20 w-full items-center justify-between px-8`}>
      {/* Saudação dinâmica com o nome */}
      <div>
        <h2 className="text-base font-semibold tracking-tight text-text">
          {greeting}{firstName ? `, ${firstName}!` : '!'}
        </h2>
        <p className="text-xs text-text-muted">
          Tenha uma visão clara do seu patrimônio e despesas hoje.
        </p>
      </div>

      {/* Controles de Ação Desktop */}
      <div className="flex items-center gap-3">
        {/* Alternador de Tema */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === "light" ? "Ativar modo escuro" : "Ativar modo claro"}
          className="flex size-11 items-center justify-center rounded-2xl border border-border bg-surface text-text-muted transition-all hover:bg-surface-soft hover:text-text active:scale-95"
        >
          {theme === "light" ? (
            <Moon className="size-4.5" aria-hidden="true" />
          ) : (
            <Sun className="size-4.5 text-warning" aria-hidden="true" />
          )}
        </button>

        {/* Divisor Vertical */}
        <div className="h-6 w-px bg-border mx-1" aria-hidden="true" />

        {/* Avatar da Usuária e Menu Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-expanded={isMenuOpen}
            aria-label="Menu do usuário"
            className="flex min-h-11 items-center gap-3 rounded-2xl p-1.5 transition-colors hover:bg-surface-soft focus-visible:ring-2 focus-visible:ring-primary"
          >
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-hero text-xs font-bold text-white shadow-sm">
              <UserAvatar user={currentUser} />
            </div>
            <div className="text-left text-xs font-medium text-text pr-1">
              <span>{currentUser?.name ?? (isPending ? 'Carregando perfil...' : isError ? 'Perfil indisponível' : 'Meu perfil')}</span>
            </div>
          </button>

          {/* Dropdown Menu */}
          {isMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setIsMenuOpen(false)}
                aria-hidden="true"
              />
              <div className="absolute right-0 top-12 z-40 w-48 rounded-2xl border border-border bg-surface p-1.5 shadow-default">
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    router.push("/settings");
                  }}
                  className="flex w-full items-center gap-2.5 min-h-11 rounded-xl px-3 py-2 text-xs font-medium text-text transition-colors hover:bg-surface-soft"
                >
                  <UserIcon className="size-4 text-text-muted" aria-hidden="true" />
                  <span>Configurações</span>
                </button>
                <div className="my-1 h-px bg-border" aria-hidden="true" />
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 min-h-11 rounded-xl px-3 py-2 text-xs font-medium text-expense transition-colors hover:bg-expense-soft"
                >
                  <LogOut className="size-4" aria-hidden="true" />
                  <span>Sair da conta</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

