import { NextRequest, NextResponse } from "next/server";
import { refreshSession, setSessionCookie, sessionProblem, sessionFailureResponse, clearSessionCookie } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return sessionProblem(403, "Origem inválida", "A origem da requisição não é permitida.");
  }
  const refreshToken = request.cookies.get("fin_session")?.value;
  if (!refreshToken) {
    const response = sessionProblem(401, "Sessão expirada", "Entre novamente para continuar.");
    clearSessionCookie(response);
    return response;
  }
  try {
    const tokens = await refreshSession(refreshToken);
    const response = NextResponse.json({ accessToken: tokens.accessToken });
    setSessionCookie(response, tokens.refreshToken);
    return response;
  } catch (error) {
    return sessionFailureResponse(error, "refresh");
  }
}
