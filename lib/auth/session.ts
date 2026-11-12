import { NextResponse } from "next/server";
import { API_BASE_URL, USE_MOCK } from "@/lib/config";

import { ApiError } from "@/lib/api/errors";
import type { TokenResponse } from "@/types";

const COOKIE_NAME = "fin_session";
const MAX_AGE = 7 * 24 * 60 * 60;
const SESSION_TIMEOUT_MS = 10_000;

type SessionFailureCategory = "rejected" | "network" | "timeout" | "upstream_http" | "invalid_response";

class SessionError extends ApiError {
  constructor(
    status: number,
    readonly category: SessionFailureCategory,
    readonly upstreamStatus?: number,
  ) {
    super({
      status,
      title: status === 401 ? "Sessão expirada" : status === 502 ? "Resposta inválida do serviço" : "Serviço indisponível",
      detail: status === 401 ? "Entre novamente para continuar." : "Não foi possível validar sua sessão. Tente novamente.",
    });
  }
}

export function sessionProblem(status: number, title: string, detail: string): NextResponse {
  return NextResponse.json({ type: "about:blank", status, title, detail }, { status });
}

export function logSessionFailure(error: unknown, operation: "refresh" | "session" | "logout"): void {
  // Nunca registrar o objeto original: erros de fetch podem carregar URLs ou credenciais.
  console.error("[auth] Falha na sessão", {
    operation,
    category: error instanceof SessionError ? error.category : "unexpected",
    upstreamStatus: error instanceof SessionError ? error.upstreamStatus : undefined,
  });
}

export function sessionFailureResponse(error: unknown, operation: "refresh" | "session"): NextResponse {
  logSessionFailure(error, operation);
  const problem = error instanceof SessionError ? error : new SessionError(503, "network");
  const response = sessionProblem(problem.status, problem.title, problem.detail);
  if (problem.status === 401) clearSessionCookie(response);
  return response;
}

async function requestSession(operation: "refresh" | "logout", refreshToken: string): Promise<Response> {
  const signal = AbortSignal.timeout(SESSION_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/auth/${operation}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
      signal,
    });
  } catch {
    throw new SessionError(503, signal.aborted ? "timeout" : "network");
  }
  if (!response.ok) {
    if (response.status === 400 || response.status === 401) throw new SessionError(401, "rejected", response.status);
    throw new SessionError(response.status >= 500 ? 503 : 502, "upstream_http", response.status);
  }
  return response;
}

export function setSessionCookie(response: NextResponse, refreshToken: string): void {
  response.cookies.set(COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function refreshSession(refreshToken: string): Promise<TokenResponse> {
  if (USE_MOCK) {
    if (refreshToken !== "mock-refresh-token-67890") throw new SessionError(401, "rejected");
    return { accessToken: "mock-jwt-access-token-12345", refreshToken, expiresIn: 900 };
  }
  const response = await requestSession("refresh", refreshToken);
  const tokens: unknown = await response.json().catch((error: unknown) => {
    if (error instanceof Error && (error.name === "AbortError" || error.name === "TimeoutError")) {
      throw new SessionError(503, "timeout", response.status);
    }
    return null;
  });
  if (!tokens || typeof tokens !== "object" ||
      !("accessToken" in tokens) || typeof tokens.accessToken !== "string" || !tokens.accessToken.trim() ||
      !("refreshToken" in tokens) || typeof tokens.refreshToken !== "string" || !tokens.refreshToken.trim() ||
      !("expiresIn" in tokens) || typeof tokens.expiresIn !== "number" || !Number.isFinite(tokens.expiresIn) || tokens.expiresIn <= 0) {
    throw new SessionError(502, "invalid_response", response.status);
  }
  return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, expiresIn: tokens.expiresIn };
}

export async function revokeSession(refreshToken: string): Promise<void> {
  if (USE_MOCK) return;
  await requestSession("logout", refreshToken);
}
