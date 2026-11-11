"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  BarChart3,
  Menu,
  Plus,
  Landmark,
  CreditCard,
  Target,
  Tags,
  Calculator,
  Settings,
  ArrowDownLeft,
  ArrowUpRight,
  Repeat,
  LogOut,
} from "lucide-react";
import { Sheet, SheetHeader, SheetTitle, SheetBody } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useLogout } from "@/hooks/use-current-user";

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useLogout();

  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  async function handleLogout() {
    setIsMoreOpen(false);
    await logout();
    router.push("/login");
    router.refresh();
  }

  // Rotas complementares exibidas no Bottom Sheet "Mais"
  const moreItems = [
    { label: "Contas", href: "/accounts", icon: Landmark },
    { label: "Cartões", href: "/cards", icon: CreditCard },
    { label: "Metas", href: "/goals", icon: Target },
    { label: "Categorias", href: "/categories", icon: Tags },
    { label: "Simulações", href: "/simulations/investment", icon: Calculator },
    { label: "Configurações", href: "/settings", icon: Settings },
  ];

  const isMoreActive = moreItems.some((item) => pathname.startsWith(item.href));

  return (
    <>
      {/* Barra Inferior com Efeito Vidro (Glassmorphism Restrito §4) */}
      <nav
        aria-label="Navegação mobile"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 h-20 rounded-t-[1.75rem] border-t border-border/60 bg-white/85 dark:bg-surface/85 backdrop-blur-md shadow-[0_-8px_30px_-8px_rgba(20,23,46,0.1)] px-4 flex items-center justify-between"
      >
        {/* 1. Início */}
        <Link
          href="/dashboard"
          className={cn(
            "flex flex-1 flex-col items-center justify-center gap-1 py-1 text-xs font-medium transition-colors",
            pathname === "/dashboard"
              ? "text-primary font-semibold"
              : "text-text-muted hover:text-text"
          )}
        >
          <LayoutDashboard className="size-5" aria-hidden="true" />
          <span>Início</span>
        </Link>

        {/* 2. Transações */}
        <Link
          href="/transactions"
          className={cn(
            "flex flex-1 flex-col items-center justify-center gap-1 py-1 text-xs font-medium transition-colors",
            pathname.startsWith("/transactions")
              ? "text-primary font-semibold"
              : "text-text-muted hover:text-text"
          )}
        >
          <ArrowLeftRight className="size-5" aria-hidden="true" />
          <span>Transações</span>
        </Link>

        {/* 3. Botão Central Flutuante (+) */}
        <div className="flex flex-1 items-center justify-center">
          <button
            type="button"
            onClick={() => setIsActionsOpen(true)}
            aria-label="Criar novo lançamento"
            className="relative z-10 -mt-6 flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full border-0 bg-gradient-hero text-white shadow-[0_8px_20px_rgba(20,23,46,0.28)] transition-transform active:scale-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none"
          >
            <Plus className="size-6 stroke-[2.5]" aria-hidden="true" />
          </button>
        </div>

        {/* 4. Relatórios */}
        <Link
          href="/reports"
          className={cn(
            "flex flex-1 flex-col items-center justify-center gap-1 py-1 text-xs font-medium transition-colors",
            pathname.startsWith("/reports")
              ? "text-primary font-semibold"
              : "text-text-muted hover:text-text"
          )}
        >
          <BarChart3 className="size-5" aria-hidden="true" />
          <span>Relatórios</span>
        </Link>

        {/* 5. Mais */}
        <button
          type="button"
          onClick={() => setIsMoreOpen(true)}
          className={cn(
            "flex flex-1 flex-col items-center justify-center gap-1 py-1 text-xs font-medium transition-colors",
            isMoreActive || isMoreOpen
              ? "text-primary font-semibold"
              : "text-text-muted hover:text-text"
          )}
        >
          <Menu className="size-5" aria-hidden="true" />
          <span>Mais</span>
        </button>
      </nav>

      {/* Bottom Sheet: Ações Rápidas (+) */}
      <Sheet open={isActionsOpen} onClose={() => setIsActionsOpen(false)}>
        <SheetHeader>
          <SheetTitle>Novo Lançamento</SheetTitle>
        </SheetHeader>
        <SheetBody className="pb-8">
          <div className="flex flex-col gap-3">
            {/* Nova Receita */}
            <button
              type="button"
              onClick={() => {
                setIsActionsOpen(false);
                router.push("/transactions/new?type=INCOME");
              }}
              className="flex items-center gap-3.5 rounded-2xl border border-border bg-surface p-3.5 text-left transition-all hover:bg-surface-soft active:scale-[0.99]"
            >
              <div className="flex size-11 items-center justify-center rounded-xl bg-income-soft text-income">
                <ArrowDownLeft className="size-5 stroke-[2.5]" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-text">Nova receita</p>
                <p className="text-xs text-text-muted">Salário, rendimentos, depósitos</p>
              </div>
            </button>

            {/* Nova Despesa */}
            <button
              type="button"
              onClick={() => {
                setIsActionsOpen(false);
                router.push("/transactions/new?type=EXPENSE");
              }}
              className="flex items-center gap-3.5 rounded-2xl border border-border bg-surface p-3.5 text-left transition-all hover:bg-surface-soft active:scale-[0.99]"
            >
              <div className="flex size-11 items-center justify-center rounded-xl bg-expense-soft text-expense">
                <ArrowUpRight className="size-5 stroke-[2.5]" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-text">Nova despesa</p>
                <p className="text-xs text-text-muted">Gastos diários, compras, contas</p>
              </div>
            </button>

            {/* Transferir */}
            <button
              type="button"
              onClick={() => {
                setIsActionsOpen(false);
                router.push("/transactions/new?type=TRANSFER");
              }}
              className="flex items-center gap-3.5 rounded-2xl border border-border bg-surface p-3.5 text-left transition-all hover:bg-surface-soft active:scale-[0.99]"
            >
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <Repeat className="size-5 stroke-[2.5]" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-text">Transferir</p>
                <p className="text-xs text-text-muted">Entre suas contas bancárias</p>
              </div>
            </button>
          </div>
        </SheetBody>
      </Sheet>

      {/* Bottom Sheet: Menu "Mais" */}
      <Sheet open={isMoreOpen} onClose={() => setIsMoreOpen(false)}>
        <SheetHeader>
          <SheetTitle>Navegação</SheetTitle>
        </SheetHeader>
        <SheetBody className="pb-8">
          <div className="grid grid-cols-3 gap-3">
            {moreItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);

              return (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => {
                    setIsMoreOpen(false);
                    router.push(item.href);
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center gap-2 rounded-2xl border p-4 text-center transition-all active:scale-95",
                    isActive
                      ? "border-primary bg-primary-soft text-primary font-semibold"
                      : "border-border bg-surface text-text hover:bg-surface-soft"
                  )}
                >
                  <Icon className="size-6" aria-hidden="true" />
                  <span className="text-xs">{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-5 border-t border-border pt-4">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-expense/20 bg-expense-soft p-3 text-sm font-semibold text-expense transition-all active:scale-[0.99]"
            >
              <LogOut className="size-4" aria-hidden="true" />
              <span>Sair da conta</span>
            </button>
          </div>
        </SheetBody>
      </Sheet>
    </>
  );
}

