import { NextRequest, NextResponse } from "next/server";
import { refreshSession, setSessionCookie } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  return NextResponse.json({ authenticated: Boolean(request.cookies.get("fin_session")?.value) });
}

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Origem inválida." }, { status: 403 });
  }
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || !("refreshToken" in body) ||
      typeof body.refreshToken !== "string" || !body.refreshToken.trim()) {
    return NextResponse.json({ error: "Sessão inválida." }, { status: 400 });
  }
  try {
    const tokens = await refreshSession(body.refreshToken);
    const response = NextResponse.json({ accessToken: tokens.accessToken });
    setSessionCookie(response, tokens.refreshToken);
    return response;
  } catch {
    return NextResponse.json({ error: "Não foi possível iniciar a sessão." }, { status: 401 });
  }
}
