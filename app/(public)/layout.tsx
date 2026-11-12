import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { SessionBoundary } from "@/components/auth/session-boundary";

export const metadata = {
  title: "Entrar — FIN",
  description: "Acesse sua conta no FIN e tenha o controle das suas finanças.",
};

export default async function PublicLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cookieStore = await cookies();
  return (
    <div className="min-h-screen w-full bg-bg text-text antialiased selection:bg-primary/20 selection:text-primary">
      <SessionBoundary mode="login" hasSessionCookie={Boolean(cookieStore.get("fin_session")?.value)}>
        {children}
      </SessionBoundary>
    </div>
  );
}

