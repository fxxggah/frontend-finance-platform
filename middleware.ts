import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

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
  // O cookie indica uma sessão candidata; a barreira client valida pelo BFF.
  const hasSessionCookie = Boolean(sessionCookie?.value);

  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

  // 1. Usuário não autenticado tentando acessar rota privada sob a área (app)
  if (!hasSessionCookie && isProtected) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
};

