import { apiFetch, setAccessToken } from "@/lib/api/client";
import { simulateNetworkDelay, USE_MOCK } from "@/lib/config";
import { currentUser } from "@/lib/mock-data";
import type { AuthResponse, GoogleLoginRequest, User } from "@/types";

/**
 * Autentica o usuário com o token emitido pelo Google Identity Services.
 * // POST /auth/google
 */
export async function loginWithGoogle(data: GoogleLoginRequest): Promise<AuthResponse> {
  if (USE_MOCK) {
    await simulateNetworkDelay(400);
    const mockAuth: AuthResponse = {
      accessToken: "mock-jwt-access-token-12345",
      refreshToken: "mock-refresh-token-67890",
      expiresIn: 900,
      user: currentUser,
    };
    setAccessToken(mockAuth.accessToken);
    return mockAuth;
  }

  const response = await apiFetch<AuthResponse>("/auth/google", {
    method: "POST",
    body: JSON.stringify(data),
  });

  if (response.accessToken) {
    setAccessToken(response.accessToken);
  }

  return response;
}

/**
 * Encerra a sessão do usuário no backend e limpa o token em memória.
 * O Route Handler lê o refresh token httpOnly e revoga a sessão no backend.
 */
export async function logout(): Promise<void> {
  // Invalida imediatamente qualquer renovação que ainda esteja em andamento.
  setAccessToken(null);
  try {
    const response = await fetch("/api/auth/logout", { method: "POST" });
    if (!response.ok) throw new Error("Não foi possível encerrar a sessão.");
  } finally {
    setAccessToken(null);
  }
}

/**
 * Retorna os dados cadastrais da usuária autenticada.
 * // GET /users/me
 */
export async function getMe(): Promise<User> {
  if (USE_MOCK) {
    await simulateNetworkDelay(300);
    return currentUser;
  }

  return apiFetch<User>("/users/me");
}

export async function deleteMe(): Promise<void> {
  if (USE_MOCK) {
    await simulateNetworkDelay();
    return;
  }
  await apiFetch<void>("/users/me", { method: "DELETE" });
}

