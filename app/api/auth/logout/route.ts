import { NextRequest, NextResponse } from "next/server";
import { revokeSession, clearSessionCookie } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Origem inválida." }, { status: 403 });
  }
  const refreshToken = request.cookies.get("fin_session")?.value;
  if (refreshToken) await revokeSession(refreshToken).catch(() => undefined);
  const response = NextResponse.json({ success: true });
  clearSessionCookie(response);
  return response;
}
