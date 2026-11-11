import { NextRequest, NextResponse } from "next/server";
import { refreshSession, setSessionCookie, clearSessionCookie } from "@/lib/auth/session";
import { ApiError } from "@/lib/api/errors";

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Origem inválida." }, { status: 403 });
  }
  const refreshToken = request.cookies.get("fin_session")?.value;
  if (!refreshToken) return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });
  try {
    const tokens = await refreshSession(refreshToken);
    const response = NextResponse.json({ accessToken: tokens.accessToken });
    setSessionCookie(response, tokens.refreshToken);
    return response;
  } catch (error) {
    const expired = error instanceof ApiError && (error.status === 401 || error.status === 400);
    const response = NextResponse.json({
      title: expired ? "Sessão expirada" : "Serviço indisponível",
      detail: expired ? "Entre novamente para continuar." : "Não foi possível renovar sua sessão. Tente novamente.",
    }, { status: expired ? 401 : 503 });
    if (expired) clearSessionCookie(response);
    return response;
  }
}
