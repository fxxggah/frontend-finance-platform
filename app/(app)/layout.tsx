import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Sidebar, Topbar, HeaderMobile, BottomNav } from "@/components/layout";

export default async function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Auth Guard adicional no Server Component para garantir segurança de sessão
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("fin_session");

  if (!sessionCookie?.value) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-bg text-text antialiased">
      {/* ── Shell Desktop (viewport >= 1024px) ── */}
      <Sidebar />

      <div className="flex min-h-screen flex-col lg:pl-64">
        {/* Cabeçalho global desktop: renderizado uma única vez para todas as rotas. */}
        <Topbar />

        {/* Cabeçalho global mobile (viewport < 1024px). */}
        <HeaderMobile />

        {/* Conteúdo Principal com padding adaptado para mobile (espaço para o BottomNav) */}
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 pb-28 lg:pb-8">
          {children}
        </main>

        {/* Barra de Navegação Inferior Mobile */}
        <BottomNav />
      </div>
    </div>
  );
}

