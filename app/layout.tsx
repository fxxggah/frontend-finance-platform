import { QueryProvider } from "@/lib/query/provider";
import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "FIN — Suas finanças, mais simples",
  description: "Acompanhe suas finanças pessoais de forma clara e tranquila.",
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: "#EDEFFA",
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('fin-theme')||localStorage.getItem('fin_theme');t=t==='dark'?'dark':'light';document.documentElement.dataset.theme=t;document.documentElement.classList.toggle('dark',t==='dark');localStorage.setItem('fin-theme',t)}catch{document.documentElement.dataset.theme='light'}` }} />
      </head>
      <body className={`${inter.variable} antialiased`}>
        <QueryProvider>
          {children}
        </QueryProvider>
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  );
}
