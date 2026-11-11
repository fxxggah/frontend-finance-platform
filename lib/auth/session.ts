import { NextResponse } from "next/server";
import { API_BASE_URL, USE_MOCK } from "@/lib/config";

import { ApiError } from "@/lib/api/errors";
import type { TokenResponse } from "@/types";

const COOKIE_NAME = "fin_session";
const MAX_AGE = 7 * 24 * 60 * 60;

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
    if (refreshToken !== "mock-refresh-token-67890") throw new Error("Sessão inválida");
    return { accessToken: "mock-jwt-access-token-12345", refreshToken, expiresIn: 900 };
  }
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
    cache: "no-store",
  });
  if (!response.ok) throw new ApiError({ status: response.status, title: "Falha na renovação", detail: "Não foi possível renovar a sessão." });
  const tokens: TokenResponse = await response.json();
  if (!tokens.accessToken || !tokens.refreshToken) throw new Error("Resposta inválida");
  return tokens;
}

export async function revokeSession(refreshToken: string): Promise<void> {
  if (USE_MOCK) return;
  await fetch(`${API_BASE_URL}/auth/logout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
    cache: "no-store",
  });
}
