import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * GET /api/auth/session
 * Lê o estado de autenticação a partir do cookie de sessão httpOnly.
 */
export async function GET() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("fin_session");

  if (!sessionCookie?.value) {
    return NextResponse.json({ authenticated: false, session: null }, { status: 401 });
  }

  try {
    const session = JSON.parse(sessionCookie.value);
    return NextResponse.json({ authenticated: true, session });
  } catch {
    return NextResponse.json({
      authenticated: true,
      session: { token: sessionCookie.value },
    });
  }
}

/**
 * POST /api/auth/session
 * Grava o cookie seguro de sessão após autenticação bem-sucedida com Google.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const cookieStore = await cookies();

  const sessionData = JSON.stringify(body || { user: "Hellen Carol" });

  cookieStore.set("fin_session", sessionData, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 dias
  });

  return NextResponse.json({ success: true });
}

