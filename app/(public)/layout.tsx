import type { ReactNode } from "react";

export const metadata = {
  title: "Entrar — FIN",
  description: "Acesse sua conta no FIN e tenha o controle das suas finanças.",
};

export default function PublicLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-bg text-text antialiased selection:bg-primary/20 selection:text-primary">
      {children}
    </div>
  );
}

