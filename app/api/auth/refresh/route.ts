import { NextRequest, NextResponse } from "next/server";
import { refreshSession, setSessionCookie, clearSessionCookie } from "@/lib/auth/session";

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
  } catch {
    const response = NextResponse.json({ error: "Sessão expirada." }, { status: 401 });
    clearSessionCookie(response);
    return response;
  }
}
