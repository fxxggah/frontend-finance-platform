import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Rotas públicas que não exigem sessão ativa
const PUBLIC_ROUTES = ["/login"];

// Prefixos das rotas privadas pertencentes à área autenticada (app)
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/transactions",
  "/accounts",
  "/cards",
  "/goals",
  "/reports",
  "/categories",
  "/simulations",
  "/settings",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get("fin_session");
  const isAuthenticated = Boolean(sessionCookie?.value);

  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const isPublic = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));

  // 1. Usuário não autenticado tentando acessar rota privada sob a área (app)
  if (!isAuthenticated && isProtected) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Usuário já autenticado tentando acessar a tela de login
  if (isAuthenticated && isPublic) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
};

