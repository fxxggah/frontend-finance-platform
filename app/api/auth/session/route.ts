import { NextRequest, NextResponse } from "next/server";
import { refreshSession, setSessionCookie, sessionProblem, sessionFailureResponse } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  return NextResponse.json({ authenticated: Boolean(request.cookies.get("fin_session")?.value) });
}

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return sessionProblem(403, "Origem inválida", "A origem da requisição não é permitida.");
  }
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || !("refreshToken" in body) ||
      typeof body.refreshToken !== "string" || !body.refreshToken.trim()) {
    return sessionProblem(400, "Sessão inválida", "Informe um token de renovação válido.");
  }
  try {
    const tokens = await refreshSession(body.refreshToken);
    const response = NextResponse.json({ accessToken: tokens.accessToken });
    setSessionCookie(response, tokens.refreshToken);
    return response;
  } catch (error) {
    return sessionFailureResponse(error, "session");
  }
}
