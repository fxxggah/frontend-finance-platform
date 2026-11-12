import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Sidebar, Topbar, HeaderMobile, BottomNav } from "@/components/layout";
import { SessionBoundary } from "@/components/auth/session-boundary";

export default async function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Ausência de cookie bloqueia no servidor; sua validade é verificada no BFF.
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("fin_session");

  if (!sessionCookie?.value) {
    redirect("/login");
  }

  return (
    <SessionBoundary mode="private" hasSessionCookie={Boolean(sessionCookie?.value)}>
      <div className="min-h-screen bg-bg text-text antialiased">
        {/* ── Shell Desktop (viewport >= 1024px) ── */}
        <Sidebar />

        <div className="flex min-h-screen flex-col lg:pl-64">
          {/* Cabeçalho global desktop: renderizado uma única vez para todas as rotas. */}
          <Topbar />

          {/* Cabeçalho global mobile (viewport < 1024px). */}
          <HeaderMobile />

          {/* Conteúdo Principal com padding adaptado para mobile (espaço para o BottomNav) */}
          <main className="min-w-0 flex-1 px-4 py-6 pb-[calc(7rem+env(safe-area-inset-bottom))] sm:px-6 lg:px-8 lg:pb-8">
            {children}
          </main>

          {/* Barra de Navegação Inferior Mobile */}
          <BottomNav />
        </div>
      </div>
    </SessionBoundary>
  );
}

