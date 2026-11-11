"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Landmark,
  CreditCard,
  Target,
  BarChart3,
  Tags,
  Calculator,
  Settings,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const MAIN_NAV_ITEMS: NavItem[] = [
  { label: "Início", href: "/dashboard", icon: LayoutDashboard },
  { label: "Transações", href: "/transactions", icon: ArrowLeftRight },
  { label: "Contas", href: "/accounts", icon: Landmark },
  { label: "Cartões", href: "/cards", icon: CreditCard },
  { label: "Metas", href: "/goals", icon: Target },
  { label: "Relatórios", href: "/reports", icon: BarChart3 },
  { label: "Categorias", href: "/categories", icon: Tags },
  { label: "Simulações", href: "/simulations/investment", icon: Calculator },
  { label: "Configurações", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="hidden lg:flex fixed inset-y-0 left-0 z-30 w-64 flex-col bg-sidebar text-sidebar-text shadow-xl select-none"
      aria-label="Navegação principal"
    >
      {/* Topo: Marca FIN com símbolo em gradiente */}
      <div className="flex h-20 items-center px-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 transition-opacity hover:opacity-90"
        >
          <div
            className="flex size-9 items-center justify-center rounded-xl bg-gradient-hero shadow-md shadow-primary/30"
            aria-hidden="true"
          >
            <div className="size-3.5 rotate-45 rounded-sm bg-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">FIN</span>
        </Link>
      </div>

      {/* Lista de Navegação */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto px-4 py-2">
        {MAIN_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          // Verifica se a rota está ativa (exata ou prefixo, exceto raiz do item)
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3.5 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-gradient-hero text-white shadow-md shadow-primary/25"
                  : "text-[#C9CDEB] hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon
                className={cn(
                  "size-5 shrink-0 transition-colors duration-200",
                  isActive ? "text-white" : "text-[#C9CDEB] group-hover:text-white"
                )}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Base da Sidebar: Card "Defina um objetivo" */}
      <div className="p-4">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
          <div className="mb-2 flex items-center gap-2 text-white">
            <Target className="size-4 text-accent" aria-hidden="true" />
            <h4 className="text-xs font-semibold tracking-wide uppercase text-white/90">
              Defina um objetivo
            </h4>
          </div>
          <p className="mb-3 text-xs leading-relaxed text-[#C9CDEB]/80">
            Crie metas financeiras e acompanhe seu progresso mês a mês.
          </p>
          <Link
            href="/goals"
            className="flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-white/10 text-xs font-semibold text-white transition-all hover:bg-white/20 active:scale-[0.98]"
          >
            <Plus className="size-3.5" aria-hidden="true" />
            <span>Nova meta</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}

