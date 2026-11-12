import { NextRequest, NextResponse } from "next/server";
import { revokeSession, clearSessionCookie, logSessionFailure, sessionProblem } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return sessionProblem(403, "Origem inválida", "A origem da requisição não é permitida.");
  }
  const refreshToken = request.cookies.get("fin_session")?.value;
  if (refreshToken) await revokeSession(refreshToken).catch(error => logSessionFailure(error, "logout"));
  const response = NextResponse.json({ success: true });
  clearSessionCookie(response);
  return response;
}
